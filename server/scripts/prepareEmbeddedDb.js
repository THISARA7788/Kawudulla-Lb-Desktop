const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

async function prepare() {
  console.log('📦 Preparing embedded local database binary...');
  const dbPath = path.join(__dirname, '..', 'data', 'db');
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

  const mongod = await MongoMemoryServer.create({
    instance: {
      dbPath: dbPath,
      storageEngine: 'wiredTiger',
      dbName: 'kawudulla_library_db',
    },
  });

  const uri = mongod.getUri();
  console.log(`✅ Embedded Local Database is ready!`);
  console.log(`URI: ${uri}`);
  console.log(`Data path: ${dbPath}`);

  await mongod.stop();
  console.log('Engine stopped cleanly.');
  process.exit(0);
}

prepare().catch(err => {
  console.error('Error preparing database:', err);
  process.exit(1);
});
