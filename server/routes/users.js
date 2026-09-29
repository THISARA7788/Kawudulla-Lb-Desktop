const express = require('express');
const router = express.Router();
const multer = require('multer');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');

const inMemoryStorage = multer.memoryStorage();
const uploadFile = multer({ storage: inMemoryStorage });

const parseCSVText = (csvText) => {
  const parsedRows = [];
  let row = [''];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++; // skip double quote escape
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      parsedRows.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    parsedRows.push(row);
  }
  return parsedRows;
};

const getCellValueText = (cell) => {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'object') {
    if (cell.value.text) return String(cell.value.text);
    if (cell.value.hyperlink) return String(cell.value.text || cell.value.hyperlink.replace(/^mailto:/i, ''));
    if (cell.value.result !== undefined) return String(cell.value.result);
    if (cell.value.richText && Array.isArray(cell.value.richText)) {
      return cell.value.richText.map((t) => t.text || '').join('');
    }
    return '';
  }
  return String(cell.value).trim();
};

/**
 * =============================================
 * USER MANAGEMENT ROUTES (Librarian Only)
 * =============================================
 * All routes below: GET/PUT/DELETE /api/users/...
 */

// POST /api/users/import - Bulk import members via Excel file or CSV
router.post('/import', protect, authorize('librarian'), uploadFile.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
    }

    const defaultPassword = (req.body.defaultPassword && req.body.defaultPassword.trim().length >= 6)
      ? req.body.defaultPassword.trim()
      : 'Kmv@1234';

    let rawRows = [];
    const originalName = (req.file.originalname || '').toLowerCase();

    if (originalName.endsWith('.csv')) {
      const csvContent = req.file.buffer.toString('utf-8');
      rawRows = parseCSVText(csvContent);
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return res.status(400).json({ message: 'The uploaded Excel workbook contains no readable sheets.' });
      }

      worksheet.eachRow({ includeEmpty: false }, (row) => {
        const rowValues = [];
        const maxCols = Math.max(worksheet.columnCount || 0, row.cellCount || 0, 15);
        for (let col = 1; col <= maxCols; col++) {
          const cell = row.getCell(col);
          rowValues.push(getCellValueText(cell));
        }
        rawRows.push(rowValues);
      });
    }

    if (rawRows.length < 2) {
      return res.status(400).json({ message: 'Uploaded file has no data rows.' });
    }

    // Dynamic header row detection
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      const rowStrings = (rawRows[r] || []).map((c) => (c || '').toString().toLowerCase());
      const hasName = rowStrings.some((s) => s.includes('name'));
      const hasEmail = rowStrings.some((s) => s.includes('email') || s.includes('mail'));
      if (hasName && hasEmail) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = 0;
    }

    const headers = rawRows[headerRowIdx].map(h => (h || '').toString().trim().toLowerCase());
    
    // Map headers to field indices
    const findIndex = (aliases) => headers.findIndex(h => aliases.some(alias => h.includes(alias)));
    
    const nameIdx = findIndex(['name', 'full name', 'student name', 'member name']);
    const emailIdx = findIndex(['email', 'email address', 'mail']);
    const roleIdx = findIndex(['role', 'member role', 'type']);
    const gradeIdx = findIndex(['grade', 'class grade', 'year']);
    const classIdx = findIndex(['class', 'section', 'stream', 'a/l stream']);
    const memberIdIdx = findIndex(['member id', 'memberid', 'id', 'admission']);
    const passwordIdx = findIndex(['password', 'pass']);

    if (nameIdx === -1 || emailIdx === -1) {
      return res.status(400).json({
        message: 'Invalid column headers. Template must contain at least "Name" and "Email Address" columns.'
      });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const importedUsers = [];

    // Process each row
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0 || row.every(cell => !cell || !cell.toString().trim())) {
        continue;
      }

      const name = row[nameIdx] ? row[nameIdx].toString().trim() : '';
      const email = row[emailIdx] ? row[emailIdx].toString().trim().toLowerCase() : '';
      const rawRole = roleIdx !== -1 && row[roleIdx] ? row[roleIdx].toString().trim().toLowerCase() : 'student';
      const role = (rawRole === 'teacher' || rawRole === 'staff') ? 'teacher' : 'student';
      
      const grade = gradeIdx !== -1 && row[gradeIdx] ? row[gradeIdx].toString().trim() : (role === 'teacher' ? 'Teacher' : '');
      const classVal = classIdx !== -1 && row[classIdx] ? row[classIdx].toString().trim() : '';
      const customMemberId = memberIdIdx !== -1 && row[memberIdIdx] ? row[memberIdIdx].toString().trim() : '';
      const rowPassword = passwordIdx !== -1 && row[passwordIdx] && row[passwordIdx].toString().trim().length >= 6
        ? row[passwordIdx].toString().trim()
        : defaultPassword;

      // Skip instruction/note rows (like "📌 NOTE: ...")
      if (name.includes('NOTE:') || name.includes('📌') || (!email.includes('@') && !name)) {
        continue;
      }

      if (!name || !email) {
        skippedCount++;
        errors.push(`Row ${r + 1}: Name and Email are required.`);
        continue;
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        skippedCount++;
        errors.push(`Row ${r + 1} (${email}): Invalid email format.`);
        continue;
      }

      // Check if user already exists
      const existing = await User.findOne({ email });
      if (existing) {
        if (existing.status === 'rejected') {
          await User.deleteOne({ _id: existing._id });
        } else {
          skippedCount++;
          errors.push(`Row ${r + 1} (${email}): Already exists in database.`);
          continue;
        }
      }

      // If custom member ID provided, check uniqueness
      if (customMemberId) {
        const idExists = await User.findOne({ memberId: customMemberId });
        if (idExists) {
          skippedCount++;
          errors.push(`Row ${r + 1} (${email}): Member ID "${customMemberId}" is already in use.`);
          continue;
        }
      }

      try {
        const newUserData = {
          name,
          email,
          password: rowPassword,
          role,
          grade: role === 'teacher' ? 'Teacher' : grade,
          class: role === 'teacher' ? '' : classVal,
          status: 'active', // direct librarian bulk import activates account immediately
        };

        if (customMemberId) {
          newUserData.memberId = customMemberId;
        }

        const createdUser = await User.create(newUserData);
        importedUsers.push({
          _id: createdUser._id,
          memberId: createdUser.memberId,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          grade: createdUser.grade,
          class: createdUser.class,
          status: createdUser.status,
          createdAt: createdUser.createdAt,
        });
        importedCount++;
      } catch (createErr) {
        skippedCount++;
        errors.push(`Row ${r + 1} (${email}): ${createErr.message}`);
      }
    }

    if (importedCount === 0 && skippedCount === 0) {
      return res.status(400).json({
        message: 'No member records found in the spreadsheet. Please add at least one student or teacher (Name and Email) below the header row before uploading.'
      });
    }

    return res.status(200).json({
      message: `Bulk import completed: ${importedCount} members imported successfully, ${skippedCount} skipped.`,
      importedCount,
      skippedCount,
      defaultPassword,
      errors: errors.slice(0, 10),
      importedUsers,
    });
  } catch (error) {
    console.error('Bulk user import error:', error);
    res.status(500).json({ message: 'Server error during bulk member import.' });
  }
});

