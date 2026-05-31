require('dotenv').config();
const mongoose = require('mongoose');
const { login } = require('./controllers/authController');

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mytuyen_admin:4rhH8JzYk568mdGi@cluster0.kr4zcrd.mongodb.net/iot_smart_home?appName=Cluster0');
  console.log('Connected!');

  const req = {
    body: {
      usernameOrEmail: 'admin',
      password: 'wrong_password'
    },
    ip: '127.0.0.1',
    headers: {}
  };

  const res = {
    status(code) {
      console.log('Status set to:', code);
      return this;
    },
    json(data) {
      console.log('JSON response:', JSON.stringify(data, null, 2));
      return this;
    }
  };

  try {
    console.log('Calling login()...');
    await login(req, res);
  } catch (err) {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
