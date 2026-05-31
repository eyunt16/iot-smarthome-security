const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://mytuyen_admin:4rhH8JzYk568mdGi@cluster0.kr4zcrd.mongodb.net/iot_smart_home?appName=Cluster0';

async function checkUsers() {
  console.log('Connecting...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  console.log('\n--- RAW ADMIN DOCUMENT ---');
  const admin = await usersCollection.findOne({ username: 'admin' });
  console.log(JSON.stringify(admin, null, 2));

  console.log('\n--- RAW HOMEOWNER DOCUMENT ---');
  const homeowner = await usersCollection.findOne({ username: 'homeowner' });
  console.log(JSON.stringify(homeowner, null, 2));

  await mongoose.disconnect();
}

checkUsers().catch(console.error);
