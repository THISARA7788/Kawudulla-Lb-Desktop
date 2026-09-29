const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const getMetaPath = () => {
  let baseDir;
  if (process.env.APPDATA) {
    baseDir = path.join(process.env.APPDATA, 'KawudullaLibrary', 'data');
  } else {
    baseDir = path.join(__dirname, '..', 'data');
  }
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return path.join(baseDir, 'sync_metadata.json');
};

const getSyncMeta = () => {
  try {
    const metaPath = getMetaPath();
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
  } catch (e) {}
  return { lastBackupTime: null, lastRestoreTime: null, lastError: null };
};

const saveSyncMeta = (meta) => {
  try {
    const metaPath = getMetaPath();
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save sync metadata:', e.message);
  }
};

class SyncService {
  constructor() {
    this.status = 'idle'; // 'idle' | 'backing_up' | 'restoring' | 'synced' | 'error' | 'offline'
    const meta = getSyncMeta();
    this.lastBackupTime = meta.lastBackupTime || meta.lastSyncTime || null;
    this.lastRestoreTime = meta.lastRestoreTime || null;
    this.lastError = null;
    this.isOnline = false;
    this.timer = null;
    this.cloudConnection = null;
  }

  init() {
    console.log('🔄 Automatic Local-to-Cloud Backup Engine initialized.');

    // Auto backup on startup after 3 seconds
    setTimeout(() => {
      this.autoBackup();
    }, 3000);

    // Continuous background backup every 15 minutes (LOCAL -> CLOUD ONLY)
    this.timer = setInterval(() => {
      this.autoBackup();
    }, 15 * 60 * 1000);
  }

  async checkCloudReachable() {
    const cloudUri = process.env.CLOUD_MONGODB_URI;
    if (!cloudUri) {
      return false;
    }
    try {
      if (!this.cloudConnection || this.cloudConnection.readyState !== 1) {
        this.cloudConnection = await mongoose.createConnection(cloudUri, {
          serverSelectionTimeoutMS: 4000,
          socketTimeoutMS: 20000,
        }).asPromise();
      }
      this.isOnline = true;
      return true;
    } catch (err) {
      this.isOnline = false;
      this.cloudConnection = null;
      return false;
    }
  }

  /**
   * Reconciles book availability against active borrow transactions on the local database.
   */
  async reconcileBookAvailability() {
    try {
      const Transaction = mongoose.model('Transaction');
      const Book = mongoose.model('Book');

      const activeAgg = await Transaction.aggregate([
        {
          $match: {
            returnDate: null,
            status: { $in: ['active', 'overdue'] }
          }
        },
        {
          $group: {
            _id: '$book',
            activeCount: { $sum: 1 }
          }
        }
      ]);

      const activeMap = new Map();
      activeAgg.forEach((item) => {
        if (item._id) {
          activeMap.set(item._id.toString(), item.activeCount);
        }
      });

      const books = await Book.find({ isDeleted: { $ne: true } });

      for (const book of books) {
        const borrowedCount = activeMap.get(book._id.toString()) || 0;
        const total = Number(book.totalCopies) || 1;
        const correctAvailable = Math.max(0, total - borrowedCount);
        const correctStatus = correctAvailable > 0 ? 'Available' : 'Borrowed';

        if (book.availableCopies !== correctAvailable || (book.status !== 'Reserved' && book.status !== correctStatus)) {
          console.log(`[Reconcile] Fixed Book "${book.title}": availableCopies = ${correctAvailable} (borrows: ${borrowedCount})`);
          book.availableCopies = correctAvailable;
          if (book.status !== 'Reserved') {
            book.status = correctStatus;
          }
          await book.save();
        }
      }
      // Also synchronize active overdue fines
      const { syncActiveOverdueFines } = require('../routes/fines');
      if (typeof syncActiveOverdueFines === 'function') {
        await syncActiveOverdueFines();
      }
    } catch (err) {
      console.warn('Reconcile error:', err.message);
    }
  }

  /**
   * Background automatic backup: ONLY writes Local -> Cloud.
   * NEVER downloads or overwrites local data.
   */
  async autoBackup() {
    if (this.status === 'backing_up' || this.status === 'restoring') return;

    const cloudUri = process.env.CLOUD_MONGODB_URI;
    if (!cloudUri) {
      this.status = 'offline';
      return;
    }

    try {
      const isReachable = await this.checkCloudReachable();
      if (!isReachable) {
        this.status = 'offline';
        return;
      }

      await this.runBackup();
    } catch (err) {
      this.status = 'error';
      this.lastError = err.message;
      console.error('Background Backup Error:', err.message);
    }
  }

