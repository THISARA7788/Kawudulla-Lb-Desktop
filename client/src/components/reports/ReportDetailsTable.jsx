import React, { useState } from 'react';

export default function ReportDetailsTable({
  reportType,
  reportData,
  bookFilter = 'all',
  onSelectBookFilter,
  fineFilter = 'all',
  onSelectFineFilter,
  circulationFilter = 'all',
  onSelectCirculationFilter,
  memberFilter = 'all',
  onSelectMemberFilter,
}) {
  const [showCategories, setShowCategories] = useState(false);

  if (!reportData) return null;

  if (reportType === 'circulation') {
    const txns = reportData.transactions || [];
    let filteredTxns = txns;
    if (circulationFilter === 'returned') {
      filteredTxns = txns.filter((t) => t.status === 'returned' || !!t.returnDate);
    } else if (circulationFilter === 'active') {
      filteredTxns = txns.filter((t) => {
        const isOverdue = t.status === 'overdue' || (!t.returnDate && new Date(t.dueDate) < new Date());
        return !t.returnDate && !isOverdue;
      });
    } else if (circulationFilter === 'overdue') {
      filteredTxns = txns.filter((t) => {
        const isOverdue = t.status === 'overdue' || (!t.returnDate && new Date(t.dueDate) < new Date());
        const wasReturnedOverdue = t.returnDate && t.overdueDays > 0;
        return isOverdue || wasReturnedOverdue;
      });
    }

    const circFilterLabels = {
      returned: 'Returned Records',
      active: 'Currently Active Borrows',
      overdue: 'Overdue Books',
    };

    const circFilterColors = {
      returned: '#166534',
      active: '#1e40af',
      overdue: '#b31b25',
    };

    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {circulationFilter !== 'all' && (
          <div className="flex items-center justify-between bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: circFilterColors[circulationFilter] || '#1a1245' }}>filter_alt</span>
              <span className="text-slate-600 font-medium">
                Showing: <strong style={{ color: circFilterColors[circulationFilter] || '#1a1245' }}>{circFilterLabels[circulationFilter] || circulationFilter}</strong> ({filteredTxns.length} records)
              </span>
            </div>
            <button
              onClick={() => onSelectCirculationFilter && onSelectCirculationFilter('all')}
              className="text-xs font-bold text-slate-500 hover:text-[#b31b25] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Clear Filter
            </button>
          </div>
        )}

        {filteredTxns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94a3b8' }}>
            <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>sync_alt</span>
            <p className="text-sm font-medium">
              {circulationFilter === 'all' ? 'No circulation records for this period' : `No ${circFilterLabels[circulationFilter] || ''} found`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm table-fixed">
              <thead className="sticky top-0 z-10 shadow-xs bg-white border-b border-slate-200/80">
                <tr className="divide-x divide-slate-200">
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Transaction ID</th>
                  <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Member ID</th>
                  <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Member</th>
                  <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Book ID</th>
                  <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Book</th>
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Issue Date</th>
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Due Date</th>
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxns.map((t, idx) => {
                  const isOverdue = t.status === 'overdue' || (!t.returnDate && new Date(t.dueDate) < new Date());
                  const wasReturnedOverdue = t.returnDate && t.overdueDays > 0;
                  const daysOverdue = isOverdue
                    ? Math.floor((Date.now() - new Date(t.dueDate)) / 86400000)
                    : (wasReturnedOverdue ? t.overdueDays : 0);

                  let badge;
                  if (isOverdue) {
                    badge = { bg: '#fee2e2', c: '#b31b25', text: `Overdue (${daysOverdue}d)` };
                  } else if (wasReturnedOverdue) {
                    badge = { bg: '#fee2e2', c: '#b31b25', text: `Returned (Overdue ${daysOverdue}d)` };
                  } else if (t.status === 'returned') {
                    badge = { bg: '#dcfce7', c: '#166534', text: 'Returned' };
                  } else {
                    badge = { bg: '#dbeafe', c: '#1e40af', text: 'Active' };
                  }

                  return (
                    <tr key={t._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'} hover:bg-[#EAEFF5] transition-colors duration-150`}>
                      <td className="py-2.5 px-4 text-xs font-mono font-bold text-left" style={{ color: '#1a1245' }}>{t.transactionId || '—'}</td>
                      <td className="py-2.5 px-4 text-xs font-mono font-bold text-left" style={{ color: '#4062BB' }}>{t.user?.memberId || '—'}</td>
                      <td className="py-2.5 px-4 text-xs font-medium text-left" style={{ color: '#2C2C3E' }}>{t.user?.name || '—'}</td>
                      <td className="py-2.5 px-4 text-xs font-mono font-bold text-left" style={{ color: '#1a1245' }}>{t.book?.bookId || '—'}</td>
                      <td className="py-2.5 px-4 text-xs text-left" style={{ color: '#595c5e' }}>{t.book?.title || '—'}</td>
                      <td className="py-2.5 px-4 text-xs text-left" style={{ color: '#595c5e' }}>{new Date(t.issueDate).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4 text-xs text-left" style={{ color: '#595c5e' }}>
                        {new Date(t.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4 text-left whitespace-nowrap">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap inline-block" style={{ backgroundColor: badge.bg, color: badge.c }}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (reportType === 'members') {
    const members = reportData.members || [];
    let filteredMembers = members;
    if (memberFilter === 'student') {
      filteredMembers = members.filter((m) => m.role === 'student');
    } else if (memberFilter === 'teacher') {
      filteredMembers = members.filter((m) => m.role === 'teacher');
    }

    const memberFilterLabels = {
      student: 'Students',
      teacher: 'Teachers',
    };

    const memberFilterColors = {
      student: '#1e40af',
      teacher: '#166534',
    };

    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {memberFilter !== 'all' && (
          <div className="flex items-center justify-between bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: memberFilterColors[memberFilter] || '#1a1245' }}>filter_alt</span>
              <span className="text-slate-600 font-medium">
                Showing: <strong style={{ color: memberFilterColors[memberFilter] || '#1a1245' }}>{memberFilterLabels[memberFilter] || memberFilter}</strong> ({filteredMembers.length} members)
              </span>
            </div>
            <button
              onClick={() => onSelectMemberFilter && onSelectMemberFilter('all')}
              className="text-xs font-bold text-slate-500 hover:text-[#b31b25] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Clear Filter
            </button>
          </div>
        )}

        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94a3b8' }}>
            <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>group_off</span>
            <p className="text-sm font-medium">
              {memberFilter === 'all' ? 'No members found' : `No ${memberFilterLabels[memberFilter] || ''} found`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm table-fixed">
              <thead className="sticky top-0 z-10 shadow-xs bg-white border-b border-slate-200/80">
                <tr className="divide-x divide-slate-200">
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Member ID</th>
                  <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Name</th>
                  <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Email</th>
                  <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Role</th>
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Grade</th>
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Total Borrows</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m, idx) => (
                  <tr key={m._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'} hover:bg-[#EAEFF5] transition-colors duration-150`}>
                    <td className="py-2.5 px-4 text-xs font-mono font-bold text-center" style={{ color: '#1a1245' }}>{m.memberId}</td>
                    <td className="py-2.5 px-4 text-xs font-medium text-left" style={{ color: '#2C2C3E' }}>{m.name}</td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: '#595c5e' }}>{m.email}</td>
                    <td className="py-2.5 px-4 text-xs uppercase font-semibold text-center">{m.role}</td>
                    <td className="py-2.5 px-4 text-xs text-center" style={{ color: '#595c5e' }}>{m.grade || '—'}</td>
                    <td className="py-2.5 px-4 text-xs font-bold text-center" style={{ color: '#1a1245' }}>{m.totalBorrows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (reportType === 'books') {
    const books = reportData.books || [];
    const categories = reportData.categories || [];

    let filteredBooks = books;
    if (bookFilter === 'available') {
      filteredBooks = books.filter((b) => {
        const avail = b.availableCopies !== undefined ? b.availableCopies : 1;
        return avail > 0;
      });
    } else if (bookFilter === 'borrowed') {
      filteredBooks = books.filter((b) => {
        const avail = b.availableCopies !== undefined ? b.availableCopies : 1;
        const tot = b.totalCopies || 1;
        return avail === 0 || avail < tot;
      });
    }

    return (
      <div className="space-y-4">
        {/* Toggle Option for Category Breakdown */}
        {categories.length > 0 && (
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-slate-500">category</span>
              <span className="text-xs font-bold text-slate-700">Category Breakdown</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {categories.length} categories
              </span>
            </div>
            <button
              onClick={() => setShowCategories(!showCategories)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${showCategories
                  ? 'bg-[#9E0D0D] text-white border-[#9E0D0D] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {showCategories ? 'expand_less' : 'tune'}
              </span>
              {showCategories ? 'Hide Breakdown' : 'View Breakdown'}
            </button>
          </div>
        )}

        {/* Collapsible Category Breakdown */}
        {showCategories && categories.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#881337' }}>
              Physical Copies by Category
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {categories.map((c, idx) => {
                const palettes = [
                  { bg: 'bg-indigo-50/70', border: 'border-indigo-200/80', text: 'text-indigo-900', count: 'text-indigo-700', dot: 'bg-indigo-500' },
                  { bg: 'bg-emerald-50/70', border: 'border-emerald-200/80', text: 'text-emerald-900', count: 'text-emerald-700', dot: 'bg-emerald-500' },
                  { bg: 'bg-amber-50/70', border: 'border-amber-200/80', text: 'text-amber-900', count: 'text-amber-700', dot: 'bg-amber-500' },
                  { bg: 'bg-sky-50/70', border: 'border-sky-200/80', text: 'text-sky-900', count: 'text-sky-700', dot: 'bg-sky-500' },
                  { bg: 'bg-rose-50/70', border: 'border-rose-200/80', text: 'text-rose-900', count: 'text-rose-700', dot: 'bg-rose-500' },
                  { bg: 'bg-purple-50/70', border: 'border-purple-200/80', text: 'text-purple-900', count: 'text-purple-700', dot: 'bg-purple-500' },
                  { bg: 'bg-teal-50/70', border: 'border-teal-200/80', text: 'text-teal-900', count: 'text-teal-700', dot: 'bg-teal-500' },
                  { bg: 'bg-orange-50/70', border: 'border-orange-200/80', text: 'text-orange-900', count: 'text-orange-700', dot: 'bg-orange-500' },
                ];
                const pal = palettes[idx % palettes.length];

                return (
                  <div
                    key={c._id}
                    className={`p-3 rounded-xl border ${pal.border} ${pal.bg} transition-all duration-200 hover:shadow-xs flex flex-col items-center justify-center text-center`}
                  >
                    <div className="flex items-center justify-center gap-1.5 min-w-0 w-full mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${pal.dot} shrink-0`} />
                      <span className={`text-xs font-semibold ${pal.text} truncate`} title={c._id}>
                        {c._id}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${pal.count}`}>
                      {c.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Books Inventory Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          {bookFilter !== 'all' && (
            <div className="flex items-center justify-between bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" style={{ color: bookFilter === 'available' ? '#166534' : '#b31b25' }}>filter_alt</span>
                <span className="text-slate-600 font-medium">
                  Showing: <strong style={{ color: bookFilter === 'available' ? '#166534' : '#b31b25' }}>{bookFilter === 'available' ? 'In Stock Books' : 'Out of Stock / Borrowed Books'}</strong> ({filteredBooks.length} items)
                </span>
              </div>
              <button
                onClick={() => onSelectBookFilter && onSelectBookFilter('all')}
                className="text-xs font-bold text-slate-500 hover:text-[#b31b25] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Clear Filter
              </button>
            </div>
          )}

          {filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94a3b8' }}>
              <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>menu_book</span>
              <p className="text-sm font-medium">
                {bookFilter === 'all' ? 'No books found in the library catalogue' : `No ${bookFilter === 'available' ? 'in-stock' : 'out-of-stock / borrowed'} books found`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm table-fixed">
                <thead className="sticky top-0 z-10 shadow-xs bg-white border-b border-slate-200/80">
                  <tr className="divide-x divide-slate-200">
                    <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Book ID</th>
                    <th className="py-3 px-3 w-40 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Title</th>
                    <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Author</th>
                    <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Category</th>
                    <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Available</th>
                    <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Total Copies</th>
                    <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBooks.map((b, idx) => {
                    const avail = b.availableCopies !== undefined ? b.availableCopies : 1;
                    const tot = b.totalCopies || 1;
                    const isAvailable = avail > 0;
                    const sBadge = isAvailable
                      ? { bg: '#dcfce7', c: '#166534', text: 'In Stock' }
                      : { bg: '#fee2e2', c: '#b31b25', text: 'Out of Stock' };

                    return (
                      <tr key={b._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'} hover:bg-[#EAEFF5] transition-colors duration-150`}>
                        <td className="py-2.5 px-4 text-xs font-mono font-bold text-left" style={{ color: '#1a1245' }}>{b.bookId || '—'}</td>
                        <td className="py-2.5 px-4 text-xs font-medium text-left" style={{ color: '#2C2C3E' }}>{b.title}</td>
                        <td className="py-2.5 px-4 text-xs text-left" style={{ color: '#595c5e' }}>{b.author}</td>
                        <td className="py-2.5 px-4 text-xs text-left" style={{ color: '#595c5e' }}>{b.category || '—'}</td>
                        <td className="py-2.5 px-4 text-xs font-bold text-center" style={{ color: isAvailable ? '#166534' : '#b31b25' }}>{avail}</td>
                        <td className="py-2.5 px-4 text-xs font-bold text-center" style={{ color: '#1a1245' }}>{tot}</td>
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap inline-block" style={{ backgroundColor: sBadge.bg, color: sBadge.c }}>
                            {sBadge.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (reportType === 'fines') {
    const fineList = reportData.fines || [];
    let filteredFines = fineList;
    if (fineFilter !== 'all') {
      filteredFines = fineList.filter((f) => f.status === fineFilter);
    }

    const filterLabels = {
      paid: 'Collected / Paid Fines',
      unpaid: 'Unpaid / Outstanding Fines',
      waived: 'Excused Fines',
    };

    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {fineFilter !== 'all' && (
          <div className="flex items-center justify-between bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: fineFilter === 'paid' ? '#166534' : fineFilter === 'unpaid' ? '#b31b25' : '#7c3aed' }}>filter_alt</span>
              <span className="text-slate-600 font-medium">
                Showing: <strong style={{ color: fineFilter === 'paid' ? '#166534' : fineFilter === 'unpaid' ? '#b31b25' : '#7c3aed' }}>{filterLabels[fineFilter] || fineFilter}</strong> ({filteredFines.length} records)
              </span>
            </div>
            <button
              onClick={() => onSelectFineFilter && onSelectFineFilter('all')}
              className="text-xs font-bold text-slate-500 hover:text-[#b31b25] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Clear Filter
            </button>
          </div>
        )}

        {filteredFines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94a3b8' }}>
            <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>payments</span>
            <p className="text-sm font-medium">
              {fineFilter === 'all' ? 'No fine records for this period' : `No ${filterLabels[fineFilter] || ''} found`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm table-fixed">
              <thead className="sticky top-0 z-10 shadow-xs bg-white border-b border-slate-200/80">
                <tr className="divide-x divide-slate-200">
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Transaction ID</th>
                  <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Member ID</th>
                  <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Member</th>
                  <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Book ID</th>
                  <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Book</th>
                  <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Amount</th>
                  <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Status</th>
                  <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFines.map((f, idx) => {
                  const sBadge = { unpaid: { bg: '#fee2e2', c: '#b31b25' }, paid: { bg: '#dcfce7', c: '#166534' }, waived: { bg: '#ede9fe', c: '#6d28d9' } }[f.status] || { bg: '#f0f0f0', c: '#666' };
                  return (
                    <tr key={f._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'} hover:bg-[#EAEFF5] transition-colors duration-150`}>
                      <td className="py-2.5 px-4 text-xs font-mono font-bold text-left" style={{ color: '#1a1245' }}>{f.transaction?.transactionId || '—'}</td>
                      <td className="py-2.5 px-4 text-xs font-mono font-bold text-left" style={{ color: '#4062BB' }}>{f.user?.memberId || '—'}</td>
                      <td className="py-2.5 px-4 text-xs font-medium text-left" style={{ color: '#2C2C3E' }}>{f.user?.name || ''}</td>
                      <td className="py-2.5 px-4 text-xs font-mono font-bold text-left" style={{ color: '#1a1245' }}>{f.book?.bookId || '—'}</td>
                      <td className="py-2.5 px-4 text-xs text-left" style={{ color: '#595c5e' }}>{f.book?.title || ''}</td>
                      <td className="py-2.5 px-4 text-xs font-bold text-left" style={{ color: '#1a1245' }}>Rs. {f.amount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap"><span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize whitespace-nowrap inline-block" style={{ backgroundColor: sBadge.bg, color: sBadge.c }}>{f.status === 'waived' ? 'excused' : f.status}</span></td>
                      <td className="py-2.5 px-4 text-xs text-left" style={{ color: '#595c5e' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return null;
}
