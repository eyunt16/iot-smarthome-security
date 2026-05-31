const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb+srv://mytuyen_admin:4rhH8JzYk568mdGi@cluster0.kr4zcrd.mongodb.net/iot_smart_home?appName=Cluster0';
process.env.JWT_SECRET = 'replace_this_with_a_long_random_secret';

async function testLogin() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const User = require('./models/User');

  const usernameOrEmail = 'admin';
  const password = 'admin@123456';

  try {
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail },
        { username: usernameOrEmail },
      ],
    }).select('+passwordHash');

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('User found:', user.username, 'Role:', user.role);

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', isPasswordValid);

    if (isPasswordValid) {
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      user.lastLoginIP = '127.0.0.1';
      console.log('Saving user...');
      await user.save();
      console.log('User saved successfully!');

      console.log('Signing token...');
      const token = jwt.sign(
        {
          sub: user._id.toString(),
          role: user.role,
          username: user.username,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '12h',
          issuer: 'iot-smart-home-api',
          audience: 'iot-smart-home-clients',
        }
      );
      console.log('Token signed successfully:', token.slice(0, 30) + '...');
    } else {
      console.log('Invalid password!');
    }
  } catch (err) {
    console.error('EXCEPTION ENCOUNTERED IN LOGIN:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

testLogin();
