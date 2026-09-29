import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import BookProfileModal from '../../components/books/BookProfileModal';
import { getEmptyBookCoverBackground } from '../../utils/bookCoverUtils';
import api from '../../api/axios';

export default function MyBorrowingsPage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [activeLoans, setActiveLoans] = useState([]);
  const [historyLoans, setHistoryLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  const fetchBorrowings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/library/my-borrowings');
      setActiveLoans(res.data.active || []);
      setHistoryLoans(res.data.history || []);
    } catch (err) {
      console.error('Error fetching borrowings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const getDaysRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const currentList = activeTab === 'active' ? activeLoans : historyLoans;
  const filteredList = currentList.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const title = item.book?.title?.toLowerCase() || '';
    const author = item.book?.author?.toLowerCase() || '';
    const bookId = item.book?.bookId?.toLowerCase() || '';
    const trnId = item.transactionId?.toLowerCase() || '';
    return title.includes(q) || author.includes(q) || bookId.includes(q) || trnId.includes(q);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Tabs & Search Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 p-1 rounded-2xl shadow-inner select-none w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-[#9E0D0D] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              Active Loans ({activeLoans.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#9E0D0D] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              Borrowing History ({historyLoans.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }}>
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title or author..."
              className="w-full py-2 pl-10 pr-3.5 text-xs rounded-2xl bg-white border border-slate-200 outline-none focus:border-[#9E0D0D] transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100 animate-pulse">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-14 bg-slate-200 rounded-lg flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-24 hidden sm:block" />
                  <div className="h-3 bg-slate-100 rounded w-24 hidden md:block" />
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
            <span className="material-symbols-outlined mb-2" style={{ fontSize: 40, opacity: 0.3 }}>
              {activeTab === 'active' ? 'book_2' : 'history'}
            </span>
            <p className="text-xs font-semibold">
              {search ? 'No matching books found' : activeTab === 'active' ? 'No active book loans' : 'No borrowing history yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-slate-700 uppercase tracking-wider divide-x divide-slate-200">
                    <th className="py-3 px-3 font-bold text-center">Book Details</th>
                    <th className="py-3 px-3 font-bold text-center w-36">Issued Date</th>
                    <th className="py-3 px-3 font-bold text-center w-36">
                      {activeTab === 'active' ? 'Due Date' : 'Returned Date'}
                    </th>
                    <th className="py-3 px-3 font-bold text-center w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredList.map((item) => {
                    const daysLeft = getDaysRemaining(item.dueDate);
                    const isOverdue = !item.returnDate && daysLeft < 0;

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td
                          className="py-3 px-4 cursor-pointer group"
                          onClick={() => item.book && setSelectedBook(item.book)}
                          title="Click to view book details"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-12 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center shadow-xs"
                              style={
                                !item.book?.coverImageUrl
                                    ? { background: getEmptyBookCoverBackground(item.book) }
                                  : {}
                              }
                            >
                              {item.book?.coverImageUrl ? (
                                <img src={item.book.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/90">
                                  <span className="material-symbols-outlined text-xs">menu_book</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs text-slate-800 line-clamp-1 group-hover:text-[#9E0D0D] transition-colors flex items-center gap-1.5">
                                <span>{item.book?.title || 'Unknown Title'}</span>
                                <span className="material-symbols-outlined text-[14px] text-slate-300 group-hover:text-[#9E0D0D] transition-colors opacity-0 group-hover:opacity-100">
                                  open_in_new
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {item.book?.author || 'Unknown'} • ID: {item.book?.bookId || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {new Date(item.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {activeTab === 'active'
                            ? new Date(item.dueDate).toLocaleDateString()
                            : item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {activeTab === 'active' ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                                isOverdue
                                  ? 'bg-rose-100 text-rose-600'
                                  : daysLeft <= 2
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {isOverdue ? `${Math.abs(daysLeft)}d Overdue` : `${daysLeft}d left`}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 inline-block">
                              Returned
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Book Details Modal */}
        {selectedBook && (
          <BookProfileModal
            book={selectedBook}
            isOpen={!!selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
