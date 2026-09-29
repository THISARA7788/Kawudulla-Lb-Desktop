import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function CirculationRecord() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [jumpPage, setJumpPage] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = { page, status: statusFilter, limit };
      const res = await api.get('/library/transactions', { params });
      setTransactions(res.data.transactions || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, limit]);

  const filteredTransactions = transactions.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.user?.name?.toLowerCase().includes(q) ||
      t.book?.title?.toLowerCase().includes(q) ||
      t.book?.bookId?.toLowerCase().includes(q) ||
      (t.transactionNumber || t.transactionId)?.toLowerCase().includes(q)
    );
  });

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPage('');
    }
  };

  // Smart page number generator with ellipses
  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) items.push(i);
      items.push('ellipsis-end');
      items.push(totalPages);
    } else if (page >= totalPages - 3) {
      items.push(1);
      items.push('ellipsis-start');
      for (let i = totalPages - 4; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      items.push('ellipsis-start');
      items.push(page - 1);
      items.push(page);
      items.push(page + 1);
      items.push('ellipsis-end');
      items.push(totalPages);
    }
    return items;
  };

  const statusBadge = (status) => {
    if (status === 'returned') return { bg: '#DCFCE7', color: '#166534', text: 'Returned' };
    if (status === 'overdue') return { bg: '#FEF2F2', color: '#b31b25', text: 'Overdue' };
    return { bg: '#DBEAFE', color: '#1D4ED8', text: 'Active' };
  };

  return (
    <DashboardLayout>
      {/* Top Control Panel Header (Fixed below top navbar on desktop, relative flow on mobile) */}
      <div className="relative lg:fixed lg:top-16 lg:left-64 lg:right-0 lg:z-20 bg-white pb-3 pt-3 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 shadow-xs">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by member, book title, Book ID, or transaction number..."
              className="w-full py-2.5 pl-9 pr-4 text-xs rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] bg-white text-slate-800 shadow-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="py-2.5 px-3 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-white shadow-sm"
            style={{ color: '#2C2C3E', minWidth: 110 }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Main Content Area (Offset for desktop) */}
      <div className="pt-2 lg:pt-16 pb-4">
        {/* Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs bg-white">
          {loading ? (
            <div className="divide-y divide-slate-100 animate-pulse">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-4 bg-slate-200 rounded w-36" />
                  <div className="h-4 bg-slate-200 rounded w-48 flex-1 hidden md:block" />
                  <div className="h-3 bg-slate-100 rounded w-20 hidden lg:block" />
                  <div className="h-3 bg-slate-100 rounded w-20 hidden lg:block" />
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94a3b8' }}>
              <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>receipt_long</span>
              <p className="text-sm font-medium">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm table-fixed">
                <thead className="sticky top-0 z-10 shadow-2xs bg-white border-b border-slate-200/80">
                  <tr className="divide-x divide-slate-200">
                    <th className="py-3 px-3 w-32 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Transaction ID</th>
                    <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Member</th>
                    <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Book</th>
                    <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Issue Date</th>
                    <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Due Date</th>
                    <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Return Date</th>
                    <th className="py-3 px-3 w-32 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t, idx) => {
                    const isCurrentlyOverdue = !t.returnDate && new Date(t.dueDate) < new Date();
                    const wasReturnedOverdue = t.returnDate && t.overdueDays > 0;
                    const daysOverdue = isCurrentlyOverdue
                      ? Math.floor((Date.now() - new Date(t.dueDate)) / 86400000)
                      : (wasReturnedOverdue ? t.overdueDays : 0);

                    let badge;
                    if (isCurrentlyOverdue) {
                      badge = { bg: '#FEF2F2', color: '#b31b25', text: `Overdue (${daysOverdue}d)` };
                    } else if (wasReturnedOverdue) {
                      badge = { bg: '#FEF2F2', color: '#b31b25', text: `Returned (Overdue ${daysOverdue}d)` };
                    } else {
                      badge = statusBadge(t.status);
                    }

                    const showRedDueDate = isCurrentlyOverdue || wasReturnedOverdue;

                    return (
                      <tr key={t._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'} hover:bg-[#EAEFF5] transition-colors duration-150`}>
                        <td className="py-3 px-4 text-center text-[11px] font-mono font-bold" style={{ color: '#4F5B7D' }}>{t.transactionNumber || t.transactionId || '—'}</td>
                        <td className="py-3 px-4 text-left">
                          <div className="text-xs font-medium" style={{ color: '#2C2C3E' }}>{t.user?.name || '—'}</div>
                          <div className="text-[11px] font-mono font-bold" style={{ color: '#94a3b8' }}>
                            {t.user?.memberId || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-left">
                          <div className="text-xs font-medium" style={{ color: '#2C2C3E' }}>{t.book?.title || '—'}</div>
                          <div className="text-[11px] font-mono" style={{ color: '#94a3b8' }}>{t.book?.bookId || ''}</div>
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-medium" style={{ color: '#64748B' }}>{new Date(t.issueDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-center text-xs font-medium" style={{ color: '#64748B' }}>{new Date(t.dueDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-center text-xs font-medium" style={{ color: '#64748B' }}>{t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: badge.bg, color: badge.color }}>
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

        {/* Stats & Interactive Pagination System */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Left info & items-per-page */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold outline-none cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <span className="hidden sm:inline text-slate-300">|</span>

            <span className="font-medium">
              Showing <strong className="text-slate-800">{total > 0 ? (page - 1) * limit + 1 : 0}</strong>–<strong className="text-slate-800">{Math.min(page * limit, total)}</strong> of <strong className="text-slate-800">{total}</strong> transactions
            </span>
          </div>

          {/* Right Navigation & Jump */}
          <div className="flex flex-wrap items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page Button */}
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                  title="First Page"
                >
                  <span className="material-symbols-outlined align-middle" style={{ fontSize: 16 }}>first_page</span>
                </button>

                {/* Previous Page Button */}
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
                  <span>Prev</span>
                </button>

                {/* Page Number Pills */}
                {getPaginationItems().map((item, idx) => {
                  if (typeof item === 'string') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-xs font-bold text-slate-400 select-none">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = item === page;
                  return (
                    <button
                      key={`page-${item}`}
                      onClick={() => setPage(item)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isCurrent
                          ? 'bg-[#1a1245] text-white shadow-sm ring-2 ring-[#1a1245]/20'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}

                {/* Next Page Button */}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs flex items-center gap-0.5"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                </button>

                {/* Last Page Button */}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                  title="Last Page"
                >
                  <span className="material-symbols-outlined align-middle" style={{ fontSize: 16 }}>last_page</span>
                </button>
              </div>
            )}

            {/* Direct Jump to Page Form */}
            {totalPages > 3 && (
              <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-200">
                <span className="text-xs text-slate-400 font-medium">Go to</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  placeholder={String(page)}
                  className="w-12 py-1 px-1.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1a1245] outline-none shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!jumpPage || Number(jumpPage) < 1 || Number(jumpPage) > totalPages}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                >
                  Go
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
