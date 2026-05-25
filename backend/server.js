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

app.get('/health', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'iot-smart-home-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);

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

    server = app.listen(PORT, () => {
      console.info(`Server listening on port ${PORT}`);
    });

    // --- HIVEMQ CLOUD CONNECTION & EMULATION TRIGGER ---
    const mqttClient = mqtt.connect('mqtts://4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud:8883', {
      username: 'Tuyen',
      password: '123456789tT',
      clientId: 'TuyenHome_Backend_' + Math.random().toString(16).slice(2, 10)
    });

    mqttClient.on('connect', () => {
      console.log('✅ Backend successfully connected to HiveMQ Cloud!');
      // Trigger the virtual data factory
      startHouseDataEmulation(mqttClient);
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
```js
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

module.exports = { startHouseDataEmulation };
```
module.exports = app;
