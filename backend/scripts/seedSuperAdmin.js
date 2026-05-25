require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

async function seedSuperAdmin() {
  const username = (process.env.SEED_SUPERADMIN_USERNAME || 'admin').trim().toLowerCase();
  const email = (process.env.SEED_SUPERADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const password = process.env.SEED_SUPERADMIN_PASSWORD || 'Admin@123456';

  if (!password || password.length < 8) {
    throw new Error('SEED_SUPERADMIN_PASSWORD must be at least 8 characters long.');
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.findOneAndUpdate(
    {
      $or: [{ username }, { email }],
    },
    {
      username,
      email,
      passwordHash,
      role: 'SuperAdmin',
      failedLoginAttempts: 0,
      isLocked: false,
      lastLoginIP: null,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  console.info('[SEED] SuperAdmin is ready');
  console.info(`[SEED] username: ${user.username}`);
  console.info(`[SEED] email: ${user.email}`);
  console.info(`[SEED] password: ${password}`);
}

seedSuperAdmin()
  .catch((error) => {
    console.error('[SEED] Failed to seed SuperAdmin:', error);

    const isLocalMongoRefused =
      error?.name === 'MongooseServerSelectionError'
      && String(process.env.MONGODB_URI || '').includes('127.0.0.1:27017');

    if (isLocalMongoRefused) {
      console.error('[SEED] No MongoDB server is reachable at 127.0.0.1:27017.');
      console.error('[SEED] Best fix: either start MongoDB locally, start Docker Desktop and run `docker compose up -d mongo`, or change MONGODB_URI in backend/.env to your MongoDB Atlas connection string.');
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
