require('dotenv').config();

const cors = require('cors');
const mqtt = require('mqtt');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { authenticateJWT } = require('./middleware/auth');
const {
  requireGuest,
  requireHomeOwner,
  requireSuperAdmin,
} = require('./middleware/rbac');
const { sanitizeInput } = require('./middleware/sanitize');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.disable('x-powered-by');
app.set('trust proxy', 1);


function extractOriginsFromEnv(value) {
  if (!value) {
    return [];
  }

  const normalizedValue = String(value).trim();
  const urlMatches = normalizedValue.match(/https?:\/\/[^,\s)]+/g);

  if (urlMatches?.length) {
    return urlMatches.map((origin) => origin.trim());
  }

  return normalizedValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = [
  'https://iot-smarthome-security.vercel.app',
  'https://iot-smarthome-security-git-main-mytuyen-s-projects.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...extractOriginsFromEnv(process.env.FRONTEND_ORIGIN),
  ...extractOriginsFromEnv(process.env.FRONTEND_ORIGINS),
].filter((origin, index, array) => array.indexOf(origin) === index);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS blocked for origin: ' + origin));
    },
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Set-Cookie',
    ],
    exposedHeaders: [
      'Authorization',
      'Set-Cookie',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Global IP Ban Verification Middleware
async function checkIpBan(req, res, next) {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = typeof forwardedFor === 'string' && forwardedFor.trim() 
      ? forwardedFor.split(',')[0].trim() 
      : (req.ip || req.socket?.remoteAddress || null);
      
    if (clientIp) {
      const IpBan = require('./models/IpBan');
      const isBanned = await IpBan.findOne({ ipAddress: clientIp });
      if (isBanned) {
        return res.status(403).json({
          message: 'Access denied. Your IP address has been banned by the administrator.',
        });
      }
    }
    next();
  } catch (err) {
    next();
  }
}

app.use(checkIpBan);
app.use(sanitizeInput);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP. Please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again later.',
  },
});

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many incorrect PIN attempts. Please try again after 15 minutes.',
  },
});

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'iot-smart-home-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);

// --- SETTINGS ENDPOINTS ---
app.get('/api/auth/settings', authenticateJWT, async (req, res) => {
  try {
    const Setting = require('./models/Setting');
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ notif: true, datalog: true, emailalert: false });
    }
    return res.status(200).json(settings);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/settings', authenticateJWT, async (req, res) => {
  try {
    const { notif, datalog, emailalert } = req.body || {};
    const Setting = require('./models/Setting');
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }
    if (notif !== undefined) settings.notif = notif;
    if (datalog !== undefined) settings.datalog = datalog;
    if (emailalert !== undefined) settings.emailalert = emailalert;
    await settings.save();
    return res.status(200).json(settings);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Store global mqttClient reference for backend publishing
let globalMqttClient = null;

app.post('/api/auth/door/unlock', authenticateJWT, pinLimiter, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ message: 'PIN code is required.' });
    }

    const SecurityLog = require('./models/SecurityLog');

    if (pin !== '1234') {
      // Log failed PIN attempt
      await SecurityLog.create({
        eventType: 'LOGIN_FAILED',
        description: `Failed Smart Door Lock unlock attempt by user ${req.user.username}. Invalid PIN entered.`,
        ipAddress: req.ip || null,
        timestamp: new Date()
      });
      return res.status(401).json({ message: 'Incorrect PIN. Access Denied.' });
    }

    // Success! Log door unlocked
    await SecurityLog.create({
      eventType: 'DOOR_UNLOCKED',
      description: `Smart Door Lock successfully unlocked by user ${req.user.username}.`,
      ipAddress: req.ip || null,
      timestamp: new Date()
    });

    // Publish to HiveMQ Cloud MQTTS
    if (globalMqttClient && globalMqttClient.connected) {
      globalMqttClient.publish('home/door/control', 'unlock', { qos: 1 }, (err) => {
        if (err) {
          console.error('[MQTT Backend] Failed to publish door unlock:', err);
        } else {
          console.log('[MQTT Backend] Successfully published door unlock to home/door/control');
        }
      });
    } else {
      console.warn('[MQTT Backend] Broker not connected, simulating door unlock publish.');
    }

    return res.status(200).json({ message: 'PIN verified. Door Unlocked successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get('/api/secure/guest', authenticateJWT, requireGuest, (req, res) => {
  return res.status(200).json({
    message: 'Guest-level route reached successfully.',
    user: req.user,
  });
});

app.get(
  '/api/secure/homeowner',
  authenticateJWT,
  requireHomeOwner,
  (req, res) => {
    return res.status(200).json({
      message: 'HomeOwner-level route reached successfully.',
      user: req.user,
    });
  },
);

app.get(
  '/api/secure/superadmin',
  authenticateJWT,
  requireSuperAdmin,
  (req, res) => {
    return res.status(200).json({
      message: 'SuperAdmin-level route reached successfully.',
      user: req.user,
    });
  },
);

