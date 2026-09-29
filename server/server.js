const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const syncService = require('./services/syncService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to Local / Configured Database
connectDB().then(() => {
  // Start background sync engine
  syncService.init();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Local Uploads statically (Offline Cover Images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes (specific routes must be registered before general /api/library)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/books', require('./routes/books'));
app.use('/api/library/fines', require('./routes/fines'));
app.use('/api/library/reports', require('./routes/reports'));
app.use('/api/library', require('./routes/quickLookup'));
app.use('/api/library', require('./routes/library'));
app.use('/api/book-requests', require('./routes/bookRequests'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/sync', require('./routes/sync'));

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'Kawudulla Library API is running (Offline Local Capable)' });
});

// Serve React static files (from built frontend)
const buildPath = path.resolve(__dirname, '..', 'client', 'build');
app.use(express.static(buildPath));

// All non-API routes serve the React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is already in use. Reusing running server instance.`);
  } else {
    console.error('Server error:', err.message);
  }
});
