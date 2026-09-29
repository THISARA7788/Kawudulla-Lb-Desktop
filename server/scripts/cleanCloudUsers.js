const mongoose = require('mongoose');

// Direct ReplicaSet connection URI (bypasses DNS SRV timeouts on any network)
const DIRECT_URI = 'mongodb://KaudullaLB:LB123@ac-0oplgji-shard-00-00.ubtr0ci.mongodb.net:27017,ac-0oplgji-shard-00-01.ubtr0ci.mongodb.net:27017,ac-0oplgji-shard-00-02.ubtr0ci.mongodb.net:27017/kawudulla_school_db_real?ssl=true&replicaSet=atlas-piu4w9-shard-0&authSource=admin&retryWrites=true&w=majority';

async function clean() {
  console.log('Connecting to cloud database using direct endpoints...');
  const c = await mongoose.createConnection(DIRECT_URI, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();

  console.log('Connected to cloud DB!');
  const users = await c.collection('users').find({ email: 'admin@library.com' }).toArray();
  console.log('Found admin accounts in cloud:', users.length);

  if (users.length > 1) {
    const keepId = users[0]._id;
    const res = await c.collection('users').deleteMany({
      email: 'admin@library.com',
      _id: { $ne: keepId }
    });
    console.log(`Deleted ${res.deletedCount} duplicate admin accounts.`);
  }

  const total = await c.collection('users').countDocuments();
  console.log(`Total clean members in cloud: ${total}`);

  await c.close();
  console.log('✅ Cleanup complete!');
  process.exit(0);
}

clean().catch(err => {
  console.error('Clean error:', err.message);
  process.exit(1);
});
