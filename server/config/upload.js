const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Determine safe writable location for uploads
const getUploadDir = () => {
  let baseDir;
  if (process.env.APPDATA) {
    baseDir = path.join(process.env.APPDATA, 'KawudullaLibrary', 'uploads', 'covers');
  } else {
    baseDir = path.join(__dirname, '..', 'uploads', 'covers');
  }
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
};

const uploadDir = getUploadDir();

// Local disk storage for offline-first support
const localDiskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getUploadDir());
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `cover-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const isMime = allowed.test(file.mimetype);
  const isExt = allowed.test(path.extname(file.originalname).toLowerCase());

  if (isMime && isExt) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'));
};

const localUpload = multer({
  storage: localDiskStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

module.exports = {
  localUpload,
  uploadDir,
  getUploadDir,
};
