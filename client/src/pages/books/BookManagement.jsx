// ==================================================================================
// 👤 MEMBER 3: BOOK CATALOG & MANAGEMENT
// WHAT DOES THIS FILE DO?
// This page is where the Librarian manages the library books inventory.
// - It displays all books in the catalog.
// - It allows the librarian to search, add new books, edit existing books, and delete books.
// ==================================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BookTable from '../../components/books/BookTable';
import BookGrid from '../../components/books/BookGrid';
import BookFormModal from '../../components/books/BookFormModal';

const CATEGORIES = ['Fiction', 'Science', 'History', 'Math', 'Reference', 'Technology', 'Biography', 'Other'];

const emptyForm = {
  title: '',
  author: '',
  isbn: '',
  category: 'Fiction',
  description: '',
  totalCopies: 1,
  publisher: '',
  publishedYear: '',
  coverImageUrl: '',
  status: 'Available',
};

const getGradientForCategory = (category) => {
  switch (category) {
    case 'Fiction':
      return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    case 'Science':
      return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
    case 'History':
      return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
    case 'Math':
      return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    case 'Reference':
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    case 'Technology':
      return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
    case 'Biography':
      return 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)';
    default:
      return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
  }
};

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Borrowed':
      return { backgroundColor: 'rgba(251, 146, 60, 0.15)', color: '#ea580c', border: '1px solid rgba(251, 146, 60, 0.3)' };
    case 'Reserved':
      return { backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#dc2626', border: '1px solid rgba(248, 113, 113, 0.3)' };
    case 'Available':
    default:
      return { backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#166534', border: '1px solid rgba(74, 222, 128, 0.3)' };
  }
};