// --- THESIS VERIFICATION TEST ENDPOINTS ---
app.get('/api/sensors', authenticateJWT, requireGuest, (req, res) => {
  return res.status(200).json({
    message: 'Sensor data retrieved successfully (read-only access).',
    sensors: [
      { id: 'DHT11_TEMP', name: 'Temperature Sensor', value: 24.5, unit: '°C' },
      { id: 'DHT11_HUMID', name: 'Humidity Sensor', value: 60.2, unit: '%' }
    ]
  });
});

app.get('/api/sensors/history', authenticateJWT, requireGuest, (req, res) => {
  return res.status(200).json({
    message: 'Sensor history retrieved successfully (read-only access).',
    count: 3,
    history: [
      { timestamp: new Date(Date.now() - 60000).toISOString(), temperature: 24.2, humidity: 60.5, light: 750, motion: 'CLEAR' },
      { timestamp: new Date(Date.now() - 30000).toISOString(), temperature: 24.4, humidity: 60.3, light: 748, motion: 'CLEAR' },
      { timestamp: new Date().toISOString(), temperature: 24.5, humidity: 60.2, light: 749, motion: 'CLEAR' }
    ]
  });
});

app.post('/api/device/control', authenticateJWT, requireHomeOwner, (req, res) => {
  const { device, action, value } = req.body || {};
  
  if (globalMqttClient && globalMqttClient.connected) {
    let stateText = 'lock';
    if (value === 'ON' || value === '1' || value === 1 || action === 'unlock' || action === 'ON') {
      stateText = 'unlock';
    }
    globalMqttClient.publish('home/door/control', stateText, { qos: 1 }, (err) => {
      if (err) {
        console.error('[MQTT Backend] Failed to publish control command:', err);
      } else {
        console.log(`[MQTT Backend] Successfully published control to home/door/control: ${stateText}`);
      }
    });
  }

  return res.status(200).json({
    message: 'Control command sent successfully (write access).',
    device: device || 'light1',
    action: action || 'toggle',
    value: value || 'ON'
  });
});

app.get('/api/admin/locked-users', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const User = require('./models/User');
    const lockedUsers = await User.find({ isLocked: true })
      .select('_id username email failedLoginAttempts')
      .lean();
    return res.status(200).json({
      message: 'Locked users retrieved successfully (admin-only access).',
      count: lockedUsers.length,
      users: lockedUsers
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.use((req, res) => {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error('Unhandled application error:', error);

  if (res.headersSent) {
    return;
  }

  return res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error.',
  });
});

function startHouseDataEmulation(mqttClient) {
  const nodes = [
    {
      name: 'Living Room',
      topic: 'tuyenhome/env/livingroom',
      baseTemp: 27.5,
      baseHumidity: 60,
    },
    {
      name: 'Master Bedroom',
      topic: 'tuyenhome/env/bedroom',
      baseTemp: 24.0,
      baseHumidity: 55,
    },
    {
      name: 'Kitchen',
      topic: 'tuyenhome/env/kitchen',
      baseTemp: 31.2,
      baseHumidity: 70,
    },
  ];

  setInterval(() => {
    nodes.forEach((node) => {
      const temperature = (node.baseTemp + (Math.random() - 0.5) * 1.6).toFixed(1);
      const humidity = (node.baseHumidity + (Math.random() - 0.5) * 1.6).toFixed(1);

      const payload = {
        temperature,
        humidity,
      };

      mqttClient.publish(node.topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
          console.error(`[Emulation] Error publishing ${node.name}:`, err);
        } else {
          console.log(`[Emulation] Published ${node.name}: temperature=${temperature}°C, humidity=${humidity}%`);
        }
      });
    });
  }, 5000);
}

let server;

