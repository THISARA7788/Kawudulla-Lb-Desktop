import React from 'react';

/**
 * Presentational component to render the grid view of books
 */
export default function BookGrid({ 
  loading, 
  filtered, 
  openAdd, 
  role, 
  onCardClick,
  onCardMouseDown,
  onCardMouseUp,
  onCardTouchStart,
  onCardTouchEnd,
  selectedBookIds = [],
  isSelectionMode = false,
  overdueBookIds = []
}) {
  
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
        {Array.from({ length: 12 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-3 flex flex-col space-y-2.5 shadow-2xs">
            <div className="h-44 w-full bg-slate-200 rounded-xl" />
            <div className="h-3.5 bg-slate-200 rounded w-4/5" />
            <div className="h-2.5 bg-slate-100 rounded w-1/2" />
            <div className="pt-2 flex justify-between items-center">
              <div className="h-4 w-12 bg-slate-100 rounded-full" />
              <div className="h-4 w-14 bg-slate-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <span className="material-symbols-outlined mb-3" style={{ fontSize: 56, opacity: 0.25 }}>search_off</span>
        <p className="text-base font-semibold">No books match your selection</p>
        <p className="text-xs text-slate-400 mt-1">Try refining search query or category filters</p>
        {role === 'librarian' && (
          <button onClick={openAdd} className="text-xs mt-4 px-4 py-2 font-bold rounded-xl text-white transition-all cursor-pointer" style={{ backgroundColor: '#9E0D0D', boxShadow: '0 2px 8px rgba(158,13,13,0.15)' }}>
            + Add New Book
          </button>
        )}
      </div>
    );
  }

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
      case 'Overdue':
        return { backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#e11d48', border: '1px solid rgba(244, 63, 94, 0.3)' };
      case 'Borrowed':
        return { backgroundColor: 'rgba(251, 146, 60, 0.15)', color: '#ea580c', border: '1px solid rgba(251, 146, 60, 0.3)' };
      case 'Reserved':
        return { backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#dc2626', border: '1px solid rgba(248, 113, 113, 0.3)' };
      case 'Available':
      default:
        return { backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#166534', border: '1px solid rgba(74, 222, 128, 0.3)' };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4">
      {filtered.map((book) => {
        const isSelected = selectedBookIds.includes(book._id);
        const isOverdue = overdueBookIds.includes(book._id);
        const dynamicStatus = isOverdue
          ? 'Overdue'
          : (book.status === 'Reserved' ? 'Reserved' : (book.availableCopies === 0 ? 'Borrowed' : 'Available'));
        return (
          <div
            key={book._id}
            onMouseDown={() => onCardMouseDown && onCardMouseDown(book)}
            onMouseUp={onCardMouseUp}
            onTouchStart={() => onCardTouchStart && onCardTouchStart(book)}
            onTouchEnd={onCardTouchEnd}
            onClick={() => onCardClick && onCardClick(book)}
            className={`group relative flex flex-col rounded-2xl bg-white p-4 transition-all duration-300 shadow-[0_4px_10px_rgba(148,163,184,0.28)] ${
              isSelected 
                ? 'ring-2 ring-offset-2 ring-[#9E0D0D] bg-red-50/20 shadow-md shadow-red-100/60' 
                : 'hover:-translate-y-1.5 hover:shadow-[0_8px_20px_rgba(148,163,184,0.45)]'
            } cursor-pointer`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Checkbox indicator for Selection Mode */}
            {isSelectionMode && (
              <div className="absolute top-2.5 left-2.5 z-30 select-none bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center p-0.5 animate-fadeIn">
                <span className="material-symbols-outlined font-black" style={{ 
                  fontSize: 18, 
                  color: isSelected ? '#9E0D0D' : '#94a3b8',
                  fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0"
                }}>
                  {isSelected ? 'check_box' : 'check_box_outline_blank'}
                </span>
              </div>
            )}

            {/* Cover Image Container */}
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-sm bg-slate-50 ring-1 ring-slate-100 flex items-center justify-center transform translate-z-0">

              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-full h-full object-contain p-1.5 rounded-xl transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = ''; // Fall back to visual representation
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col justify-between p-4 text-white relative rounded-xl"
                  style={{ background: getGradientForCategory(book.category) }}
                >
                  <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-white/50" style={{ fontSize: 22 }}>book</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm tracking-wider">
                      {book.category}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 select-none">
                    <h4 className="text-sm font-bold line-clamp-3 leading-snug">{book.title}</h4>
                    <p className="text-[10px] text-white/70 truncate">by {book.author}</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <span className="material-symbols-outlined" style={{ fontSize: 96 }}>menu_book</span>
                  </div>
                </div>
              )}

              {!isSelectionMode && (
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px] rounded-xl z-20">
                  <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                    <span className="material-symbols-outlined font-semibold" style={{ fontSize: 14 }}>visibility</span>
                    <span>View</span>
                  </div>
                </div>
              )}
            </div>

            {/* Book Metadata details */}
            <div className="flex flex-col flex-1 mt-3.5">
              <div className="flex justify-between items-center select-none">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#9E0D0D]">
                  {book.category}
                </span>
                <span
                  className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border shadow-sm"
                  style={getStatusBadgeStyle(dynamicStatus)}
                >
                  {dynamicStatus}
                </span>
              </div>
              
              <h3 className="text-sm font-bold text-slate-800 mt-1 line-clamp-1 leading-snug group-hover:text-[#9E0D0D] transition-colors" title={book.title}>
                {book.title}
              </h3>
              
              <p className="text-xs text-slate-500 mt-0.5 truncate" title={book.author}>
                by {book.author}
              </p>
              {/* Catalog Serial ID & Copies count */}
              <div className="flex items-center justify-between mt-2.5 text-xs font-bold text-slate-650 font-mono select-none border-t border-slate-100 pt-2">
                <div className="flex items-center gap-1">
                  <span className="text-slate-950 font-black">{book.bookId || '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 15 }}>import_contacts</span>
                  <span className="font-extrabold" style={{ color: (book.availableCopies ?? 0) > 0 ? '#15803d' : '#ef4444' }}>
                    {book.availableCopies ?? 0} / {book.totalCopies ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
