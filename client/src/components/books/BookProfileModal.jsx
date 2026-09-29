import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getEmptyBookCoverBackground } from '../../utils/bookCoverUtils';

export default function BookProfileModal({ book, isOpen, onClose }) {
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !book) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 transition-all animate-fadeIn"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col relative max-h-[90vh] animate-in zoom-in-95 duration-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#9E0D0D] via-[#DC2626] to-[#EAB308]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9E0D0D] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
              Book Profile
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {book.category || 'General'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Book Card */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Book Cover Thumbnail */}
            <div className="w-24 sm:w-28 aspect-[3/4] rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 shadow-sm relative">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white/80"
                  style={{ background: getEmptyBookCoverBackground(book) }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>menu_book</span>
                </div>
              )}
            </div>

            {/* Book Header Information */}
            <div className="flex-1 min-w-0">
              <h2
                className="text-base sm:text-lg font-black text-slate-800 leading-snug"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {book.title}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                by <span className="text-slate-700 font-bold">{book.author || 'Unknown Author'}</span>
              </p>

              {/* Recommendation Context */}
              {book.recommendationReason && (
                <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/70">
                  <span className="material-symbols-outlined text-amber-600" style={{ fontSize: 16 }}>
                    auto_awesome
                  </span>
                  <span className="truncate">{book.recommendationReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Book ID</p>
              <p className="text-xs font-extrabold text-slate-800 truncate mt-0.5">
                {book.bookId || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">ISBN</p>
              <p className="text-xs font-extrabold text-slate-800 truncate mt-0.5">
                {book.isbn || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Published</p>
              <p className="text-xs font-extrabold text-slate-800 truncate mt-0.5">
                {book.publishedYear || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Publisher</p>
              <p className="text-xs font-extrabold text-slate-800 truncate mt-0.5">
                {book.publisher || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              navigate('/books');
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-[#9E0D0D] hover:bg-[#7F0A0A] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
            View in Catalogue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