export default function BookManagement() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [overdueBookIds, setOverdueBookIds] = useState([]);
  const [sortBy, setSortBy] = useState('bookId');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('book_catalog_view_mode') || 'table');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [selectedBookProfile, setSelectedBookProfile] = useState(null);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const longPressTimeoutRef = useRef(null);
  const isLongPressActiveRef = useRef(false);

  const handleCardMouseDown = (book) => {
    if (user?.role !== 'librarian') return; // Selection mode restricted to librarians
    isLongPressActiveRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setIsSelectionMode(true);
      setSelectedBookIds((prev) => {
        if (prev.includes(book._id)) return prev;
        return [...prev, book._id];
      });
    }, 600);
  };

  const handleCardMouseUp = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleCardTouchStart = (book) => {
    handleCardMouseDown(book);
  };

  const handleCardTouchEnd = () => {
    handleCardMouseUp();
  };

  const handleCardClick = (book) => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    
    if (isSelectionMode) {
      setSelectedBookIds((prev) => {
        if (prev.includes(book._id)) {
          const updated = prev.filter((id) => id !== book._id);
          if (updated.length === 0) {
            setIsSelectionMode(false);
          }
          return updated;
        } else {
          return [...prev, book._id];
        }
      });
    } else {
      setSelectedBookProfile(book);
    }
  };

  const executeBulkDelete = async () => {
    setSaving(true);
    try {
      await Promise.all(selectedBookIds.map(id => api.delete(`/library/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })));
      setBooks((prev) => prev.filter((b) => !selectedBookIds.includes(b._id)));
      showToast(`${selectedBookIds.length} books deleted successfully!`, 'delete');
      setSelectedBookIds([]);
      setIsSelectionMode(false);
      setBulkDeleteConfirm(false);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to delete some selected books.';
      showToast(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const fetchBooks = async (q = '') => {
    try {
      setLoading(true);
      const res = await api.get('/library/books', { params: { search: q || undefined } });
      setBooks(res.data.books || []);
      setOverdueBookIds(res.data.overdueBookIds || []);
    } catch (err) {
      console.error('Fetch books error:', err);
      setBooks([]);
      setOverdueBookIds([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequestsCount = async () => {
    try {
      const res = await api.get('/book-requests/pending-count');
      setPendingRequestsCount(res.data?.count || 0);
    } catch (err) {
      console.error('Fetch pending requests count error:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
    let interval;
    if (user?.role === 'librarian') {
      fetchPendingRequestsCount();
      interval = setInterval(fetchPendingRequestsCount, 20000);
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    localStorage.setItem('book_catalog_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(e.key)) return;

      if (showModal) return;

      if (
        searchInputRef.current &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showModal]);

  const categories = ['All', ...new Set(books.map((b) => b.category))];

  const filtered = books.filter((b) => {
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(search.toLowerCase())) ||
      (b.bookId && b.bookId.toLowerCase().includes(search.toLowerCase()));

    let matchFilter = true;
    if (categoryFilter === 'Available') {
      matchFilter = b.availableCopies > 0;
    } else if (categoryFilter === 'Borrowed') {
      matchFilter = b.availableCopies < b.totalCopies;
    } else if (categoryFilter === 'Overdue') {
      matchFilter = overdueBookIds.includes(b._id);
    } else if (categoryFilter !== 'All') {
      matchFilter = b.category === categoryFilter;
    }

    return matchSearch && matchFilter;
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    let compareVal = 0;
    if (sortBy === 'title') {
      compareVal = a.title.localeCompare(b.title);
    } else if (sortBy === 'author') {
      compareVal = a.author.localeCompare(b.author);
    } else if (sortBy === 'copies') {
      compareVal = (a.availableCopies || 0) - (b.availableCopies || 0);
    } else if (sortBy === 'bookId') {
      compareVal = (a.bookId || '').localeCompare(b.bookId || '');
    }
    return sortOrder === 'asc' ? compareVal : -compareVal;
  });

  const itemsPerPage = 30;
  const totalPages = Math.ceil(sortedAndFiltered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAndFiltered.slice(indexOfFirstItem, indexOfLastItem);

  const openAdd = () => {
    setEditingBook(null);
    setForm(emptyForm);
    setCustomCategory('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (book) => {
    setEditingBook(book);
    setForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      category: book.category || 'Fiction',
      description: book.description || '',
      totalCopies: book.totalCopies || 1,
      publisher: book.publisher || '',
      publishedYear: book.publishedYear || '',
      coverImageUrl: book.coverImageUrl || '',
      status: book.status || 'Available',
    });
    setCustomCategory(!CATEGORIES.includes(book.category) ? book.category : '');
    setForm((prev) => ({ ...prev, category: !CATEGORIES.includes(book.category) ? 'Other' : book.category }));
    setError('');
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const book = books.find((b) => b._id === id);
    if (book) {
      setBookToDelete(book);
    }
  };

  const executeDelete = async () => {
    if (!bookToDelete) return;
    try {
      await api.delete(`/library/books/${bookToDelete._id}`);
      setBooks((prev) => prev.filter((b) => b._id !== bookToDelete._id));
      setBookToDelete(null);
      showToast(`Book "${bookToDelete.title}" deleted successfully!`, 'delete');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to delete book.';
      showToast(errMsg, 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.title || !form.author || !form.category) {
      setError('Title, author, and category are required.');
      setSaving(false);
      return;
    }

    const body = {
      ...form,
      category: form.category === 'Other' ? (customCategory.trim() || form.category) : form.category,
      totalCopies: Number(form.totalCopies) || 1,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
    };

    try {
      if (editingBook) {
        const res = await api.put(`/library/books/${editingBook._id}`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooks((prev) => prev.map((b) => (b._id === editingBook._id ? res.data.book : b)));
        showToast('Book details updated successfully!');
      } else {
        const res = await api.post('/books', body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooks((prev) => [res.data.book, ...prev]);
        showToast('New book cataloged successfully!');
      }
      setShowModal(false);
      setForm(emptyForm);
      setCustomCategory('');
      setEditingBook(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const countTotal = books.length;
  const countAvailable = books.filter(b => b.availableCopies > 0).length;
  const countBorrowed = books.filter(b => b.availableCopies < b.totalCopies).length;
  const countOverdue = books.filter(b => overdueBookIds.includes(b._id)).length;

  return (
    <DashboardLayout>
      {/* Top Control Panel Header */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs mb-4 animate-fadeIn">
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between" style={{ fontFamily: "'Inter', sans-serif" }}>
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200" style={{ color: searchFocused ? '#D97706' : '#94a3b8', fontSize: 20 }}>
              {searchFocused ? 'qr_code_scanner' : 'search'}
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search catalogue by title, author, ISBN, or ID..."
              className="w-full py-1.5 pl-10 pr-4 text-sm rounded-2xl outline-none border border-slate-200 focus:border-[#D97706] focus:ring-4 focus:ring-[#D97706]/10 transition-all bg-white shadow-sm"
            />
          </div>
          
          {/* Dropdowns, toggle and Add button */}
          <div className="flex flex-wrap xl:flex-nowrap gap-3 items-center justify-end">
            {/* Category / Status Filter */}
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl py-1 px-3 shadow-sm">
              <span className="material-symbols-outlined text-slate-400 text-sm mr-1" style={{ fontSize: 18 }}>filter_list</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-bold outline-none bg-transparent text-slate-750 cursor-pointer pr-2"
                style={{ minWidth: 140 }}
              >
                {/* All Books on the very top and bold */}
                <option value="All" style={{ fontWeight: 'bold' }}>All Books ({countTotal})</option>
                <option disabled>──────────</option>
                {/* Statuses and bold */}
                <option value="Available" style={{ fontWeight: 'bold' }}>Available ({countAvailable})</option>
                <option value="Borrowed" style={{ fontWeight: 'bold' }}>Borrowed ({countBorrowed})</option>
                <option value="Overdue" style={{ fontWeight: 'bold' }}>Overdue ({countOverdue})</option>
                <option disabled>──────────</option>
                {/* Categories */}
                {categories.filter(c => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-205 rounded-2xl py-1 px-3 shadow-sm">
              <span className="material-symbols-outlined text-slate-400 text-sm" style={{ fontSize: 18 }}>swap_vert</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold outline-none bg-transparent text-slate-700 cursor-pointer pr-4"
                style={{ minWidth: 110 }}
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="bookId">Book ID</option>
              </select>
            </div>

            {/* Sort Direction Toggle Button */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center bg-white border border-slate-205 hover:border-slate-350 hover:bg-slate-55 rounded-2xl p-1.5 shadow-sm text-slate-500 hover:text-slate-700 transition-all active:scale-95 cursor-pointer"
              title={sortOrder === 'asc' ? 'Ascending Order (Click for Descending)' : 'Descending Order (Click for Ascending)'}
            >
              <span 
                className="material-symbols-outlined transition-transform duration-300"
                style={{ 
                  fontSize: 18, 
                  transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' 
                }}
              >
                arrow_upward
              </span>
            </button>

            {/* View Toggle Buttons */}
            <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-2xl shadow-inner select-none animate-fadeIn">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-xl transition-all flex items-center justify-center ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-800 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-755'
                }`}
                style={{ color: viewMode === 'grid' ? '#1E2A4A' : undefined }}
                title="Grid View"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-xl transition-all flex items-center justify-center ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-800 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-755'
                }`}
                style={{ color: viewMode === 'table' ? '#1E2A4A' : undefined }}
                title="Table List View"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>view_list</span>
              </button>
            </div>

            {/* Add New Book Action */}
            {user?.role === 'librarian' && (
              <>
                {/* Compact Requested Books Action Button (Librarian only) */}
                <button
                  onClick={() => navigate('/book-requests')}
                  className="relative px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-sm hover:shadow transition-all whitespace-nowrap active:scale-95 cursor-pointer"
                  title="Requested Books"
                >
                  <span className="material-symbols-outlined text-[#9E0D0D]" style={{ fontSize: 18 }}>mark_email_unread</span>
                  <span>Requests</span>
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 ring-2 ring-white"></span>
                    </span>
                  )}
                </button>

                <button
                  onClick={openAdd}
                  className="px-4 py-1.5 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-95 hover:shadow-lg transition-all whitespace-nowrap active:scale-95"
                  style={{ backgroundColor: '#9E0D0D', color: '#fff', boxShadow: '0 4px 12px rgba(158,13,13,0.2)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                  Add New Book
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Book List/Grid Container */}
      <div className="pb-4">
        {viewMode === 'grid' ? (
          <BookGrid
            loading={loading}
            filtered={currentItems}
            openEdit={openEdit}
            handleDelete={handleDelete}
            openAdd={openAdd}
            role={user?.role}
            onCardClick={handleCardClick}
            onCardMouseDown={handleCardMouseDown}
            onCardMouseUp={handleCardMouseUp}
            onCardTouchStart={handleCardTouchStart}
            onCardTouchEnd={handleCardTouchEnd}
            selectedBookIds={selectedBookIds}
            isSelectionMode={isSelectionMode}
            overdueBookIds={overdueBookIds}
          />
        ) : (
          <div className="rounded-2xl border overflow-hidden bg-white shadow-sm border-slate-100 animate-fadeIn">
            <BookTable
              loading={loading}
              filtered={currentItems}
              openEdit={openEdit}
              handleDelete={handleDelete}
              openAdd={openAdd}
              role={user?.role}
              onRowClick={handleCardClick}
              selectedBookIds={selectedBookIds}
              isSelectionMode={isSelectionMode}
              overdueBookIds={overdueBookIds}
            />
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm gap-4 select-none animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="text-xs font-bold text-slate-400">
            Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedAndFiltered.length)} of {sortedAndFiltered.length} books
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all border flex items-center justify-center cursor-pointer active:scale-95 ${
                  currentPage === p
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-750 hover:bg-slate-55'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-3 left-0 lg:left-64 right-0 z-[9999] flex justify-center pointer-events-none">
          <style>{`
            @keyframes toast-enter {
              from { transform: translateY(-15px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .toast-popup {
              animation: toast-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className={`toast-popup pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-xl text-white shadow-lg border ${
            toast.type === 'error'
              ? 'bg-amber-600 border-amber-500/50'
              : toast.type === 'delete' 
                ? 'bg-rose-600 border-rose-500/50' 
                : 'bg-emerald-600 border-emerald-500/50'
          }`}>
            <span className="material-symbols-outlined text-white font-bold" style={{ fontSize: 18 }}>
              {toast.type === 'error' ? 'warning' : toast.type === 'delete' ? 'delete_forever' : 'check_circle'}
            </span>
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      <BookFormModal
        showModal={showModal}
        editingBook={editingBook}
        form={form}
        saving={saving}
        error={error}
        customCategory={customCategory}
        setCustomCategory={setCustomCategory}
        handleChange={handleChange}
        handleSave={handleSave}
        setShowModal={setShowModal}
        CATEGORIES={CATEGORIES}
        onImportComplete={fetchBooks}
        showToast={showToast}
      />

      {/* Custom Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl transition-all border border-slate-150 animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
                <span className="material-symbols-outlined font-black" style={{ fontSize: 28 }}>delete_forever</span>
              </div>
              <h3 className="text-lg font-black text-slate-800" style={{ fontFamily: "'Manrope', sans-serif" }}>Delete Catalog Item?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-850">"{bookToDelete.title}"</strong> by <strong>{bookToDelete.author}</strong>? This action cannot be undone and will remove the item from the catalog.
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Profile / Details Modal */}
      {selectedBookProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-slate-50 rounded-3xl w-full max-w-3xl mx-4 overflow-hidden shadow-2xl border border-slate-150 animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4C0000] font-bold" style={{ fontSize: 20 }}>menu_book</span>
                <span className="text-xs font-black uppercase text-[#4C0000] tracking-wider">Book Profile Details</span>
              </div>
              <button 
                onClick={() => setSelectedBookProfile(null)}
                className="text-slate-400 hover:text-slate-650 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col md:flex-row gap-5 max-h-[70vh] overflow-y-auto no-scrollbar items-start">
              
              {/* Left Side: Cover Image white card */}
              <div className="w-full md:w-48 flex-shrink-0 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(148,163,184,0.08)] flex flex-col items-center">
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-100 bg-slate-50 flex items-center justify-center">
                  {selectedBookProfile.coverImageUrl ? (
                    <img 
                      src={selectedBookProfile.coverImageUrl} 
                      alt={selectedBookProfile.title} 
                      className="w-full h-full object-contain p-2 rounded-2xl"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col justify-between p-5 text-white relative rounded-2xl" 
                      style={{ background: getGradientForCategory(selectedBookProfile.category) }}
                    >
                      <span className="material-symbols-outlined text-white/60" style={{ fontSize: 28 }}>book</span>
                      <div>
                        <h4 className="text-sm font-bold line-clamp-3 leading-snug">{selectedBookProfile.title}</h4>
                        <p className="text-[10px] text-white/80 truncate mt-1">by {selectedBookProfile.author}</p>
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center opacity-10">
                        <span className="material-symbols-outlined" style={{ fontSize: 120 }}>menu_book</span>
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Status Badge below Cover */}
                <div className="mt-4 flex justify-center w-full">
                  <span 
                    className="px-4 py-1 text-[10px] font-black uppercase rounded-full border shadow-sm tracking-wider text-center w-full block"
                    style={getStatusBadgeStyle(selectedBookProfile.status || 'Available')}
                  >
                    {selectedBookProfile.status || 'Available'}
                  </span>
                </div>
              </div>

              {/* Right Side: Metadata Profile Details white card */}
              <div className="flex-1 space-y-4 text-left bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(148,163,184,0.08)] w-full">
                <div>
                  <span className="text-[10px] font-extrabold text-[#9E0D0D] uppercase tracking-widest bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                    {selectedBookProfile.category}
                  </span>
                  <h2 className="text-lg font-black text-slate-800 leading-snug mt-2">{selectedBookProfile.title}</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">by <span className="text-slate-700 font-bold">{selectedBookProfile.author}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase">Catalog ID</span>
                    <span className="font-mono font-bold text-slate-700">{selectedBookProfile.bookId || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase">ISBN Code</span>
                    <span className="font-mono font-bold text-slate-700">{selectedBookProfile.isbn || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase">Publisher</span>
                    <span className="font-bold text-slate-700 truncate block max-w-[180px]">{selectedBookProfile.publisher || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase">Published Year</span>
                    <span className="font-bold text-slate-700">{selectedBookProfile.publishedYear || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase">Date Added</span>
                    <span className="font-bold text-slate-700">
                      {selectedBookProfile.createdAt ? new Date(selectedBookProfile.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Stock Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase text-[10px] font-extrabold">Copies Stock Availability</span>
                    <span className="text-slate-700">
                      {selectedBookProfile.availableCopies ?? 0} Available / {selectedBookProfile.totalCopies ?? 0} Total
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, Math.max(0, ((selectedBookProfile.availableCopies ?? 0) / (selectedBookProfile.totalCopies ?? 1)) * 100))}%`,
                        backgroundColor: (selectedBookProfile.availableCopies ?? 0) > 0 ? '#10B981' : '#EF4444'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Book Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50/50 border border-slate-100 p-3 rounded-xl max-h-[140px] overflow-y-auto no-scrollbar">
                    {selectedBookProfile.description || 'No detailed description is available for this book in the catalog database.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            {user?.role === 'librarian' && (
              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white justify-end shadow-xs">
                <button
                  onClick={() => {
                    const bookToEdit = selectedBookProfile;
                    setSelectedBookProfile(null);
                    openEdit(bookToEdit);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:shadow active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Details
                </button>
                <button
                  onClick={() => {
                    const bookIdToDelete = selectedBookProfile._id;
                    setSelectedBookProfile(null);
                    handleDelete(bookIdToDelete);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all hover:shadow active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete Book
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Selection Mode Top Bar Panel */}
      {isSelectionMode && (
        <div className="fixed top-0 left-0 lg:pl-64 right-0 h-16 z-[45] flex items-center justify-center pointer-events-none animate-fadeIn select-none px-4">
          <div className="pointer-events-auto flex items-center gap-2 bg-blue-50/95 border border-blue-150 shadow-md px-3 py-1.5 rounded-full backdrop-blur-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Selected Count Indicator */}
            <div className="flex items-center gap-1.5 text-blue-600 px-2" title="Selected Count">
              <span className="material-symbols-outlined font-black" style={{ fontSize: 18 }}>library_add_check</span>
              <span className="text-[10px] font-black font-mono leading-none bg-blue-100/80 px-2 py-0.5 rounded-full">
                {selectedBookIds.length}
              </span>
            </div>

            <div className="w-[1px] h-4 bg-blue-200/60 mx-0.5"></div>

            {/* Select All / Deselect All Icon Button */}
            <button
              onClick={() => {
                if (selectedBookIds.length === sortedAndFiltered.length) {
                  setSelectedBookIds([]);
                  setIsSelectionMode(false);
                } else {
                  setSelectedBookIds(sortedAndFiltered.map(b => b._id));
                }
              }}
              className="p-1.5 rounded-xl hover:bg-blue-100 text-blue-600 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
              title={selectedBookIds.length === sortedAndFiltered.length ? "Deselect All" : "Select All"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {selectedBookIds.length === sortedAndFiltered.length ? 'deselect' : 'select_all'}
              </span>
            </button>

            {/* Delete Selected Icon Button */}
            {selectedBookIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
                title="Delete Selected Books"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            )}

            <div className="w-[1px] h-4 bg-blue-200/60 mx-0.5"></div>

            {/* Cancel/Exit button */}
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedBookIds([]);
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
              title="Exit Selection"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl transition-all border border-slate-150 animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-100 animate-pulse">
                <span className="material-symbols-outlined font-black" style={{ fontSize: 28 }}>delete_sweep</span>
              </div>
              <h3 className="text-lg font-black text-slate-800" style={{ fontFamily: "'Manrope', sans-serif" }}>Delete Multiple Items?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete the <strong className="text-slate-850">{selectedBookIds.length} selected books</strong>? This will remove all of them from the catalog permanently. This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={executeBulkDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                Yes, Delete All
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