async function startServer() {
  try {
    await connectDB();

    // --- AUTOMATIC SUPERADMIN DATABASE SEEDING ---
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.info('[SEED] No users found in database. Automatically creating SuperAdmin account...');
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('admin@123456', 12);
      await User.create({
        username: 'admin',
        email: 'admin@smarthome.com',
        passwordHash,
        role: 'admin',
        failedLoginAttempts: 0,
        isLocked: false,
        lastLoginIP: null,
      });
      console.info('[SEED] Auto-seeded SuperAdmin: admin / admin@123456');
    }

    server = app.listen(PORT, () => {
      console.info(`Server listening on port ${PORT}`);
    });

    // --- HIVEMQ CLOUD CONNECTION & EMULATION TRIGGER ---
    const mqttClient = mqtt.connect('mqtts://4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud:8883', {
      username: 'Tuyen',
      password: '123456789tT',
      clientId: 'TuyenHome_Backend_' + Math.random().toString(16).slice(2, 10)
    });

    globalMqttClient = mqttClient;

    mqttClient.on('connect', () => {
      console.log('✅ Backend successfully connected to HiveMQ Cloud!');
      
      // Subscribe to relevant topics
      mqttClient.subscribe(['home/motion', 'tuyenhome/env/#', 'home/door/control'], { qos: 1 }, (err) => {
        if (err) {
          console.error('❌ Backend MQTT subscribe error:', err);
        } else {
          console.log('✅ Backend successfully subscribed to home/motion, tuyenhome/env/#, home/door/control');
        }
      });

      // Trigger the virtual data factory
      startHouseDataEmulation(mqttClient);
    });

    mqttClient.on('message', async (topic, message) => {
      const payloadText = message.toString();
      console.log(`[MQTT Backend] Topic: ${topic} | Payload: ${payloadText}`);

      try {
        const Setting = require('./models/Setting');
        let settings = await Setting.findOne();
        if (!settings) {
          settings = await Setting.create({ notif: true, datalog: true, emailalert: false });
        }

        if (topic === 'home/motion') {
          if (payloadText === '1') {
            // 1. Data Logging
            if (settings.datalog) {
              const SecurityLog = require('./models/SecurityLog');
              await SecurityLog.create({
                eventType: 'DEVICE_TRIGGERED',
                description: 'Motion detected via PIR passive infrared sensor.',
                resolved: false,
                timestamp: new Date(),
              });
              console.log('[MQTT Backend] Logged intrusion/motion event to DB.');
            }

            // 2. Email Alerts
            if (settings.emailalert) {
              const { sendSecurityAlert } = require('./utils/emailAlert');
              await sendSecurityAlert({
                subject: '[CRITICAL ALERT] PIR Motion Detected!',
                title: 'Motion Detected',
                message: 'PIR Passive Infrared Sensor HC-SR501 has detected motion at your residence. Please verify your security cameras and dashboard immediately.',
                metadata: {
                  sensor: 'PIR HC-SR501',
                  status: 'Alert',
                  actionRequired: 'Verify Smart Home Dashboard',
                },
              });
              console.log('[MQTT Backend] Sent motion detected security alert email.');
            }

            // 3. Push Notifications to Admins
            try {
              const User = require('./models/User');
              const { sendPushNotification } = require('./utils/pushNotification');
              const admins = await User.find({ role: { $in: ['admin', 'SuperAdmin'] } });
              const tokens = admins.reduce((acc, curr) => acc.concat(curr.expoPushTokens || []), []);
              if (tokens.length > 0) {
                await sendPushNotification(
                  tokens,
                  '🚨 Intrusion Detected',
                  'Motion near the PIR sensor!'
                );
                console.log('[MQTT Backend] Sent push notifications to admins.');
              }
            } catch (pushErr) {
              console.error('[MQTT Backend] Failed to send push notification:', pushErr);
            }
          }
        } else if (topic.startsWith('tuyenhome/env/')) {
          // Room environment telemetry logging
          if (settings.datalog) {
            const room = topic.split('/')[2]; // livingroom, bedroom, kitchen
            const data = JSON.parse(payloadText);
            
            const SensorLog = require('./models/SensorLog');
            
            // Helper to get or create Node & Device dynamically
            const getOrCreateNodeAndDevice = async (roomName, metricName) => {
              const Node = require('./models/Node');
              const Device = require('./models/Device');

              const formattedNodeId = `NODE_${roomName.toUpperCase()}`;
              let node = await Node.findOne({ nodeId: formattedNodeId });
              if (!node) {
                node = await Node.create({
                  nodeId: formattedNodeId,
                  name: `${roomName.charAt(0).toUpperCase() + roomName.slice(1)} Node`,
                  location: roomName.charAt(0).toUpperCase() + roomName.slice(1),
                  status: 'Online',
                  lastHeartbeat: new Date(),
                });
              }

              const deviceName = `${metricName.toUpperCase()}_SENSOR`;
              let device = await Device.findOne({ nodeId: node._id, deviceName });
              if (!device) {
                device = await Device.create({
                  nodeId: node._id,
                  deviceName,
                  type: 'Sensor',
                  currentValue: null,
                  pin: metricName === 'temperature' ? 4 : 5,
                });
              }

              return { nodeId: node._id, deviceId: device._id };
            };

            if (data.temperature !== undefined) {
              const { nodeId, deviceId } = await getOrCreateNodeAndDevice(room, 'temperature');
              await SensorLog.create({
                nodeId,
                deviceId,
                metric: 'temperature',
                value: Number(data.temperature),
                timestamp: new Date(),
              });
            }

            if (data.humidity !== undefined) {
              const { nodeId, deviceId } = await getOrCreateNodeAndDevice(room, 'humidity');
              await SensorLog.create({
                nodeId,
                deviceId,
                metric: 'humidity',
                value: Number(data.humidity),
                timestamp: new Date(),
              });
            }
            
            console.log(`[MQTT Backend] Telemetry for room [${room}] successfully logged to DB.`);
          }
        }
      } catch (error) {
        console.error('[MQTT Backend] Error processing message:', error);
      }
    });

    mqttClient.on('error', (err) => {
      console.error('❌ MQTT Connection Error:', err);
    });
    // ------------------------------------------------

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

function shutdown(signal) {
  console.warn(`Received ${signal}. Shutting down API server.`);

  if (!server) {
    process.exit(0);
    return;
  }

  server.close((error) => {
    if (error) {
      console.error('Error during HTTP server shutdown:', error);
      process.exit(1);
      return;
    }

    process.exit(0);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

startServer();

module.exports = app;
