require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

async function seedUsers() {
  await connectDB();

  // 1. Seed Admin
  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com';
  const adminPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'admin@123456';
  const adminHash = await bcrypt.hash(adminPassword, 12);

  await User.findOneAndUpdate(
    { $or: [{ username: adminUsername }, { email: adminEmail }] },
    {
      username: adminUsername,
      email: adminEmail,
      passwordHash: adminHash,
      role: 'admin',
      failedLoginAttempts: 0,
      isLocked: false,
      lastLoginIP: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.info('[SEED] Admin user seeded (username: admin)');

  // 2. Seed Homeowner
  const homeOwnerUsername = 'homeowner';
  const homeOwnerEmail = 'homeowner@example.com';
  const homeOwnerPassword = 'homeowner@123';
  const homeOwnerHash = await bcrypt.hash(homeOwnerPassword, 12);

  await User.findOneAndUpdate(
    { $or: [{ username: homeOwnerUsername }, { email: homeOwnerEmail }] },
    {
      username: homeOwnerUsername,
      email: homeOwnerEmail,
      passwordHash: homeOwnerHash,
      role: 'HomeOwner',
      failedLoginAttempts: 0,
      isLocked: false,
      lastLoginIP: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.info('[SEED] Homeowner user seeded (username: homeowner)');
}

seedUsers()
  .catch((error) => {
    console.error('[SEED] Failed to seed users:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });