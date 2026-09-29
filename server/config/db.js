const fs = require('fs');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');

// Configure DNS servers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

let mongodInstance = null;

const getDbPath = () => {
  let baseDir = process.env.DATA_PATH;
  if (!baseDir) {
    if (process.env.APPDATA) {
      baseDir = path.join(process.env.APPDATA, 'KawudullaLibrary', 'data', 'db');
    } else {
      baseDir = path.join(__dirname, '..', 'data', 'db');
    }
  }
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
};

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    const isLocalMode = process.env.DB_MODE === 'local' || !mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');

    if (isLocalMode && (!mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost'))) {
      try {
        const testConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/kawudulla_library_db', {
          serverSelectionTimeoutMS: 1500,
        }).asPromise();
        await testConn.close();
        mongoUri = 'mongodb://127.0.0.1:27017/kawudulla_library_db';
        console.log('Connected to existing local MongoDB service on 127.0.0.1:27017');
      } catch (err) {
        console.log('Starting bundled standalone database engine...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const dbPath = getDbPath();

        const bundledBinary = path.join(__dirname, '..', 'bin', 'mongod.exe');
        const binaryOptions = {};
        if (fs.existsSync(bundledBinary)) {
          process.env.MONGOMS_SYSTEM_BINARY = bundledBinary;
          binaryOptions.systemBinary = bundledBinary;
        }

        mongodInstance = await MongoMemoryServer.create({
          binary: binaryOptions,
          instance: {
            dbPath: dbPath,
            storageEngine: 'wiredTiger',
            dbName: 'kawudulla_library_db',
          },
        });
        mongoUri = mongodInstance.getUri();
        console.log(`Embedded Local Database started at: ${mongoUri}`);
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
  }
};

const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (e) {
    console.error('Error closing database:', e.message);
  }
};

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = connectDB;
module.exports.closeDB = closeDB;
