/**
 * ====================================================================
 * SEED MOCK DATA SCRIPT - Populate Database with Random/Mock Data
 * ====================================================================
 * 
 * This script seeds the Library Management System with realistic:
 *   - 15 Books (various categories, publishers, copies)
 *   - 5 Main system users (Librarians, Teachers, Students)
 *   - 7 Additional random users (active, pending, rejected)
 *   - 6 Borrow Transactions (active, returned, overdue)
 *   - 3 Fines (unpaid, paid, etc.)
 * 
 * Usage:
 *   node seeds/seedMockData.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const FineConfig = require('../models/FineConfig');

// Load environment variables
dotenv.config();

const mockBooks = [
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "9780553380163",
    category: "Science",
    description: "Stephen Hawking's phenomenal, multi-million-copy bestseller, which introduces the most important theories of the cosmos to the general reader.",
    totalCopies: 5,
    availableCopies: 4, // 1 borrowed
    publisher: "Bantam Books",
    publishedYear: 1998
  },
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "9780262033848",
    category: "Technology",
    description: "A comprehensive introduction to the modern study of computer algorithms.",
    totalCopies: 3,
    availableCopies: 2, // 1 borrowed
    publisher: "MIT Press",
    publishedYear: 2009
  },
  {
    title: "The Art of Computer Programming",
    author: "Donald Knuth",
    isbn: "9780201896831",
    category: "Technology",
    description: "The bible of all fundamental algorithms and programming techniques.",
    totalCopies: 2,
    availableCopies: 2,
    publisher: "Addison-Wesley",
    publishedYear: 1997
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    category: "Fiction",
    description: "The exemplary novel of the Jazz Age, F. Scott Fitzgerald's third book stands as the supreme achievement of his career.",
    totalCopies: 8,
    availableCopies: 7, // 1 borrowed
    publisher: "Scribner",
    publishedYear: 2004
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    category: "Fiction",
    description: "Compassionate, dramatic, and deeply moving, To Kill a Mockingbird takes readers to the roots of human behavior.",
    totalCopies: 6,
    availableCopies: 6,
    publisher: "Harper Perennial Modern Classics",
    publishedYear: 2006
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    category: "History",
    description: "From a renowned historian comes a groundbreaking narrative of humanity's creation and evolution.",
    totalCopies: 4,
    availableCopies: 4,
    publisher: "Harper",
    publishedYear: 2015
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    category: "Technology",
    description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
    totalCopies: 4,
    availableCopies: 4, // 1 was borrowed and returned, so availability restored to 4
    publisher: "Prentice Hall",
    publishedYear: 2008
  },
  {
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt",
    isbn: "9780135957059",
    category: "Technology",
    description: "One of the most significant books in software development, helping programmers create better software.",
    totalCopies: 3,
    availableCopies: 3, // 1 was borrowed and returned
    publisher: "Addison-Wesley Professional",
    publishedYear: 2019
  },
  {
    title: "Calculus",
    author: "Michael Spivak",
    isbn: "9780914098911",
    category: "Mathematics",
    description: "An outstanding introduction to math analysis, focusing on absolute rigor and clear proofs.",
    totalCopies: 3,
    availableCopies: 3,
    publisher: "Publish or Perish",
    publishedYear: 2008
  },
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    isbn: "9781451648539",
    category: "Biography",
    description: "The exclusive biography of Steve Jobs, co-founder of Apple, based on more than forty interviews.",
    totalCopies: 3,
    availableCopies: 3,
    publisher: "Simon & Schuster",
    publishedYear: 2011
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    category: "Fiction",
    description: "A fantasy novel and children's book by English author J. R. R. Tolkien, set in a prehistoric world.",
    totalCopies: 10,
    availableCopies: 10,
    publisher: "Mariner Books",
    publishedYear: 2012
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    isbn: "9780345331359",
    category: "Science",
    description: "The story of cosmic evolution, science, and civilization, exploring the universe in all its dimensions.",
    totalCopies: 3,
    availableCopies: 2, // 1 borrowed
    publisher: "Ballantine Books",
    publishedYear: 1985
  },
  {
    title: "Educated",
    author: "Tara Westover",
    isbn: "9780399588174",
    category: "Biography",
    description: "An unforgettable memoir about a young girl who, kept out of school, leaves her survivalist family and earns a PhD from Cambridge.",
    totalCopies: 4,
    availableCopies: 4,
    publisher: "Random House",
    publishedYear: 2018
  },
  {
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    isbn: "9780393317558",
    category: "History",
    description: "The fates of human societies, explaining why some succeeded while others struggled.",
    totalCopies: 3,
    availableCopies: 3,
    publisher: "W. W. Norton & Company",
    publishedYear: 1999
  },
  {
    title: "Principles of Mathematical Analysis",
    author: "Walter Rudin",
    isbn: "9780070542334",
    category: "Mathematics",
    description: "Known affectionately as 'Baby Rudin', this is a classic text on real analysis.",
    totalCopies: 2,
    availableCopies: 2,
    publisher: "McGraw-Hill",
    publishedYear: 1976
  }
];

const mainSystemUsers = [
  {
    name: 'Librarian',
    email: 'admin@library.com',
    password: 'admin123456',
    role: 'librarian',
    grade: '',
    status: 'active',
  },
  {
    name: 'School Librarian',
    email: 'librarian@kmv.edu',
    password: 'password123',
    role: 'librarian',
    grade: '',
    status: 'active',
  },
  {
    name: 'School Teacher',
    email: 'teacher@kmv.edu',
    password: 'password123',
    role: 'teacher',
    grade: '',
    status: 'active',
  },
  {
    name: 'Student User',
    email: 'student@kmv.edu',
    password: 'password123',
    role: 'student',
    grade: '10A',
    status: 'active',
  },
  {
    name: 'Admin Librarian',
    email: 'librarian@school.edu',
    password: 'Admin123',
    role: 'librarian',
    grade: '',
    status: 'active',
  }
];

const mockAdditionalUsers = [
  {
    name: 'Amara Perera',
    email: 'amara@kmv.edu',
    password: 'password123',
    role: 'student',
    grade: '10',
    class: 'A',
    stream: 'Ordinary Level',
    status: 'active',
  },
  {
    name: 'Nimal Silva',
    email: 'nimal@kmv.edu',
    password: 'password123',
    role: 'student',
    grade: '11',
    class: 'B',
    stream: 'Ordinary Level',
    status: 'active',
  },
  {
    name: 'Kamal Fernando',
    email: 'kamal@kmv.edu',
    password: 'password123',
    role: 'student',
    grade: '12',
    class: 'C',
    stream: 'Physical Science',
    status: 'active',
  },
  {
    name: 'Sunethra Ranasinghe',
    email: 'sunethra@kmv.edu',
    password: 'password123',
    role: 'teacher',
    grade: '',
    class: '',
    stream: '',
    status: 'active',
  },
  {
    name: 'Priyantha Bandara',
    email: 'priyantha@kmv.edu',
    password: 'password123',
    role: 'teacher',
    grade: '',
    class: '',
    stream: '',
    status: 'active',
  },
  {
    name: 'Devi Kumari',
    email: 'devi@kmv.edu',
    password: 'password123',
    role: 'student',
    grade: '13',
    class: 'A',
    stream: 'Bio Science',
    status: 'pending',
  },
  {
    name: 'Rohan de Silva',
    email: 'rohan@kmv.edu',
    password: 'password123',
    role: 'student',
    grade: '12',
    class: 'B',
    stream: 'Commerce',
    status: 'rejected',
    rejectionReason: 'Invalid admission number format',
  }
];

const seedData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB.');

    // Clear existing collections to start fresh
    console.log('🧹 Clearing collections: books, transactions, fines, notifications, user counters, book counters...');
    await Book.deleteMany({});
    await Transaction.deleteMany({});
    await Fine.deleteMany({});
    
    // Clear notifications if they exist
    try {
      await mongoose.connection.db.collection('notifications').deleteMany({});
    } catch (e) {
      console.log('Notifications collection not cleared or doesn\'t exist.');
    }

    // Reset auto-increment counters
    try {
      await mongoose.connection.db.collection('bookcounters').deleteMany({});
      await mongoose.connection.db.collection('usercounters').deleteMany({});
    } catch (e) {
      console.log('Counters collections not cleared or don\'t exist.');
    }

    // Clear all users
    console.log('🧹 Clearing all users...');
    await User.deleteMany({});

    // Seed Books
    console.log(`📚 Seeding ${mockBooks.length} books...`);
    const insertedBooks = [];
    for (const b of mockBooks) {
      const book = await Book.create(b);
      insertedBooks.push(book);
    }
    console.log('✅ Books seeded.');

    // Seed Main System Users
    console.log('👥 Seeding main system users...');
    const usersMap = {};
    for (const u of mainSystemUsers) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        usersMap[u.email] = existing;
      } else {
        const user = await User.create(u);
        usersMap[u.email] = user;
      }
    }

    // Seed Additional Users
    console.log('👥 Seeding additional random users...');
    for (const u of mockAdditionalUsers) {
      const user = await User.create(u);
      usersMap[u.email] = user;
    }
    console.log('✅ Users seeded.');

    // Setup Fine Configuration if none exists
    let fineConfig = await FineConfig.findOne();
    if (!fineConfig) {
      fineConfig = await FineConfig.create({
        fineRatePerDay: 10,
        gracePeriodDays: 0
      });
      console.log('✅ Fine configuration initialized.');
    }

    // Reference dates for transactions
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    // We'll create specific transactions
    console.log('💸 Seeding transactions and fines...');

    // 1. Active transaction (Amara Perera borrows "The Great Gatsby", due in 7 days)
    const bookGatsby = insertedBooks.find(b => b.title === "The Great Gatsby");
    const userAmara = usersMap["amara@kmv.edu"];
    const trx1 = await Transaction.create({
      user: userAmara._id,
      book: bookGatsby._id,
      issueDate: new Date(now.getTime() - 7 * oneDay),
      dueDate: new Date(now.getTime() + 7 * oneDay),
      status: 'active',
      notes: 'Active borrow',
      issuedBy: usersMap["librarian@kmv.edu"]._id
    });
    userAmara.borrowedBooks.push({
      book: bookGatsby._id,
      borrowDate: trx1.issueDate,
      dueDate: trx1.dueDate,
      returnDate: null
    });
    await userAmara.save();

    // 2. Active transaction (Sunethra Ranasinghe borrows "Introduction to Algorithms", due in 10 days)
    const bookAlgo = insertedBooks.find(b => b.title === "Introduction to Algorithms");
    const userSunethra = usersMap["sunethra@kmv.edu"];
    const trx2 = await Transaction.create({
      user: userSunethra._id,
      book: bookAlgo._id,
      issueDate: new Date(now.getTime() - 4 * oneDay),
      dueDate: new Date(now.getTime() + 10 * oneDay),
      status: 'active',
      notes: 'Issued for lecture prep',
      issuedBy: usersMap["librarian@kmv.edu"]._id
    });
    userSunethra.borrowedBooks.push({
      book: bookAlgo._id,
      borrowDate: trx2.issueDate,
      dueDate: trx2.dueDate,
      returnDate: null
    });
    await userSunethra.save();

    // 3. Overdue transaction (Nimal Silva borrows "A Brief History of Time", due 6 days ago)
    const bookBriefHistory = insertedBooks.find(b => b.title === "A Brief History of Time");
    const userNimal = usersMap["nimal@kmv.edu"];
    const trx3 = await Transaction.create({
      user: userNimal._id,
      book: bookBriefHistory._id,
      issueDate: new Date(now.getTime() - 20 * oneDay),
      dueDate: new Date(now.getTime() - 6 * oneDay),
      status: 'overdue',
      notes: 'Urgent return needed',
      issuedBy: usersMap["librarian@kmv.edu"]._id
    });
    userNimal.borrowedBooks.push({
      book: bookBriefHistory._id,
      borrowDate: trx3.issueDate,
      dueDate: trx3.dueDate,
      returnDate: null
    });
    await userNimal.save();

    // Create an unpaid fine for Nimal (6 days overdue * Rs. 10 = Rs. 60)
    await Fine.create({
      transaction: trx3._id,
      user: userNimal._id,
      book: bookBriefHistory._id,
      amount: 60,
      daysOverdue: 6,
      ratePerDay: 10,
      status: 'unpaid',
      notes: 'Auto-generated overdue fine'
    });

    // 4. Overdue transaction (Kamal Fernando borrows "Cosmos", due 11 days ago)
    const bookCosmos = insertedBooks.find(b => b.title === "Cosmos");
    const userKamal = usersMap["kamal@kmv.edu"];
    const trx4 = await Transaction.create({
      user: userKamal._id,
      book: bookCosmos._id,
      issueDate: new Date(now.getTime() - 25 * oneDay),
      dueDate: new Date(now.getTime() - 11 * oneDay),
      status: 'overdue',
      notes: '',
      issuedBy: usersMap["librarian@kmv.edu"]._id
    });
    userKamal.borrowedBooks.push({
      book: bookCosmos._id,
      borrowDate: trx4.issueDate,
      dueDate: trx4.dueDate,
      returnDate: null
    });
    // Kamal will also have another book (returned), let's keep going before saving Kamal

    // Create an unpaid fine for Kamal (11 days overdue * Rs. 10 = Rs. 110)
    await Fine.create({
      transaction: trx4._id,
      user: userKamal._id,
      book: bookCosmos._id,
      amount: 110,
      daysOverdue: 11,
      ratePerDay: 10,
      status: 'unpaid',
      notes: 'Overdue fine'
    });

    // 5. Returned transaction (Kamal Fernando borrowed "Clean Code", due 2 days ago, returned 1 day ago - overdue by 1 day)
    const bookCleanCode = insertedBooks.find(b => b.title === "Clean Code");
    const trx5 = await Transaction.create({
      user: userKamal._id,
      book: bookCleanCode._id,
      issueDate: new Date(now.getTime() - 16 * oneDay),
      dueDate: new Date(now.getTime() - 2 * oneDay),
      returnDate: new Date(now.getTime() - 1 * oneDay),
      status: 'returned',
      overdueDays: 1,
      notes: 'Returned slightly late',
      issuedBy: usersMap["librarian@kmv.edu"]._id
    });
    userKamal.borrowedBooks.push({
      book: bookCleanCode._id,
      borrowDate: trx5.issueDate,
      dueDate: trx5.dueDate,
      returnDate: trx5.returnDate
    });
    await userKamal.save(); // Save Kamal with both borrow records

    // Create a paid fine for Kamal's returned book (1 day overdue * Rs. 10 = Rs. 10)
    await Fine.create({
      transaction: trx5._id,
      user: userKamal._id,
      book: bookCleanCode._id,
      amount: 10,
      daysOverdue: 1,
      ratePerDay: 10,
      status: 'paid',
      paidAt: new Date(now.getTime() - 1 * oneDay),
      notes: 'Paid at counter upon return'
    });

    // 6. Returned transaction (Sunethra Ranasinghe borrowed "The Pragmatic Programmer", returned on time)
    const bookPragmatic = insertedBooks.find(b => b.title === "The Pragmatic Programmer");
    const trx6 = await Transaction.create({
      user: userSunethra._id,
      book: bookPragmatic._id,
      issueDate: new Date(now.getTime() - 30 * oneDay),
      dueDate: new Date(now.getTime() - 16 * oneDay),
      returnDate: new Date(now.getTime() - 16 * oneDay),
      status: 'returned',
      notes: 'Returned on time',
      issuedBy: usersMap["librarian@kmv.edu"]._id
    });
    userSunethra.borrowedBooks.push({
      book: bookPragmatic._id,
      borrowDate: trx6.issueDate,
      dueDate: trx6.dueDate,
      returnDate: trx6.returnDate
    });
    await userSunethra.save(); // Save Sunethra with both borrow records

    console.log('✅ Transactions and fines seeded.');

    console.log('\n🌟 Database Mock Seeding Completed Successfully!');
    console.log('\n📋 Ready to Test Accounts:');
    console.log('  - Admin Librarian : admin@library.com / admin123456');
    console.log('  - Seed Librarian  : librarian@kmv.edu / password123');
    console.log('  - School Teacher   : teacher@kmv.edu   / password123');
    console.log('  - Student User    : student@kmv.edu   / password123');
    console.log('\n📚 Mock Data Summary:');
    console.log('  - Books Seeding Total : 15');
    console.log('  - Active Borrowings   : 2  (Amara Perera, Sunethra Ranasinghe)');
    console.log('  - Overdue Borrowings  : 2  (Nimal Silva, Kamal Fernando)');
    console.log('  - Returned Borrowings : 2  (Kamal Fernando - late, Sunethra Ranasinghe - on time)');
    console.log('  - Outstanding Fines   : 2  (Nimal Silva: Rs. 60, Kamal Fernando: Rs. 110)');
    console.log('  - Paid Fines          : 1  (Kamal Fernando: Rs. 10)');

  } catch (error) {
    console.error('❌ Error during mock seeding:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n📴 Database connection closed.');
    process.exit(0);
  }
};

seedData();
