const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://mytuyen_admin:4rhH8JzYk568mdGi@cluster0.kr4zcrd.mongodb.net/iot_smart_home?appName=Cluster0';

async function checkUsers() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model('User', UserSchema, 'users');

  console.log('\n--- Fetching all users ---');
  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log({
      id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      isLocked: u.isLocked,
      failedLoginAttempts: u.failedLoginAttempts
    });
  });

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB.');
}

checkUsers().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
