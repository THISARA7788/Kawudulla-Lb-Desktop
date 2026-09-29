// ==================================================================================
// 👤 MEMBER 5: RETURN BOOK
// WHAT DOES THIS FILE DO?
// This page handles returning borrowed books.
// - It looks up the borrower (student/teacher).
// - Shows their active borrowed books.
// - Lets the librarian check the book back in and automatically calculates fines if overdue.
// ==================================================================================
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ActiveBorrowsList from '../../components/circulation/ActiveBorrowsList';
import RecentTransactionsList from '../../components/circulation/RecentTransactionsList';

const GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13',
];
const CLASS_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function ReturnBook() {
  const { token } = useAuth();

  // Search state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [memberGradeFilter, setMemberGradeFilter] = useState('all');
  const [memberClassFilter, setMemberClassFilter] = useState('all');
  const [memberResults, setMemberResults] = useState([]);
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  // Borrowing state
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [selectedBorrows, setSelectedBorrows] = useState([]);
  const [returnDate, setReturnDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const [overdueFine, setOverdueFine] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data
  const [initialLoading, setInitialLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);

  // Scanner state
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const [scanLog, setScanLog] = useState([]);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [scannerFocused, setScannerFocused] = useState(false);
  const scannerRef = useRef(null);

  // Success Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [returnedDetails, setReturnedDetails] = useState(null);

  // Multiple Borrowers inline state
  const [multipleBorrowers, setMultipleBorrowers] = useState([]);
  const [scannedBook, setScannedBook] = useState(null);

  // Search Results state for fallback book/member searches
  const [searchResults, setSearchResults] = useState(null);
  const [allActiveTransactions, setAllActiveTransactions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMemberBorrows, setLoadingMemberBorrows] = useState(false);

  const fetchAllActiveTransactions = async () => {
    try {
      const [activeTxRes, overdueTxRes] = await Promise.all([
        api.get('/library/transactions?status=active&limit=10000', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/library/transactions?status=overdue&limit=10000', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const activeList = activeTxRes.data.transactions || [];
      const overdueList = overdueTxRes.data.transactions || [];
      setAllActiveTransactions([...activeList, ...overdueList]);
    } catch (err) {
      console.error('Fetch active transactions error:', err);
    }
  };

  // Load data
  useEffect(() => {
    const init = async () => {
      try {
        setInitialLoading(true);
        const [usersRes, activeTxRes, overdueTxRes, txRes] = await Promise.all([
          api.get('/users', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/library/transactions?status=active&limit=10000', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/library/transactions?status=overdue&limit=10000', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/library/transactions?status=returned&limit=10'),
        ]);
        setAllUsers(usersRes.data.users || []);
        
        const activeList = activeTxRes.data.transactions || [];
        const overdueList = overdueTxRes.data.transactions || [];
        setAllActiveTransactions([...activeList, ...overdueList]);
        
        setRecentReturns(txRes.data.transactions || []);
      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to load initial data');
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, [token]);

  // Derived: grades and classes that exist
  const allStudents = allUsers.filter(u => u.role === 'student' && u.status === 'active');
  const availableGrades = [...new Set(allStudents.map(u => u.grade).filter(Boolean))];
  const availableClasses = [...new Set(
    allStudents.filter(u => u.grade === memberGradeFilter && u.class).map(u => u.class)
  )];

  // Filter members
  useEffect(() => {
    let list = allUsers.filter(u =>
      u.status === 'active' &&
      u.role !== 'librarian'
    );

    // Role filter
    if (memberRoleFilter === 'student') list = list.filter(u => u.role === 'student');
    if (memberRoleFilter === 'teacher') list = list.filter(u => u.role === 'teacher');

    // Grade filter
    if (memberGradeFilter !== 'all') {
      list = list.filter(u => {
        if (u.role === 'student') return u.grade === memberGradeFilter;
        return true;
      });
      // Class filter
      if (memberClassFilter !== 'all') {
        list = list.filter(u => {
          if (u.role === 'student') return u.class === memberClassFilter;
          return true;
        });
      }
    }

    // Text search
    if (memberSearch.length >= 1) {
      const q = memberSearch.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.memberId && u.memberId.toLowerCase().includes(q))
      );
    }

    setMemberResults(list);
  }, [memberSearch, memberRoleFilter, memberGradeFilter, memberClassFilter, allUsers]);

  // Real-time suggestions filtering (runs locally without any delay)
  useEffect(() => {
    const q = scanInput.trim().toLowerCase();
    if (!q) {
      setSearchResults(null);
      return;
    }

    // Filter members matching query
    const matchedMembers = allUsers.filter(u => 
      u.status === 'active' &&
      u.role !== 'librarian' &&
      (u.name.toLowerCase().includes(q) ||
       u.email.toLowerCase().includes(q) ||
       (u.memberId && u.memberId.toLowerCase().includes(q)))
    );

    // Filter active borrowing transactions matching query
    const matchedTxs = allActiveTransactions.filter(tx => 
      (tx.book && tx.book.title && tx.book.title.toLowerCase().includes(q)) ||
      (tx.book && tx.book.author && tx.book.author.toLowerCase().includes(q)) ||
      (tx.book && tx.book.bookId && tx.book.bookId.toLowerCase().includes(q)) ||
      (tx.book && tx.book.isbn && tx.book.isbn.toLowerCase().includes(q)) ||
      (tx.user && tx.user.name && tx.user.name.toLowerCase().includes(q)) ||
      (tx.user && tx.user.memberId && tx.user.memberId.toLowerCase().includes(q))
    );

    setSearchResults({
      query: scanInput,
      members: matchedMembers.slice(0, 10),
      activeTransactions: matchedTxs.slice(0, 10)
    });
  }, [scanInput, allUsers, allActiveTransactions]);

  // Recent members from returns
  const recentMembers = (() => {
    const seen = new Set();
    const result = [];
    for (const tx of recentReturns) {
      if (tx.user && !seen.has(tx.user._id)) {
        seen.add(tx.user._id);
        result.push(tx.user);
      }
      if (result.length >= 8) break;
    }
    return result;
  })();

  // Fetch borrows for a member
  const fetchBorrows = async (userId) => {
    setLoadingMemberBorrows(true);
    setSearchLoading(true);
    try {
      const res = await api.get(`/library/users/${userId}/borrowing-info`);
      const borrows = res.data.borrowedBooks || [];
      setActiveBorrows(borrows);
      
      // Auto-select the book if there is only 1 book checked out
      if (borrows.length === 1) {
        setSelectedBorrows([borrows[0]]);
      } else {
        setSelectedBorrows([]);
      }
      
      console.log(`Loaded ${borrows.length} active borrows for user ${userId}`);
    } catch (err) {
      console.error('Fetch borrows error:', err);
      setError('Failed to load borrowing information');
    } finally {
      setLoadingMemberBorrows(false);
      setSearchLoading(false);
    }
  };

  const handleSelectMember = (m) => {
    setSelectedMember(m);
    setMemberSearch(m.name);
    setShowMemberSuggestions(false);
    setSelectedBorrows([]);
    fetchBorrows(m._id);
  };

  const clearMember = () => {
    setSelectedMember(null);
    setMemberSearch('');
    setActiveBorrows([]);
    setSelectedBorrows([]);
    setShowMemberSuggestions(true);
    setSearchResults(null);
  };

  const clearAll = () => {
    clearMember();
    setReturnDate(new Date().toISOString().split('T')[0]);
    setError('');
    setSuccessMsg('');
  };

  const playBeep = (type = 'success') => {
    // Audio feedback disabled per user preference
  };

  const handleToggleBorrow = (borrow) => {
    if (!borrow) return;
    const exists = selectedBorrows.some(b => b._id === borrow._id);
    if (exists) {
      setSelectedBorrows(selectedBorrows.filter(b => b._id !== borrow._id));
    } else {
      setSelectedBorrows([...selectedBorrows, borrow]);
    }
  };

  const performReturnDirectly = async (memberId, bookId, bookTitle, memberName) => {
    setError('');
    setScanSuccess('');
    setSaving(true);
    try {
      const res = await api.post('/library/return', {
        userId: memberId,
        bookId: bookId,
        returnDate,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMsg(`"${bookTitle}" returned successfully!`);
      setScanSuccess(`"${bookTitle}" returned successfully (Borrower: ${memberName})`);
      setScanLog(prev => [{ text: `Returned: ${bookTitle}`, time: new Date().toLocaleTimeString(), type: 'success' }, ...prev].slice(0, 5));
      playBeep('success_double');

      const { transaction, user: returnedUser, book: returnedBook } = res.data;
      setReturnedDetails({
        member: returnedUser || { name: memberName },
        book: returnedBook || { title: bookTitle },
        returnDate: returnDate || new Date(),
        overdueDays: transaction ? transaction.overdueDays : 0,
      });
      setShowSuccessModal(true);

      if (selectedMember && selectedMember._id === memberId) {
        await fetchBorrows(memberId);
      }
      setSelectedBorrows([]);

      // Refresh recent returns & active transactions
      const txRes = await api.get('/library/transactions?status=returned&limit=10');
      setRecentReturns(txRes.data.transactions || []);
      await fetchAllActiveTransactions();
      console.log('Book returned successfully!');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to return book.';
      setError(errMsg);
      setScanError(errMsg);
      playBeep('error');
    } finally {
      setSaving(false);
    }
  };

  const handleScanSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setScanError('');
    setScanSuccess('');
    
    const query = scanInput.trim();
    if (!query) return;

    setScanInput('');
    const upperQuery = query.toUpperCase();
    setSearchLoading(true);

    try {
      // 1. Try to find local match in active transactions (exact bookId or isbn)
      const matchingTxs = allActiveTransactions.filter(tx => 
        (tx.book && tx.book.bookId && tx.book.bookId.toUpperCase() === upperQuery) ||
        (tx.book && tx.book.isbn && tx.book.isbn === query)
      );

      if (matchingTxs.length > 0) {
        setSearchResults(null);
        if (matchingTxs.length === 1) {
          const activeTx = matchingTxs[0];
          const borrower = activeTx.user;
          const book = activeTx.book;

          if (autoSubmit) {
            await performReturnDirectly(borrower._id, book._id, book.title, borrower.name);
            setScanInput('');
          } else {
            if (selectedMember && selectedMember._id === borrower._id) {
              setSelectedBorrows(prev => prev.some(b => b._id === activeTx._id) ? prev : [...prev, activeTx]);
            } else {
              setSelectedMember(borrower);
              await fetchBorrows(borrower._id);
              setSelectedBorrows([activeTx]);
            }
            playBeep('success');
            setScanSuccess(`Book "${book.title}" selected (Borrower: ${borrower.name})`);
            setScanInput('');
          }
        } else {
          // Multiple active borrowers for this book (same ISBN/title)
          playBeep('success');
          setMultipleBorrowers(matchingTxs);
          setScannedBook(matchingTxs[0].book);
          setScanInput('');
        }
        return;
      }

      // 2. Try to find local match in active users (exact memberId)
      const matchingUser = allUsers.find(u => u.memberId && u.memberId.toUpperCase() === upperQuery);
      if (matchingUser) {
        setSearchResults(null);
        setSelectedMember(matchingUser);
        setSelectedBorrows([]);
        await fetchBorrows(matchingUser._id);
        playBeep('success');
        setScanSuccess(`Member "${matchingUser.name}" selected.`);
        setScanInput('');
        return;
      }

      // 3. Fallback to API lookup for non-active or unborrowed book checkouts
      const res = await api.get(`/library/quick-lookup/${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;
      if (data.type === 'book') {
        const book = data.book;
        const activeTxs = data.activeTransactions || [];

        if (activeTxs.length === 0) {
          playBeep('error');
          setScanError(`Book "${book.title}" is not currently borrowed.`);
          setScanInput('');
          return;
        }

        if (activeTxs.length === 1) {
          const activeTx = activeTxs[0];
          const borrower = activeTx.user;

          if (autoSubmit) {
            await performReturnDirectly(borrower._id, book._id, book.title, borrower.name);
            setScanInput('');
          } else {
            if (selectedMember && selectedMember._id === borrower._id) {
              setSelectedBorrows(prev => prev.some(b => b._id === activeTx._id) ? prev : [...prev, activeTx]);
            } else {
              setSelectedMember(borrower);
              await fetchBorrows(borrower._id);
              setSelectedBorrows([activeTx]);
            }
            playBeep('success');
            setScanSuccess(`Book "${book.title}" selected (Borrower: ${borrower.name})`);
            setScanInput('');
          }
        } else {
          playBeep('success');
          setMultipleBorrowers(activeTxs);
          setScannedBook(book);
          setScanInput('');
        }
      } else if (data.type === 'member') {
        const member = data.member;
        setSelectedMember(member);
        setSelectedBorrows([]);
        await fetchBorrows(member._id);
        playBeep('success');
        setScanSuccess(`Member "${member.name}" selected.`);
        setScanInput('');
      } else {
        const members = data.members || [];
        const activeTxs = data.activeTransactions || [];

        if (members.length === 1 && activeTxs.length === 0) {
          const member = members[0];
          setSelectedMember(member);
          setSelectedBorrows([]);
          await fetchBorrows(member._id);
          playBeep('success');
          setScanSuccess(`Member "${member.name}" selected.`);
          setScanInput('');
        } else if (activeTxs.length === 1 && members.length === 0) {
          const activeTx = activeTxs[0];
          const borrower = activeTx.user;
          const book = activeTx.book;

          if (autoSubmit) {
            await performReturnDirectly(borrower._id, book._id, book.title, borrower.name);
            setScanInput('');
          } else {
            if (selectedMember && selectedMember._id === borrower._id) {
              setSelectedBorrows(prev => prev.some(b => b._id === activeTx._id) ? prev : [...prev, activeTx]);
            } else {
              setSelectedMember(borrower);
              await fetchBorrows(borrower._id);
              setSelectedBorrows([activeTx]);
            }
            playBeep('success');
            setScanSuccess(`Book "${book.title}" selected (Borrower: ${borrower.name})`);
            setScanInput('');
          }
        } else if (members.length === 0 && activeTxs.length === 0) {
          playBeep('error');
          setScanError(`No active borrowings or members found matching "${query}".`);
          setScanInput('');
        } else {
          setSearchResults({
            query,
            members,
            activeTransactions: activeTxs
          });
        }
      }
    } catch (err) {
      playBeep('error');
      setScanError(err.response?.data?.message || `No book or member found matching "${query}".`);
      setScanInput('');
    } finally {
      setSearchLoading(false);
    }
  };



  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (showSuccessModal) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setShowSuccessModal(false);
          setReturnedDetails(null);
          if (scannerRef.current) {
            scannerRef.current.focus();
          }
          return;
        }
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(e.key)) return;

      if (
        scannerRef.current &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        scannerRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showSuccessModal]);

  // Close success modal automatically when a new scan starts typing
  useEffect(() => {
    if (scanInput && showSuccessModal) {
      setShowSuccessModal(false);
      setReturnedDetails(null);
    }
  }, [scanInput, showSuccessModal]);

  // Autofocus scanner input on mount
  useEffect(() => {
    if (scannerRef.current) {
      scannerRef.current.focus();
    }
  }, []);

  const handleReturnSelected = async () => {
    if (selectedBorrows.length === 0) return;
    setError('');
    setSuccessMsg('');
    setSaving(true);
    
    try {
      // Submit concurrent returns for all selected checkouts
      const results = await Promise.all(selectedBorrows.map(async (borrow) => {
        const res = await api.post('/library/return', {
          userId: selectedMember._id,
          bookId: borrow.book._id,
          returnDate,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return { borrow, data: res.data };
      }));

      // Calculate total accumulated overdue days for modal feedback
      let totalOverdueDays = 0;
      results.forEach(r => {
        if (r.data.transaction) {
          totalOverdueDays += r.data.transaction.overdueDays || 0;
        }
      });

      // Feedback for modal / notification
      const firstReturned = results[0];
      setSuccessMsg(selectedBorrows.length === 1 
        ? `"${firstReturned.borrow.book.title}" returned successfully!`
        : `${selectedBorrows.length} books returned successfully!`
      );

      setReturnedDetails({
        member: selectedMember,
        book: firstReturned.borrow.book,
        booksCount: selectedBorrows.length,
        returnDate: returnDate || new Date(),
        overdueDays: totalOverdueDays,
      });
      setShowSuccessModal(true);

      // Refresh active borrowings list
      await fetchBorrows(selectedMember._id);
      setSelectedBorrows([]);
      setReturnDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);

      // Refresh recent returns sidebar & active logs
      const txRes = await api.get('/library/transactions?status=returned&limit=10');
      setRecentReturns(txRes.data.transactions || []);
      await fetchAllActiveTransactions();
    } catch (err) {
      console.error('Bulk return error:', err);
      setError(err.response?.data?.message || 'Failed to process return check-ins.');
    } finally {
      setSaving(false);
    }
  };

  function gradeDisplay(u) {
    if (u.role === 'student') {
      if (u.grade && u.class) return `Gr.${u.grade.replace('Grade ', '')}-${u.class}`;
      if (u.grade) return `Gr.${u.grade.replace('Grade ', '')}`;
      return 'Student';
    }
    if (u.role === 'teacher') return 'Teacher';
    return u.role;
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Sliding Toast Notifications */}
      {error && (
        <div 
          onClick={() => setError('')}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#DC2626] border border-red-700 shadow-2xl flex items-center gap-2 cursor-pointer animate-slideDown max-w-[90%] sm:max-w-md text-center select-none"
        >
          <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
          <span className="truncate flex-1">{error}</span>
          <span className="material-symbols-outlined text-[10px] text-red-200 hover:text-white transition-colors">close</span>
        </div>
      )}

      {scanError && (
        <div 
          onClick={() => setScanError('')}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-xs font-black text-white bg-[#DC2626] border border-red-700 shadow-2xl flex items-center gap-2 cursor-pointer animate-slideDown max-w-[90%] sm:max-w-md text-center select-none"
        >
          <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
          <span className="truncate flex-1">{scanError}</span>
          <span className="material-symbols-outlined text-[10px] text-red-200 hover:text-white transition-colors">close</span>
        </div>
      )}


      <div className="mx-auto space-y-4 flex flex-col min-h-0" style={{ maxWidth: '1280px', fontFamily: "'Inter', sans-serif" }}>
        
        {initialLoading ? (
          /* Skeleton Shimmer Loading Placeholder */
          <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-0 animate-pulse">
            {/* Left Column Skeleton */}
            <div className="flex-grow flex-1 flex flex-col space-y-4 min-h-0">
              {/* Scanner Box Skeleton */}
              <div className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex-grow flex flex-col gap-3 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200"></div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-slate-200 rounded w-44"></div>
                      <div className="h-2.5 bg-slate-100 rounded w-64"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-36 bg-slate-100 rounded-full"></div>
                </div>
              </div>

              {/* Member Selection List Skeleton */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="h-4 bg-slate-200 rounded w-36"></div>
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0"></div>
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-slate-200 rounded w-32"></div>
                          <div className="h-2.5 bg-slate-100 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-16 bg-slate-200 rounded-lg"></div>
                        <div className="h-8 w-20 bg-slate-200 rounded-xl"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col space-y-4">
              {/* Return Summary Card Skeleton */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-slate-200"></div>
                  <div className="h-4 bg-slate-200 rounded w-28"></div>
                </div>
                <div className="space-y-2.5">
                  <div className="h-16 bg-slate-100 rounded-xl"></div>
                  <div className="h-10 bg-slate-200 rounded-xl"></div>
                </div>
              </div>

              {/* Recent Returns History Skeleton */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="h-3.5 bg-slate-200 rounded w-28"></div>
                  <div className="h-3 bg-slate-100 rounded w-12"></div>
                </div>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-2.5 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-10 rounded bg-slate-200"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Main Grid: Columns stretch to match sidebar */
          <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-0">
            
            {/* LEFT COLUMN: Main actions & forms (Flex-1) */}
            <div className="flex-grow flex-1 flex flex-col space-y-4 min-h-0">
            
            {/* 1. Barcode scanner workspace */}
            {!selectedMember && (
              <div 
                className="rounded-2xl p-5 bg-white border transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 select-none animate-fadeIn"
                style={{ 
                  borderColor: scannerFocused ? '#9E0D0D' : '#E2E8F0',
                  boxShadow: scannerFocused ? '0 10px 25px -5px rgba(16, 185, 129, 0.1), 0 8px 10px -6px rgba(16, 185, 129, 0.05)' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex-grow flex flex-col gap-3 min-w-0">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                      scannerFocused 
                        ? 'bg-[#9E0D0D] text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Search Member or Book</h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">Scan barcode or search by book title, member name, or ID</p>
                    </div>
                  </div>

                  <form onSubmit={handleScanSubmit} className="relative flex-grow min-w-0">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" style={{ fontSize: 20 }}>barcode</span>
                    <input
                      ref={scannerRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onFocus={(e) => {
                        setScannerFocused(true);
                        e.target.select();
                      }}
                      onBlur={() => setScannerFocused(false)}
                      placeholder="Scan barcode or type name, title, member ID..."
                      className="w-full py-2.5 pl-10 pr-4 text-xs border border-slate-200 outline-none rounded-xl bg-slate-50/20 focus:bg-white focus:border-[#9E0D0D] focus:shadow-[0_2px_8px_rgba(16,185,129,0.05)] transition-all font-medium text-slate-800 placeholder-slate-400"
                    />
                  </form>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 justify-between md:justify-center flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                  <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setAutoSubmit(!autoSubmit)}>
                    <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${autoSubmit ? 'bg-[#9E0D0D]' : 'bg-slate-200'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${autoSubmit ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider transition-colors duration-200" style={{ color: autoSubmit ? '#9E0D0D' : '#6B7280' }}>
                      ⚡ Auto-Submit Return
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Selected Borrower Details Card (Horizontal, displayed if selected) */}
            {selectedMember && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#9E0D0D] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-800">{selectedMember.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-655 uppercase">
                        ID: {selectedMember.memberId || '—'}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 uppercase">
                        {selectedMember.role}
                      </span>
                      {selectedMember.role === 'student' && selectedMember.grade && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-655 uppercase">
                          Grade {gradeDisplay(selectedMember)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search another member */}
                <button 
                  onClick={clearMember}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#9E0D0D] text-[#9E0D0D] hover:bg-red-50/50 transition-all hover:shadow-sm active:scale-95 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_search</span>
                  Search another member or book
                </button>
              </div>
            )}

            {/* 3. Grid for search / workspace / confirm details */}
            {!selectedMember ? (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col h-[460px] animate-fadeIn relative justify-center">
                {searchLoading ? (
                  <div className="flex flex-col items-center justify-center flex-grow select-none animate-fadeIn">
                    <span className="material-symbols-outlined text-4xl text-[#9E0D0D] animate-spin">sync</span>
                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider animate-pulse">Loading search results...</p>
                  </div>
                ) : (
                  /* Side-by-side columns */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                  
                  {/* Left Column: Members List */}
                  <div className="flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-3 select-none flex-shrink-0">
                      <span className="material-symbols-outlined text-[#9E0D0D] text-lg font-black">group</span>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        {searchResults ? `Matching Members (${searchResults.members.length})` : 'Members Search'}
                      </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {searchResults ? (
                        searchResults.members.map(member => (
                          <button
                            key={member._id}
                            type="button"
                            onClick={async () => {
                              setSelectedMember(member);
                              setSelectedBorrows([]);
                              await fetchBorrows(member._id);
                              setSearchResults(null);
                              setScanInput('');
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-red-200 hover:bg-red-50/20 transition-all text-left cursor-pointer animate-fadeIn"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{member.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ID: {member.memberId} {member.grade ? `• Gr.${member.grade.replace('Grade ', '')}-${member.class || ''}` : ''}
                              </div>
                            </div>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide ${
                              member.role === 'student' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {member.role === 'student' ? 'Student' : 'Teacher'}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-12 text-slate-350 select-none animate-fadeIn">
                          <span className="material-symbols-outlined text-4xl mb-2 text-[#9E0D0D] animate-pulse">person_search</span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Search Members</h4>
                          <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
                            Type a member's name or ID in the search bar above to list profiles.
                          </p>
                        </div>
                      )}
                      {searchResults && searchResults.members.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-8">No members found</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Book returns or instructions */}
                  <div className="flex flex-col min-h-0 border-l border-slate-100 pl-6">
                    <div className="flex items-center gap-2 mb-3 select-none flex-shrink-0">
                      <span className="material-symbols-outlined text-[#F59E0B] text-base font-bold">book</span>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        {searchResults ? `Matching Borrowed Books (${searchResults.activeTransactions.length})` : 'Active Checkout Returns'}
                      </h3>
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-2 pr-1 min-h-0">
                      {searchResults ? (
                        searchResults.activeTransactions.map(tx => {
                          const borrower = tx.user || {};
                          const book = tx.book || {};
                          const isOverdue = new Date(tx.dueDate) < new Date();
                          return (
                            <button
                              key={tx._id}
                              type="button"
                              onClick={async () => {
                                if (autoSubmit) {
                                  setSearchResults(null);
                                  await performReturnDirectly(borrower._id, book._id, book.title, borrower.name);
                                  setScanInput('');
                                } else {
                                  setSelectedMember(borrower);
                                  await fetchBorrows(borrower._id);
                                  setSelectedBorrows([tx]);
                                  setSearchResults(null);
                                  setScanInput('');
                                }
                              }}
                              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-red-200 hover:bg-red-50/20 transition-all text-left cursor-pointer"
                            >
                              <div className="min-w-0 flex-1 mr-2">
                                <div className="text-xs font-bold text-slate-800 truncate">"{book.title}"</div>
                                <div className="text-[10px] text-slate-450 mt-0.5 truncate">
                                  Borrower: {borrower.name}
                                </div>
                              </div>
                              <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide ${isOverdue ? 'text-red-655 bg-red-55' : 'text-emerald-705 bg-red-50'}`}>
                                {isOverdue ? 'Overdue' : 'Active'}
                              </span>
                            </button>
                          )
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-12 text-slate-350 select-none">
                          <span className="material-symbols-outlined text-4xl mb-2 text-amber-500/80 animate-pulse">qr_code_scanner</span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Scan or Search to Start</h4>
                          <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
                            Scan a book barcode or type search terms to filter matching borrowers or return details.
                          </p>
                        </div>
                      )}
                      {searchResults && searchResults.activeTransactions.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-8">No matching active borrowings</p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
            ) : (
              /* If member is selected, show: Active Borrowings (left) & Confirm Return (right) side-by-side */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Active Borrowings Card */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between h-[460px]">
                  <div className="flex items-center justify-between mb-3 select-none flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#F59E0B]">
                        <span className="material-symbols-outlined text-white text-base">receipt_long</span>
                      </div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        {loadingMemberBorrows
                          ? 'Loading Active Books...'
                          : multipleBorrowers.length > 0 && !selectedMember
                          ? `Multiple Borrowers (${multipleBorrowers.length})`
                          : `${activeBorrows.length} Active Book(s)`}
                      </h2>
                    </div>
                  </div>

                  {loadingMemberBorrows ? (
                    <div className="flex-grow flex-1 min-h-0 flex flex-col justify-center items-center py-6 select-none animate-pulse space-y-3">
                      <div className="w-full space-y-2.5 overflow-hidden">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-12 rounded-lg bg-slate-200 flex-shrink-0"></div>
                              <div className="space-y-1.5">
                                <div className="h-3.5 bg-slate-200 rounded w-36"></div>
                                <div className="h-2.5 bg-slate-100 rounded w-24"></div>
                              </div>
                            </div>
                            <div className="h-6 w-16 bg-slate-200 rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold pt-1">
                        <span className="material-symbols-outlined animate-spin text-[#9E0D0D] text-base">progress_activity</span>
                        <span>Loading member's borrowed books...</span>
                      </div>
                    </div>
                  ) : multipleBorrowers.length > 0 && !selectedMember ? (
                    <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1">
                      <div className="p-2.5 rounded-xl border border-dashed border-amber-250 bg-amber-50/20 text-xs flex justify-between items-center select-none mb-2">
                        <div className="min-w-0 mr-2">
                          <span className="font-bold text-amber-800 truncate block">Scanned: "{scannedBook.title}"</span>
                          <p className="text-[10px] text-amber-700 mt-0.5 font-semibold">Select borrower returning this copy:</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { setMultipleBorrowers([]); setScannedBook(null); }}
                          className="text-[10px] text-red-500 font-extrabold hover:underline flex-shrink-0 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-2">
                        {multipleBorrowers.map((tx) => {
                          const borrower = tx.user || {};
                          const isOverdue = new Date(tx.dueDate) < new Date();
                          return (
                            <button
                              key={tx._id}
                              type="button"
                              onClick={async () => {
                                const bBook = scannedBook;
                                setMultipleBorrowers([]);
                                setScannedBook(null);
                                if (autoSubmit) {
                                  await performReturnDirectly(borrower._id, bBook._id, bBook.title, borrower.name);
                                } else {
                                  setSelectedMember(borrower);
                                  await fetchBorrows(borrower._id);
                                  setSelectedBorrows([tx]);
                                }
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#9E0D0D] hover:bg-slate-50/50 transition-all text-left animate-fadeIn cursor-pointer"
                              style={{ backgroundColor: '#FAFCFD' }}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-black text-slate-800 truncate">{borrower.name}</div>
                                <div className="text-[10px] text-slate-455 mt-0.5 font-bold">
                                  ID: {borrower.memberId} {borrower.grade ? `• Gr.${borrower.grade.replace('Grade ', '')}-${borrower.class || ''}` : ''}
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end flex-shrink-0 ml-2 select-none">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${isOverdue ? 'text-red-655 bg-red-55' : 'text-green-700 bg-green-55'}`}>
                                  {isOverdue ? 'Overdue' : 'Active'}
                                </span>
                                <span className="text-[9px] text-slate-455 mt-1 font-semibold">Due: {new Date(tx.dueDate).toLocaleDateString()}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex-1 min-h-0 flex flex-col justify-between select-none">
                      <ActiveBorrowsList
                        borrows={activeBorrows}
                        selectedMember={selectedMember}
                        selectedBorrows={selectedBorrows}
                        onSelect={handleToggleBorrow}
                        maxHeight="380px"
                        returnDate={returnDate}
                      />
                    </div>
                  )}
                </div>

                {/* Confirm Return Card */}
                {loadingMemberBorrows ? (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-[460px] animate-pulse select-none">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[#9E0D0D] text-2xl animate-spin">progress_activity</span>
                    </div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Checking Loan Records</h3>
                    <p className="text-[10px] text-slate-400">Fetching active borrowings and calculating status...</p>
                  </div>
                ) : selectedBorrows.length > 0 ? (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between h-[460px] animate-fadeIn">
                    <div className="flex-grow flex flex-col min-h-0 justify-start">
                      
                      <div className="flex items-center justify-between mb-3 select-none flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#9E0D0D]">
                            <span className="material-symbols-outlined text-white text-base">assignment_turned_in</span>
                          </div>
                          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">Confirm Return</h2>
                        </div>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-55 text-[#7F0A0A] border border-red-100">
                          {selectedBorrows.length} Book{selectedBorrows.length > 1 ? 's' : ''} Selected
                        </span>
                      </div>

                      {/* Scrollable list or Single-Book Preview details */}
                      {selectedBorrows.length === 1 ? (
                        /* Single Selected Book: Beautiful top-big-cover details-bottom layout */
                        (() => {
                          const borrow = selectedBorrows[0];
                          const book = borrow.book || {};
                           const rDate = new Date(returnDate);
                           const now = new Date();
                           rDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                           const diffTime = rDate - new Date(borrow.dueDate);
                           const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                           const fine = days * 10;
                          return (
                            <div className="flex flex-col items-center flex-grow justify-center min-h-0 select-none animate-fadeIn my-2">
                              {/* Wrapper with relative positioning, allowing overflow */}
                              <div className="relative mb-4">
                                {/* Book cover container (clipped) */}
                                <div className="w-32 h-44 rounded-2xl bg-amber-50 border border-slate-250 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                                  {book.coverImageUrl ? (
                                    <img src={book.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="material-symbols-outlined text-amber-500 text-4xl">menu_book</span>
                                  )}
                                </div>
                                {/* Big Warning Badge in the middle, overflowing outline */}
                                {days > 0 && (
                                  <div 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#DC2626] text-white py-2 px-3 rounded-xl shadow-2xl flex flex-col items-center justify-center gap-1 border-2 border-white animate-pulse min-w-[130px] z-10"
                                    style={{ transform: 'translate(-50%, -50%) rotate(-8deg)', boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)' }}
                                  >
                                    <span className="material-symbols-outlined text-[#FBBF24] text-xl font-bold leading-none">warning</span>
                                    <span className="font-black text-[10px] tracking-wider uppercase whitespace-nowrap">{days}d Overdue</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Details below cover */}
                              <div className="text-center w-full px-4">
                                <h4 className="text-sm font-black text-slate-855 line-clamp-2">{book.title}</h4>
                                <p className="text-[10px] text-slate-400 mt-1 truncate">{book.author || 'Unknown Author'}</p>
                                <div className="text-[10px] font-mono font-bold text-slate-500 mt-1">Book ID: {book.bookId || '—'}</div>
                                
                                <div className="flex justify-center gap-2 mt-2 text-[9.5px] font-semibold text-slate-455">
                                  <span>Borrowed: <span className="font-bold text-slate-600">{new Date(borrow.borrowDate).toLocaleDateString()}</span></span>
                                  <span>•</span>
                                  <span>Due: <span className={`font-bold ${days > 0 ? 'text-red-500' : 'text-[#9E0D0D]'}`}>{new Date(borrow.dueDate).toLocaleDateString()}</span></span>
                                </div>

                                {days > 0 && (
                                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-105 rounded-lg text-[9px] text-red-655 font-bold animate-fadeIn">
                                    <span className="material-symbols-outlined text-[11px] text-red-600">warning</span>
                                    <span>{days}d Overdue (LKR {fine}.00 fine)</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        /* Multiple Selected Books: Scrollable list of return checkouts */
                        <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 my-1">
                          {selectedBorrows.map((borrow) => {
                            const isOverdue = new Date(returnDate) > new Date(borrow.dueDate);
                            const diffTime = new Date(returnDate) - new Date(borrow.dueDate);
                            const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                            const book = borrow.book || {};
                            return (
                              <div key={borrow._id} className={`flex gap-3 items-center p-2 rounded-xl border shadow-xs relative ${days > 0 ? 'bg-red-50/40 border-red-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                <div className="relative flex-shrink-0">
                                  <div className="w-10 h-12 rounded bg-amber-50 border border-amber-205 flex items-center justify-center overflow-hidden">
                                    {book.coverImageUrl ? (
                                      <img src={book.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="material-symbols-outlined text-amber-500 text-lg">menu_book</span>
                                    )}
                                  </div>
                                  {days > 0 && (
                                    <div 
                                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#DC2626] text-white p-0.5 rounded shadow-lg flex items-center justify-center border border-white animate-pulse z-10"
                                      style={{ transform: 'translate(-50%, -50%) rotate(-5deg)' }}
                                    >
                                      <span className="material-symbols-outlined text-[#FBBF24] font-bold leading-none" style={{ fontSize: 10 }}>warning</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-black text-slate-800 line-clamp-1">{book.title}</h4>
                                  <p className="text-[9px] text-slate-400 mt-0.5 truncate">ID: {book.bookId || '—'} • Due: {new Date(borrow.dueDate).toLocaleDateString()}</p>
                                  {days > 0 && (
                                    <span className="text-[8px] font-extrabold text-red-655 bg-red-50 border border-red-100 px-1 py-0.2 rounded mt-0.5 inline-block">
                                      LKR {days * 10}.00 Fine ({days}d late)
                                    </span>
                                  )}
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => handleToggleBorrow(borrow)}
                                  className="text-slate-400 hover:text-red-500 p-1 flex-shrink-0 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Cumulative Warning banner if fines exist and multiple books are selected */}
                      {selectedBorrows.length > 1 && (() => {
                        let totalFine = 0;
                        selectedBorrows.forEach(b => {
                          const diffTime = new Date(returnDate) - new Date(b.dueDate);
                          const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                          if (days > 0) {
                            totalFine += days * 10;
                          }
                        });
                        
                        if (totalFine > 0) {
                          return (
                            <div className="mt-2 p-2 rounded-xl border flex items-start gap-1.5 bg-red-50/60 border-red-150 animate-fadeIn flex-shrink-0 select-none">
                              <span className="material-symbols-outlined text-red-655 text-sm flex-shrink-0 mt-0.5">warning</span>
                              <div className="text-[10px]">
                                <p className="font-extrabold text-red-750 uppercase tracking-wider">Overdue Returns Fine Alert</p>
                                <p className="text-red-655 mt-0.5 leading-snug font-semibold">
                                  Accumulated Fine: <span className="font-black text-red-700 bg-red-100/50 px-1.5 py-0.5 rounded">LKR {totalFine}.00</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2.5 flex-shrink-0">
                      <div className="flex items-center justify-between select-none">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Return Date:</span>
                        <input 
                          type="date" 
                          value={returnDate} 
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-200 outline-none rounded-lg bg-white focus:border-emerald-500 font-medium max-w-[160px]"
                        />
                      </div>

                      <div className="flex gap-2 w-full select-none">
                        {/* -------------------------------------------------------------
                            🔴 BUTTON: "Confirm Return" Button
                            To change the color of this button:
                            - Modify "#4C0000" to your HEX color (e.g. "#059669" for green)
                            - Modify "#CBD5E1" (disabled gray color) if needed
                           ------------------------------------------------------------- */}
                        <button 
                          onClick={handleReturnSelected} 
                          disabled={saving}
                          className="flex-grow py-2 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-900/10 cursor-pointer"
                          style={{ backgroundColor: !saving ? '#4C0000' : '#CBD5E1' }}
                        >
                          <span className="material-symbols-outlined text-sm">assignment_returned</span>
                          {saving ? 'Processing...' : `Confirm Return (${selectedBorrows.length} Book${selectedBorrows.length > 1 ? 's' : ''})`}
                        </button>
                        <button 
                          onClick={() => setSelectedBorrows([])}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs text-slate-655 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                  </div>
                ) : selectedMember && activeBorrows.length > 0 ? (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center h-[460px] text-slate-350 select-none animate-fadeIn">
                    <span className="material-symbols-outlined text-4xl mb-1.5">arrow_circle_down</span>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Book(s) to Return</p>
                    <p className="text-[9px] mt-0.5 max-w-[200px]">Click active book cards on the left or scan barcodes to queue returns</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center h-[460px] text-slate-300 select-none">
                    <span className="material-symbols-outlined text-4xl mb-1.5">assignment_returned</span>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Return Checkout Verification</p>
                    <p className="text-[9px] mt-0.5 max-w-[200px]">Select a library member first to load their current borrowing transactions</p>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Sidebar (w-full lg:w-64) */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col space-y-4 select-none">
            
            {/* Borrower metadata card */}
            {selectedMember && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-fadeIn select-none">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[#9E0D0D] text-lg font-black">person</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Borrower Info</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-red-50 text-[#9E0D0D]">
                    <span className="material-symbols-outlined text-xl">person</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-800 truncate">{selectedMember.name}</div>
                    <div className="text-[10px] text-slate-450 mt-0.5 font-bold">
                      ID: {selectedMember.memberId || '—'} • {gradeDisplay(selectedMember)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-455 font-bold">Active books:</span>
                  {loadingMemberBorrows ? (
                    <span className="w-6 h-4 bg-slate-200 rounded animate-pulse inline-block"></span>
                  ) : (
                    <span className={`text-xs font-black px-1.5 py-0.5 rounded ${activeBorrows.length > 3 ? 'text-red-655 bg-red-50' : 'text-slate-700 bg-slate-100'}`}>
                      {activeBorrows.length}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Recent Returns sidebar item */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col min-h-0 max-h-[460px] flex-grow">
              <div className="flex items-center gap-2 mb-3 select-none">
                <span className="material-symbols-outlined text-[#9E0D0D] text-lg font-black">assignment_returned</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recent Returns</span>
              </div>
              
              <RecentTransactionsList
                transactions={recentReturns}
                type="returns"
                maxHeight="380px"
              />

              {recentReturns.length >= 10 && (
                <Link
                  to="/circulation"
                  className="mt-3 pt-2.5 border-t border-slate-100 text-center text-[10px] font-extrabold uppercase tracking-wider text-[#9E0D0D] hover:text-[#7F0A0A] transition-all hover:shadow-xs flex items-center justify-center gap-1 cursor-pointer select-none"
                >
                  <span>View more in circulation</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              )}
            </div>
            
          </div>

        </div>
        )}

      </div>

      {/* Success Modal Overlay */}
      {showSuccessModal && returnedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animate-fadeIn {
              animation: fadeIn 0.2s ease-out forwards;
            }
            .animate-scaleUp {
              animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
          `}</style>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl transition-all border border-slate-100 flex flex-col items-center text-center relative overflow-hidden animate-scaleUp">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#9E0D0D]" />
            
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#9E0D0D] mb-4 mt-2 animate-bounce">
              <span className="material-symbols-outlined text-4xl font-bold">assignment_turned_in</span>
            </div>

            <h3 className="text-xl font-extrabold mb-1" style={{ color: '#4C0000', fontFamily: "'Inter', sans-serif" }}>
              Book Returned Successfully!
            </h3>
            <p className="text-slate-400 text-xs mb-5">Return transaction completed and recorded</p>

            <div className="w-full rounded-2xl p-4 mb-6 border border-slate-100 bg-slate-50/50 flex flex-col gap-3.5 text-left text-xs">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5" style={{ fontSize: 18 }}>person</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Returned By</div>
                  <div className="font-bold text-slate-800 truncate">{returnedDetails.member.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{returnedDetails.member.memberId || '—'}</div>
                </div>
              </div>
              
              <div className="border-t border-dashed border-slate-200" />

              <div className="flex gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5" style={{ fontSize: 18 }}>menu_book</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Book Details</div>
                  {returnedDetails.booksCount > 1 ? (
                    <div className="font-bold text-slate-800">{returnedDetails.booksCount} books checked back in</div>
                  ) : (
                    <>
                      <div className="font-bold text-slate-800 truncate">{returnedDetails.book.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Catalogue ID: {returnedDetails.book.bookId || '—'}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200" />

              <div className="flex gap-3">
                <span className="material-symbols-outlined text-slate-400 mt-0.5" style={{ fontSize: 18 }}>event</span>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Returned</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {new Date(returnedDetails.returnDate).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {returnedDetails.overdueDays > 0 && (
                <>
                  <div className="border-t border-dashed border-slate-200" />
                  <div className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-155 text-left animate-fadeIn">
                    <span className="material-symbols-outlined text-red-600 mt-0.5" style={{ fontSize: 20 }}>warning</span>
                    <div className="text-xs">
                      <div className="font-extrabold text-red-800 uppercase tracking-wider text-[10px]">Overdue Fine Charged</div>
                      <div className="font-extrabold text-red-600 text-sm mt-0.5">
                        LKR {returnedDetails.overdueDays * 10}.00 ({returnedDetails.overdueDays} days late)
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Billed and added to the borrower's account status.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setReturnedDetails(null);
                  if (scannerRef.current) {
                    scannerRef.current.focus();
                  }
                }}
                className="flex-1 py-3 rounded-xl text-xs font-extrabold text-white transition-all hover:opacity-90 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-700/20 cursor-pointer"
                style={{ backgroundColor: '#9E0D0D' }}
              >
                <span className="material-symbols-outlined text-sm font-bold">qr_code_scanner</span>
                Scan Next Book (Enter)
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