// GET /api/users - Librarian can view all library members (students and teachers)
router.get('/', protect, authorize('librarian'), async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'librarian' } })
      .select('-password -resetToken -resetTokenExpiry')
      .sort({ createdAt: -1 });
    res.json({ message: 'All members', count: users.length, users });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id - Librarian can view a specific user
router.get('/:id', protect, authorize('librarian'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -resetToken -resetTokenExpiry'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users - Librarian can create a new member directly (Student or Teacher)
router.post('/', protect, authorize('librarian'), async (req, res) => {
  try {
    const { name, email, password, role, grade, class: classField, stream } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: sanitizedEmail });
    if (userExists) {
      if (userExists.status === 'rejected') {
        await User.deleteOne({ _id: userExists._id });
      } else {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
    }

    // Members are strictly students or teachers
    const validRoles = ['student', 'teacher'];
    const userRole = role && validRoles.includes(role) ? role : 'student';

    const user = await User.create({
      name: name.trim(),
      email: sanitizedEmail,
      password,
      role: userRole,
      grade: userRole === 'teacher' ? 'Teacher' : (grade || ''),
      class: userRole === 'teacher' ? '' : (classField || ''),
      stream: userRole === 'teacher' ? '' : (stream || ''),
      status: 'active', // Direct librarian creation automatically activates account
    });

    res.status(201).json({
      message: 'Member created successfully',
      user: {
        _id: user._id,
        memberId: user.memberId,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        class: user.class,
        stream: user.stream,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// PUT /api/users/:id - Librarian can update user info (name, email, grade, class, status, role)
router.put('/:id', protect, authorize('librarian'), async (req, res) => {
  try {
    const { name, email, grade, class: classField, stream, status, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (grade !== undefined) user.grade = grade;
    if (classField !== undefined) user.class = classField;
    if (stream !== undefined) user.stream = stream;
    if (status) {
      const validStatuses = ['pending', 'active', 'rejected'];
      if (validStatuses.includes(status)) user.status = status;
    }
    if (role) {
      const validRoles = ['student', 'teacher'];
      if (validRoles.includes(role)) {
        user.role = role;
        if (role === 'teacher') {
          user.grade = 'Teacher';
          user.class = '';
          user.stream = '';
        }
      }
    }

    await user.save();
    res.json({
      message: 'User updated',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        class: user.class,
        stream: user.stream,
        status: user.status,
        role: user.role,
        memberId: user.memberId
      }
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/role - Librarian can change user role
router.put('/:id/role', protect, authorize('librarian'), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['student', 'teacher', 'librarian'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be: student, teacher, or librarian' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent librarian from demoting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({ message: `User role changed to "${role}"`, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Change role error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id - Librarian can delete a user
router.delete('/:id', protect, authorize('librarian'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent librarian from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    // Check if the user has active checkouts
    const activeTx = await Transaction.findOne({
      user: user._id,
      status: { $in: ['active', 'overdue'] },
      returnDate: null
    });

    if (activeTx) {
      return res.status(400).json({
        message: 'Cannot delete user. Member currently has active or overdue book checkouts. Please return all books first.'
      });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
