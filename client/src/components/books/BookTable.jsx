import React from 'react';

/**
 * Presentational component to render the table listing of books
 * 
 * @param {boolean} loading - Displays the rotating progress spinner when fetching books
 * @param {Array} filtered - The list of filtered books matching category or query inputs
 * @param {Function} openEdit - Triggers when clicking edit button; pre-populates forms
 * @param {Function} handleDelete - Triggers when clicking delete button; requests API deletion
 * @param {Function} openAdd - Triggered when clicking 'Add first book' empty state link
 */
export default function BookTable({ 
  loading, 
  filtered, 
  openEdit, 
  handleDelete, 
  openAdd, 
  role, 
  onRowClick,
  selectedBookIds = [],
  isSelectionMode = false,
  overdueBookIds = []
}) {
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-14 bg-slate-200 rounded-lg flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-slate-200 rounded w-2/5" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
              <div className="h-5 w-20 bg-slate-200 rounded-full hidden sm:block" />
              <div className="h-3 bg-slate-100 rounded w-16 hidden md:block" />
              <div className="h-3 bg-slate-100 rounded w-20 hidden lg:block" />
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94a3b8' }}>
        <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>search_off</span>
        <p className="text-sm font-medium">No books found</p>
        {role === 'librarian' && (
          <button onClick={openAdd} className="text-xs mt-2 font-semibold hover:underline" style={{ color: '#9E0D0D' }}>
            + Add your first book
          </button>
        )}
      </div>
    );
  }

  // Setup table columns (incorporating Cover and Status)
  const columns = [];
  if (isSelectionMode) {
    columns.push('');
  }
  columns.push('Book ID', 'Cover', 'Title', 'Author', 'ISBN', 'Category', 'Copies', 'Status', 'Added');
  if (role === 'librarian') {
    columns.push(''); // For actions column
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Overdue':
        return { backgroundColor: 'rgba(244, 63, 94, 0.12)', color: '#e11d48', border: '1px solid rgba(244, 63, 94, 0.25)' };
      case 'Borrowed':
        return { backgroundColor: 'rgba(251, 146, 60, 0.12)', color: '#ea580c', border: '1px solid rgba(251, 146, 60, 0.25)' };
      case 'Reserved':
        return { backgroundColor: 'rgba(248, 113, 113, 0.12)', color: '#dc2626', border: '1px solid rgba(248, 113, 113, 0.25)' };
      case 'Available':
      default:
        return { backgroundColor: 'rgba(74, 222, 128, 0.12)', color: '#166534', border: '1px solid rgba(74, 222, 128, 0.25)' };
    }
  };

  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'Fiction':
        return { backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', border: '1px solid rgba(99, 102, 241, 0.2)' };
      case 'Science':
        return { backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.2)' };
      case 'History':
        return { backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#ea580c', border: '1px solid rgba(249, 115, 22, 0.2)' };
      case 'Math':
        return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)' };
      case 'Reference':
        return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'Technology':
        return { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', border: '1px solid rgba(139, 92, 246, 0.2)' };
      case 'Biography':
        return { backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#db2777', border: '1px solid rgba(236, 72, 153, 0.2)' };
      default:
        return { backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#475569', border: '1px solid rgba(100, 116, 139, 0.2)' };
    }
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

  return (
    <div className="w-full">
      <table className="w-full text-left text-xs align-middle table-fixed" style={{ fontFamily: "'Inter', sans-serif" }}>
        <thead className="sticky top-0 z-10 shadow-2xs" style={{ background: '#FFFFFF', borderBottom: '1px solid #CBD5E1' }}>
          <tr className="divide-x divide-slate-200">
            {isSelectionMode && (
              <th className="py-2.5 px-2 w-8 text-center"></th>
            )}
            <th className="py-2.5 px-2 w-20 text-xs font-bold uppercase tracking-wider text-center" style={{ color: '#4C0000' }}>
              Book ID
            </th>
            <th className="py-2.5 px-2 w-12 text-xs font-bold uppercase tracking-wider text-center" style={{ color: '#4C0000' }}>
              Cover
            </th>
            <th className="py-2.5 px-2 w-32 md:w-36 lg:w-40 text-xs font-bold uppercase tracking-wider text-center" style={{ color: '#4C0000' }}>
              Title
            </th>
            <th className="py-2.5 px-2 w-28 md:w-36 text-xs font-bold uppercase tracking-wider text-center hidden sm:table-cell" style={{ color: '#4C0000' }}>
              Author
            </th>
            <th className="py-2.5 px-2 w-24 text-xs font-bold uppercase tracking-wider text-center hidden xl:table-cell" style={{ color: '#4C0000' }}>
              ISBN
            </th>
            <th className="py-2.5 px-2 w-24 text-xs font-bold uppercase tracking-wider text-center hidden md:table-cell" style={{ color: '#4C0000' }}>
              Category
            </th>
            <th className="py-2.5 px-2 w-20 text-xs font-bold uppercase tracking-wider text-center" style={{ color: '#4C0000' }}>
              Copies
            </th>
            <th className="py-2.5 px-2 w-24 text-xs font-bold uppercase tracking-wider text-center" style={{ color: '#4C0000' }}>
              Status
            </th>
            <th className="py-2.5 px-2 w-24 text-xs font-bold uppercase tracking-wider text-center hidden lg:table-cell" style={{ color: '#4C0000' }}>
              Added
            </th>
            {role === 'librarian' && (
              <th className="py-2.5 px-2 w-20 text-xs font-bold uppercase tracking-wider text-center" style={{ color: '#4C0000' }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-100">
          {filtered.map((book, index) => {
            const isSelected = selectedBookIds.includes(book._id);
            const isOverdue = overdueBookIds.includes(book._id);
            const dynamicStatus = isOverdue
              ? 'Overdue'
              : (book.status === 'Reserved' ? 'Reserved' : (book.availableCopies === 0 ? 'Borrowed' : 'Available'));
            return (
              <tr 
                key={book._id} 
                onClick={() => onRowClick && onRowClick(book)}
                className={`transition-colors duration-150 cursor-pointer ${
                  isSelected ? 'bg-red-50/50 hover:bg-red-100/50' : index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'
                } hover:bg-[#EAEFF5]`} 
                title={isSelectionMode ? 'Click to select book' : 'Click to view full book details profile'}
              >
                {isSelectionMode && (
                  <td className="py-2 px-2 select-none text-center">
                    <span className="material-symbols-outlined align-middle" style={{ 
                      fontSize: 18, 
                      color: isSelected ? '#16a34a' : '#94a3b8',
                      fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0"
                    }}>
                      {isSelected ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </td>
                )}
                
                {/* Unique Book Barcode/ID */}
                <td className="py-2 px-2 text-xs font-mono font-bold text-center truncate" style={{ color: '#9E0D0D' }} title={book.bookId}>
                  {book.bookId || '—'}
                </td>
   
                {/* Book Cover Thumbnail */}
                <td className="py-2 px-2 text-center">
                  <div className="flex justify-center">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-8 h-10 object-cover rounded shadow-2xs hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <div
                        className="w-8 h-10 rounded shadow-2xs flex flex-col items-center justify-center text-white select-none text-[8px] font-bold overflow-hidden"
                        style={{ background: getGradientForCategory(book.category) }}
                        title={book.title}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>menu_book</span>
                        <span className="text-[6px] tracking-tighter truncate w-full px-0.5 text-center">{book.title.slice(0, 3).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </td>
                
                {/* Title */}
                <td className="py-2 px-3 font-semibold text-xs text-slate-800">
                  <div className="truncate font-semibold" title={book.title}>{book.title}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate sm:hidden">{book.author}</div>
                </td>
   
                {/* Author */}
                <td className="py-2 px-2 text-slate-600 font-medium text-xs hidden sm:table-cell">
                  <div className="truncate" title={book.author}>{book.author}</div>
                </td>
                
                {/* Optional ISBN string */}
                <td className="py-2 px-2 text-[11px] font-mono text-slate-400 text-center truncate hidden xl:table-cell" title={book.isbn}>
                  {book.isbn || '—'}
                </td>
                
                {/* Categorization pill */}
                <td className="py-2 px-2 text-center hidden md:table-cell">
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border inline-block truncate max-w-full" style={getCategoryStyle(book.category)}>
                    {book.category}
                  </span>
                </td>
                
                {/* Copy counts */}
                <td className="py-2 px-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-50 text-[10px] font-extrabold border border-slate-100 rounded-md text-slate-700 select-none whitespace-nowrap">
                    <span style={{ 
                      color: (book.availableCopies ?? 0) === 0 
                        ? '#b91c1c' 
                        : (book.availableCopies ?? 0) <= 2 
                          ? '#D97706' 
                          : '#15803d' 
                    }}>
                      {book.availableCopies ?? 0}
                    </span>
                    <span className="text-slate-400 font-semibold">&nbsp;/&nbsp;{book.totalCopies ?? 0}</span>
                  </span>
                </td>
   
                {/* Book Circulation Status */}
                <td className="py-2 px-2 text-center whitespace-nowrap">
                  <span
                    className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shadow-2xs inline-block"
                    style={getStatusStyle(dynamicStatus)}
                  >
                    {dynamicStatus}
                  </span>
                </td>
                
                {/* Book Added Date (Compact DD/MM/YYYY) */}
                <td className="py-2 px-2 text-[11px] font-medium text-slate-500 text-center whitespace-nowrap hidden lg:table-cell">
                  {book.createdAt ? new Date(book.createdAt).toLocaleDateString('en-GB') : '—'}
                </td>
                
                {/* Interactive buttons */}
                {role === 'librarian' && (
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(book); }}
                        className="p-1 rounded-lg hover:bg-slate-100 text-[#4F5B7D] transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(book._id); }}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
