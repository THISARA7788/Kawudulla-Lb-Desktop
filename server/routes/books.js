const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { localUpload } = require('../config/upload');
const Book = require('../models/Book');

// @route   POST /api/books/upload
// @desc    Upload cover image (Offline Local Storage)
// @access  Private (Librarian)
router.post('/upload', protect, authorize('librarian'), localUpload.single('coverImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or upload failed' });
    }
    // Return relative URL that is served statically by Express
    const fileUrl = `/uploads/covers/${req.file.filename}`;
    res.json({ secure_url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Image upload error:', error.message);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// @route   POST /api/books
// @desc    Save a new book in the database
// @access  Private (Librarian)
router.post('/', protect, authorize('librarian'), async (req, res) => {
  try {
    const { title, author, isbn, category, description, totalCopies, publisher, publishedYear, coverImageUrl, status } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({ message: 'Title, author, and category are required' });
    }

    // Check duplicate ISBN (only if isbn is provided)
    if (isbn && isbn.trim()) {
      const duplicate = await Book.findOne({ isbn: isbn.trim() });
      if (duplicate) {
        if (duplicate.isDeleted) {
          // Reactivate/restore the soft-deleted book and update its fields
          duplicate.isDeleted = false;
          duplicate.title = title;
          duplicate.author = author;
          duplicate.category = category;
          duplicate.description = description || '';
          duplicate.totalCopies = Number(totalCopies) || 1;
          duplicate.availableCopies = Number(totalCopies) || 1;
          duplicate.publisher = publisher || '';
          duplicate.publishedYear = publishedYear ? Number(publishedYear) : undefined;
          duplicate.coverImageUrl = coverImageUrl || '';
          duplicate.status = status || 'Available';
          
          await duplicate.save();
          return res.status(201).json({ message: 'Book saved successfully (restored from archived)', book: duplicate });
        } else {
          return res.status(400).json({ message: 'A book with this ISBN already exists', existingBook: duplicate });
        }
      }
    }

    const book = await Book.create({
      title,
      author,
      isbn: isbn ? isbn.trim() : undefined,
      category,
      description,
      totalCopies: Number(totalCopies) || 1,
      availableCopies: Number(totalCopies) || 1,
      publisher,
      publishedYear: publishedYear ? Number(publishedYear) : undefined,
      coverImageUrl: coverImageUrl || '',
      status: status || 'Available',
    });

    res.status(201).json({ message: 'Book saved successfully', book });
  } catch (error) {
    console.error('Save book error:', error.message);
    res.status(500).json({ message: 'Server error while saving book' });
  }
});

const { lookupSriLankanISBN } = require('../utils/isbnLkpHelper');

// @route   GET /api/books/check/:isbn
// @desc    Check if a book with the given ISBN exists
// @access  Private (Librarian)
router.get('/check/:isbn', protect, authorize('librarian'), async (req, res) => {
  try {
    const { isbn } = req.params;
    const book = await Book.findOne({ isbn: isbn.trim(), isDeleted: { $ne: true } });
    
    if (book) {
      return res.json({ exists: true, book });
    }
    res.json({ exists: false });
  } catch (error) {
    console.error('Check book error:', error.message);
    res.status(500).json({ message: 'Server error while checking book' });
  }
});

// @route   GET /api/books/lookup-srilanka/:isbn
// @desc    Scrape details of a Sri Lankan book by ISBN
// @access  Private (Librarian)
// @route   GET /api/books/lookup-srilanka/:isbn
// @desc    Scrape details of a Sri Lankan book by ISBN
// @access  Private (Librarian)
router.get('/lookup-srilanka/:isbn', protect, authorize('librarian'), async (req, res) => {
  try {
    const { isbn } = req.params;
    const details = await lookupSriLankanISBN(isbn);
    if (details) {
      return res.json({ success: true, book: details });
    }
    res.json({ success: false, message: 'Book not found in Sri Lankan registry' });
  } catch (error) {
    console.error('Sri Lankan ISBN lookup error:', error.message);
    res.status(500).json({ message: 'Server error during Sri Lankan ISBN lookup' });
  }
});

// @route   GET /api/books/lookup-isbn/:isbn
// @desc    Lookup book details by ISBN from Google Books, Open Library, or Sri Lankan Registry
// @access  Private (Librarian)
router.get('/lookup-isbn/:isbn', protect, authorize('librarian'), async (req, res) => {
  try {
    const { isbn } = req.params;
    const cleanIsbn = isbn.trim().replace(/[-\s]/g, '');

    let bookData = null;

    // Determine if it is a Sri Lankan ISBN
    const isSriLankan = (cleanIsbn.length === 13 && (cleanIsbn.startsWith('978955') || cleanIsbn.startsWith('978624')))
      || (cleanIsbn.length === 10 && cleanIsbn.startsWith('955'));

    // 1. If it's a Sri Lankan ISBN, query the Sri Lankan Registry FIRST to get the native Sinhala titles
    if (isSriLankan) {
      try {
        const slDetails = await lookupSriLankanISBN(cleanIsbn);
        if (slDetails) {
          bookData = {
            title: slDetails.title || '',
            author: slDetails.author || '',
            publisher: slDetails.publisher || '',
            publishedYear: slDetails.publishedYear || '',
            description: '',
            coverImageUrl: ''
          };
        }
      } catch (slErr) {
        console.warn('Sri Lankan Registry lookup failed, falling back to Google Books:', slErr.message);
      }
    }

    // 2. Query Google Books API (uses API Key from environment if defined)
    if (!bookData) {
      try {
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        const url = apiKey 
          ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`
          : `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
        
        const response = await fetch(url);
        if (response.status === 200) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            const info = data.items[0].volumeInfo;
            bookData = {
              title: info.title || '',
              author: info.authors ? info.authors.join(', ') : '',
              publisher: info.publisher || '',
              publishedYear: info.publishedDate ? info.publishedDate.split('-')[0] : '',
              description: info.description || '',
              coverImageUrl: info.imageLinks ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail) : '',
            };
          }
        } else {
          console.warn(`Google Books API returned status ${response.status} for ${cleanIsbn}`);
        }
      } catch (gErr) {
        console.warn('Google Books API query failed, moving to fallbacks:', gErr.message);
      }
    }

    // 3. Fallback to Open Library API
    if (!bookData) {
      try {
        const olResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
        if (olResponse.ok) {
          const olData = await olResponse.json();
          const key = `ISBN:${cleanIsbn}`;
          if (olData[key]) {
            const info = olData[key];
            bookData = {
              title: info.title || '',
              author: info.authors ? info.authors.map(a => a.name).join(', ') : '',
              publisher: info.publishers ? info.publishers.map(p => p.name).join(', ') : '',
              publishedYear: info.published_date ? info.published_date.split(' ').pop() : '',
              description: typeof info.notes === 'string' ? info.notes : '',
              coverImageUrl: info.cover ? (info.cover.large || info.cover.medium || info.cover.small) : '',
            };
          }
        }
      } catch (olErr) {
        console.warn('Open Library fallback failed:', olErr.message);
      }
    }

    // 4. Fallback to Sri Lankan National Registry if it wasn't queried first
    if (!bookData && !isSriLankan) {
      try {
        const slDetails = await lookupSriLankanISBN(cleanIsbn);
        if (slDetails) {
          bookData = {
            title: slDetails.title || '',
            author: slDetails.author || '',
            publisher: slDetails.publisher || '',
            publishedYear: slDetails.publishedYear || '',
            description: '',
            coverImageUrl: ''
          };
        }
      } catch (slErr) {
        console.warn('Sri Lankan registry lookup failed:', slErr.message);
      }
    }

    if (bookData) {
      return res.json({ success: true, book: bookData });
    }
    res.json({ success: false, message: 'ISBN code not found in databases. Please enter details manually.' });
  } catch (error) {
    console.error('ISBN lookup route error:', error.message);
    res.status(500).json({ message: 'Server error during ISBN lookup' });
  }
});

module.exports = router;
