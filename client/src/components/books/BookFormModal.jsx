import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import XLSX from 'xlsx-js-style';
import { compressImage } from '../../utils/imageCompressor';

const STATUS_OPTIONS = ['Available', 'Borrowed', 'Reserved'];

// Audio Synth Beep Helper
const playBeep = (type = 'success') => {
  // Audio feedback disabled per user preference
};

export default function BookFormModal({
  showModal,
  editingBook,
  form,
  saving,
  error,
  customCategory,
  setCustomCategory,
  handleChange,
  handleSave,
  setShowModal,
  CATEGORIES,
  onImportComplete,
  showToast
}) {
  // ISBN Processing States
  const [searchingIsbn, setSearchingIsbn] = useState(false);
  const [isbnSearchError, setIsbnSearchError] = useState('');
  const [duplicateBook, setDuplicateBook] = useState(null);

  const handleChangeRef = useRef(handleChange);
  handleChangeRef.current = handleChange;

  const isbnInputRef = useRef(null);

  // Auto-dismiss ISBN search warning after 5 seconds
  useEffect(() => {
    if (isbnSearchError) {
      const timer = setTimeout(() => {
        setIsbnSearchError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isbnSearchError]);

  // Clear ISBN search warning immediately when the user starts modifying the ISBN input
  useEffect(() => {
    setIsbnSearchError('');
  }, [form.isbn]);

  const triggerIsbnSearch = useCallback(async (isbnVal) => {
    if (!isbnVal || !isbnVal.trim()) return;
    const cleanIsbn = isbnVal.trim().replace(/[-\s]/g, '');
    setSearchingIsbn(true);
    setIsbnSearchError('');
    setDuplicateBook(null);

    // Set ISBN value inside parent React form state
    handleChangeRef.current({ target: { name: 'isbn', value: cleanIsbn } });

    try {
      // 1. Check local catalog duplication
      const checkRes = await api.get(`/books/check/${cleanIsbn}`);
      if (checkRes.data.exists) {
        playBeep('error');
        setDuplicateBook(checkRes.data.book);
        setSearchingIsbn(false);
        setTimeout(() => {
          if (isbnInputRef.current) isbnInputRef.current.select();
        }, 50);
        return;
      }

      // 2. Query Unified Backend Lookup API (Google Books + Open Library + Sri Lankan Registry)
      const lookupRes = await api.get(`/books/lookup-isbn/${cleanIsbn}`);
      if (lookupRes.data && lookupRes.data.success && lookupRes.data.book) {
        const bookData = lookupRes.data.book;
        playBeep('success');
        // Auto populate fields by mimicking target changes
        Object.keys(bookData).forEach(key => {
          handleChangeRef.current({ target: { name: key, value: bookData[key] } });
        });
      } else {
        playBeep('error');
        setIsbnSearchError(lookupRes.data.message || 'ISBN code not found in databases. Please enter details manually.');
      }
      setTimeout(() => {
        if (isbnInputRef.current) isbnInputRef.current.select();
      }, 50);
    } catch (err) {
      playBeep('error');
      setIsbnSearchError('Network error while performing lookup.');
      console.error(err);
      setTimeout(() => {
        if (isbnInputRef.current) isbnInputRef.current.select();
      }, 50);
    } finally {
      setSearchingIsbn(false);
    }
  }, []);

  // Hardware Scanner USB Listening Buffer
  useEffect(() => {
    if (!showModal) return;

    // Automatically focus the ISBN input field when the modal opens
    setTimeout(() => {
      if (isbnInputRef.current) {
        isbnInputRef.current.focus();
      }
    }, 50);

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      const interval = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Hardware scanners type keys within < 45ms intervals
      if (interval > 45) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        const cleanBuffer = buffer.trim();
        if (cleanBuffer.length >= 8 && /^\d+$/.test(cleanBuffer)) {
          e.preventDefault();
          e.stopPropagation();
          triggerIsbnSearch(cleanBuffer);
          buffer = '';
        }
      } else if (e.key && e.key.length === 1 && /^\d+$/.test(e.key)) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, triggerIsbnSearch]);

  // Image Upload Canvas Compression & Cloudinary API
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Bulk CSV Import States & Handlers
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const downloadCSVTemplate = () => {
    const link = document.createElement("a");
    link.setAttribute("href", "/library_book_import_template.xlsx");
    link.setAttribute("download", "library_book_import_template.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = null;
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/library/books/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResult({
        success: true,
        importedCount: res.data.importedCount,
        skippedCount: res.data.skippedCount,
      });
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error('Spreadsheet import error:', err);
      showToast(err.response?.data?.message || "Failed to import books. Please check column headers.", 'error');
    } finally {
      setImporting(false);
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please provide a valid image cover file (JPEG/PNG/WEBP).', 'error');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      // Compress image using client-side HTML5 Canvas utility (outputs base64 data url)
      const compressedBase64 = await compressImage(file);
      // Convert base64 data URL to a File object for standard multipart form-data upload
      const compressedFile = dataURLtoFile(compressedBase64, file.name);

      const formData = new FormData();
      formData.append('coverImage', compressedFile);

      const response = await api.post('/books/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      if (response.data && response.data.secure_url) {
        handleChange({ target: { name: 'coverImageUrl', value: response.data.secure_url } });
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to upload image. Verify Cloudinary variables.', 'error');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const isFormValid = !!(
    form.title?.trim() &&
    form.author?.trim() &&
    (form.category !== 'Other' || customCategory?.trim())
  );

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        className="bg-slate-50 rounded-2xl p-5 w-full max-w-4xl mx-4 shadow-2xl transition-all border border-slate-150"
        style={{ maxHeight: '96vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: '#4C0000', fontFamily: "'Manrope', sans-serif" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu_book</span>
              {editingBook ? 'Edit Book Details' : 'Add New Book'}
            </h2>
            <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">
              {editingBook && editingBook.createdAt 
                ? `Added on ${new Date(editingBook.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` 
                : 'Fill details manually or use barcode lookup'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Bulk Import controls inside header when adding book */}
            {!editingBook && (
              <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                {/* Download CSV Template */}
                <button
                  type="button"
                  onClick={downloadCSVTemplate}
                  className="flex items-center justify-center bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-55 rounded-xl p-2 shadow-sm text-slate-500 hover:text-slate-700 transition-all active:scale-95 cursor-pointer"
                  title="Download Excel Import Template"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                </button>

                {/* Bulk Import trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Import Books from CSV/Excel"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
                  Bulk Import
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleCSVImport}
                  className="hidden"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              style={{ color: '#94a3b8' }}
              title="Close"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
            </button>
          </div>
        </div>

        {/* Local DB Duplicate Match Overlay */}
        {duplicateBook && (
          <div className="p-4 rounded-xl mb-4 border animate-fadeIn flex flex-col gap-2.5" style={{ backgroundColor: '#fff7ed', borderColor: '#ffedd5' }}>
            <div className="flex gap-2 items-start text-orange-800">
              <span className="material-symbols-outlined text-orange-600 mt-0.5">warning</span>
              <div>
                <p className="text-sm font-bold">This Book Already Exists in Database</p>
                <p className="text-xs opacity-90">An item with ISBN {duplicateBook.isbn} is already listed under Catalog ID: {duplicateBook.bookId}</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center bg-white p-3 rounded-lg border border-orange-100">
              {duplicateBook.coverImageUrl ? (
                <img src={duplicateBook.coverImageUrl} alt="Book Cover" className="w-9 h-12 object-contain rounded shadow" />
              ) : (
                <div className="w-9 h-12 bg-slate-100 flex items-center justify-center rounded border border-dashed"><span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>image</span></div>
              )}
              <div>
                <h4 className="text-xs font-bold text-slate-800">{duplicateBook.title}</h4>
                <p className="text-[10px] text-slate-500">by {duplicateBook.author} • Copies: {duplicateBook.availableCopies}/{duplicateBook.totalCopies}</p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const newTotal = (duplicateBook.totalCopies || 0) + 1;
                    await api.put(`/library/books/${duplicateBook._id}`, { totalCopies: newTotal });
                    playBeep('success');
                    showToast(`Successfully increased copies of "${duplicateBook.title}" to ${newTotal}.`, 'success');
                    setShowModal(false);
                    // Give toast time to show before reload
                    setTimeout(() => window.location.reload(), 1500);
                  } catch (e) {
                    showToast('Failed to increment copies.', 'error');
                  }
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:shadow"
                style={{ backgroundColor: '#c2410c' }}
              >
                Increment Stock (+1 Copy)
              </button>
              <button
                type="button"
                onClick={() => setDuplicateBook(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Ignore, Catalog As Unique
              </button>
            </div>
          </div>
        )}

        {/* Global Errors */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium border flex items-center gap-2" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        {/* ISBN Warning */}
        {isbnSearchError && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-2" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
            {isbnSearchError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            
            {/* Left Column: General Book Information */}
            <div className="bg-white p-4 rounded-2xl shadow-[0_4px_12px_rgba(148,163,184,0.08)] border border-slate-100 space-y-2.5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>info</span>
                General Book Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Title <span className="text-red-500 font-bold">*</span></label>
                  <input name="title" value={form.title || ''} onChange={handleChange} required
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="e.g. Sherlock Holmes"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Author <span className="text-red-500 font-bold">*</span></label>
                  <input name="author" value={form.author || ''} onChange={handleChange} required
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="e.g. Arthur Conan Doyle"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category <span className="text-red-500 font-bold">*</span></label>
                  <select name="category" value={CATEGORIES.includes(form.category) ? form.category : 'Other'} onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white text-slate-700 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    {!CATEGORIES.includes(form.category) && <option value="Other">{form.category}</option>}
                  </select>
                  {(form.category === 'Other') && (
                    <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category" required
                      className="w-full mt-2 px-3 py-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white placeholder:text-slate-300 placeholder:font-normal"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Publisher</label>
                  <input name="publisher" value={form.publisher || ''} onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="e.g. George Newnes"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Published Year</label>
                  <input name="publishedYear" type="number" value={form.publishedYear || ''} onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="e.g. 1892"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Book ID</label>
                  <input
                    value={form.bookId || editingBook?.bookId || 'BKXXXX'}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none border border-slate-200 font-mono font-bold text-slate-400 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ISBN Code</label>
                  <input name="isbn" value={form.isbn || ''} onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="e.g. 9780123456789"
                  />
                </div>
                <div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Book Description</label>
                <textarea name="description" value={form.description || ''} onChange={handleChange} rows="2"
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="Brief summary or description..."
                />
              </div>
            </div>

            {/* Right Column: Smart Scanning, Inventory, Cover Art */}
            <div className="space-y-3">
              {/* Section: Smart ISBN Lookup */}
              <div className="bg-white p-4 rounded-2xl border-l-4 border-l-[#9E0D0D] border border-slate-100 flex flex-col gap-2 shadow-[0_4px_12px_rgba(148,163,184,0.08)]">
                <div className="flex items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#9E0D0D] flex items-center gap-1.5 select-none">
                    <span className="material-symbols-outlined text-[#9E0D0D]" style={{ fontSize: 16 }}>qr_code_scanner</span>
                    Smart ISBN Lookup
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ISBN Code</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 16 }}>barcode_reader</span>
                      <input
                        ref={isbnInputRef}
                        name="isbn"
                        value={form.isbn || ''}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            triggerIsbnSearch(form.isbn);
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.target.select()}
                        placeholder="Scan barcode or enter ISBN number..."
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white placeholder:text-slate-300 placeholder:font-normal"
                      />
                      {searchingIsbn && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                          <span className="material-symbols-outlined animate-spin text-[#9E0D0D]" style={{ fontSize: 16 }}>progress_activity</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={searchingIsbn || !form.isbn}
                      onClick={() => triggerIsbnSearch(form.isbn)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-white bg-[#9E0D0D] hover:bg-[#7F0A0A] disabled:opacity-50 transition-all cursor-pointer active:scale-95 whitespace-nowrap shadow-sm hover:shadow"
                    >
                      Lookup
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Cover Art & Inventory */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2.5 shadow-[0_4px_12px_rgba(148,163,184,0.08)]">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>palette</span>
                  Cover Art & Inventory
                </h3>
                
                <div className="flex gap-4 items-center">
                  {/* Cover Image Preview */}
                  <div className="relative w-16 h-20 flex-shrink-0 bg-white border border-slate-200 rounded overflow-hidden shadow-sm flex items-center justify-center">
                    {form.coverImageUrl ? (
                      <>
                        <img src={form.coverImageUrl} alt="Book cover" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleChange({ target: { name: 'coverImageUrl', value: '' } })}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-655 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
                          style={{ backgroundColor: '#dc2626' }}
                        >
                          <span className="material-symbols-outlined text-[10px]">delete</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">image</span>
                        <span className="text-[7px] font-bold uppercase tracking-wider">No Cover</span>
                      </div>
                    )}
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    className={`flex-1 border border-dashed rounded-xl p-2.5 text-center transition-all cursor-pointer ${
                      dragActive ? 'border-[#9E0D0D] bg-[#9E0D0D]/5' : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/30'
                    }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('cover-file-input').click()}
                  >
                    <input
                      id="cover-file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined animate-spin text-[#9E0D0D]" style={{ fontSize: 16 }}>progress_activity</span>
                        <span className="text-[8px] font-semibold text-slate-600">Uploading... {uploadProgress}%</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">cloud_upload</span>
                        <p className="text-[10px] font-semibold">
                          Drop cover or <span className="text-[#9E0D0D] font-bold hover:underline">browse</span>
                        </p>
                        <p className="text-[7px] text-slate-400">PNG, JPG, WEBP</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-3 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500">Total Copies in Stock</label>
                  
                  <div className="flex items-center gap-2">
                    <input
                      name="totalCopies"
                      type="number"
                      min="1"
                      value={form.totalCopies ?? ''}
                      onChange={handleChange}
                      className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 transition-all bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const current = Number(form.totalCopies) || 1;
                          handleChange({ target: { name: 'totalCopies', value: current + 1 } });
                        }}
                        className="w-6 h-5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-[#9E0D0D] flex items-center justify-center text-slate-500 active:scale-90 transition-all cursor-pointer shadow-sm"
                        title="Increase copies"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">arrow_drop_up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = Number(form.totalCopies) || 1;
                          handleChange({ target: { name: 'totalCopies', value: Math.max(1, current - 1) } });
                        }}
                        className="w-6 h-5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-[#9E0D0D] flex items-center justify-center text-slate-500 active:scale-90 transition-all cursor-pointer shadow-sm"
                        title="Decrease copies"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">arrow_drop_down</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 border-t border-slate-100 pt-3 mt-4">
            <button
              type="submit"
              disabled={!isFormValid || saving || uploadingImage}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
                isFormValid && !saving && !uploadingImage
                  ? 'text-white bg-[#9E0D0D] hover:bg-[#7F0A0A] shadow-md hover:shadow-lg active:scale-95 cursor-pointer'
                  : 'text-white/60 bg-slate-300 opacity-40 cursor-not-allowed shadow-none'
              }`}
            >
              {saving ? 'Saving Book...' : editingBook ? 'Save Update' : 'Add Book'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Import Progress Overlay */}
      {importing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-all select-none animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4">
            <div className="w-16 h-16 border-4 border-[#9E0D0D] border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-lg font-bold text-slate-800 mt-2">Importing Books</h3>
            <p className="text-xs text-slate-500">Parsing spreadsheet and updating library database. Please wait...</p>
          </div>
        </div>
      )}

      {/* Bulk Import Result Dialog */}
      {importResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 animate-fadeIn">
            <span className="material-symbols-outlined text-5xl text-emerald-500 mb-3" style={{ fontSize: 56 }}>check_circle</span>
            <h3 className="text-xl font-bold text-slate-800">Import Complete</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Successfully imported <strong className="text-slate-800">{importResult.importedCount}</strong> new books.
            </p>
            {importResult.skippedCount > 0 && (
              <p className="text-xs text-amber-600 mt-1 font-semibold">
                Skipped {importResult.skippedCount} duplicate ISBNs.
              </p>
            )}
            <button
              type="button"
              onClick={() => { setImportResult(null); setShowModal(false); }}
              className="mt-6 w-full py-2.5 bg-[#9E0D0D] text-white rounded-2xl text-sm font-bold shadow-md hover:bg-[#7F0A0A] transition-all active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