  /**
   * ONE-WAY BACKUP: Push all local documents to MongoDB Cloud Atlas.
   */
  async runBackup() {
    if (!this.cloudConnection || this.cloudConnection.readyState !== 1) {
      const isReachable = await this.checkCloudReachable();
      if (!isReachable) {
        throw new Error('Cloud database is not reachable. Ensure internet is connected.');
      }
    }

    this.status = 'backing_up';
    this.lastError = null;
    console.log('☁️ [Backup] Pushing local library records to Cloud Atlas...');

    // Reconcile local books first before pushing
    await this.reconcileBookAvailability();

    const collections = [
      'users',
      'books',
      'transactions',
      'fines',
      'fineconfigs',
      'notifications',
      'bookrequests',
      'bookcounters',
      'usercounters',
      'transactioncounters',
      'finecounters',
    ];

    let totalPushed = 0;

    for (const collName of collections) {
      try {
        const localColl = mongoose.connection.collection(collName);
        const cloudColl = this.cloudConnection.collection(collName);

        const localDocs = await localColl.find({}).toArray();
        if (localDocs.length > 0) {
          const pushOps = localDocs.map((doc) => ({
            replaceOne: {
              filter: { _id: doc._id },
              replacement: doc,
              upsert: true,
            },
          }));
          await cloudColl.bulkWrite(pushOps, { ordered: false });
          totalPushed += localDocs.length;
        }
      } catch (collErr) {
        console.warn(`[Backup Warning] on ${collName}:`, collErr.message);
      }
    }

    this.lastBackupTime = new Date().toISOString();
    this.status = 'synced';
    saveSyncMeta({
      lastBackupTime: this.lastBackupTime,
      lastRestoreTime: this.lastRestoreTime,
      lastError: null,
    });

    console.log(`✅ [Backup Complete] Pushed ${totalPushed} records to Cloud Atlas at ${this.lastBackupTime}`);
    return { success: true, lastBackupTime: this.lastBackupTime, totalPushed };
  }

  /**
   * DISASTER RECOVERY RESTORE: Pulls all records from Cloud Atlas to Local Hard Drive.
   * ONLY runs when manually clicked by the librarian.
   */
  async restoreFromCloud() {
    if (!this.cloudConnection || this.cloudConnection.readyState !== 1) {
      const isReachable = await this.checkCloudReachable();
      if (!isReachable) {
        throw new Error('Cloud database is not reachable. Ensure internet is connected.');
      }
    }

    this.status = 'restoring';
    this.lastError = null;
    console.log('📥 [Restore] Restoring library database from Cloud Atlas to Local PC...');

    const collections = [
      'users',
      'books',
      'transactions',
      'fines',
      'fineconfigs',
      'notifications',
      'bookrequests',
      'bookcounters',
      'usercounters',
      'transactioncounters',
      'finecounters',
    ];

    let totalRestored = 0;

    for (const collName of collections) {
      try {
        const localColl = mongoose.connection.collection(collName);
        const cloudColl = this.cloudConnection.collection(collName);

        const cloudDocs = await cloudColl.find({}).toArray();
        if (cloudDocs.length > 0) {
          // Clear and restore collection to ensure clean state
          const pullOps = cloudDocs.map((doc) => ({
            replaceOne: {
              filter: { _id: doc._id },
              replacement: doc,
              upsert: true,
            },
          }));
          await localColl.bulkWrite(pullOps, { ordered: false });
          totalRestored += cloudDocs.length;
        }
      } catch (collErr) {
        console.warn(`[Restore Warning] on ${collName}:`, collErr.message);
      }
    }

    // Run reconciliation on the newly restored data
    await this.reconcileBookAvailability();

    this.lastRestoreTime = new Date().toISOString();
    this.status = 'synced';
    saveSyncMeta({
      lastBackupTime: this.lastBackupTime,
      lastRestoreTime: this.lastRestoreTime,
      lastError: null,
    });

    console.log(`✅ [Restore Complete] Restored ${totalRestored} records from Cloud Atlas to local storage at ${this.lastRestoreTime}`);
    return { success: true, lastRestoreTime: this.lastRestoreTime, totalRestored };
  }

  getStatus() {
    return {
      status: this.status,
      isOnline: this.isOnline,
      lastBackupTime: this.lastBackupTime,
      lastRestoreTime: this.lastRestoreTime,
      lastError: this.lastError,
      hasCloudConfig: !!process.env.CLOUD_MONGODB_URI,
    };
  }
}

const syncService = new SyncService();

module.exports = syncService;
