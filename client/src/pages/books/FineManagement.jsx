import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FineRow from '../../components/fines/FineRow';
import FineModals from '../../components/fines/FineModals';

const STATUS_OPTIONS = ['all', 'unpaid', 'paid', 'waived'];

export default function FineManagement() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [fines, setFines] = useState([]);
  const [config, setConfig] = useState({ fineRatePerDay: 10, gracePeriodDays: 0 });
  const [stats, setStats] = useState({ unpaidTotal: 0, unpaidCount: 0, paidTotal: 0, paidCount: 0, waivedTotal: 0, waivedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [jumpPage, setJumpPage] = useState('');

  const [modal, setModal] = useState(null); // null | 'pay' | 'waive' | 'config' | 'details'
  const [selected, setSelected] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [waiveReason, setWaiveReason] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newGrace, setNewGrace] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchFines(), fetchStats(), fetchConfig()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFines = async () => {
    try {
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        page,
        limit
      };
      const res = await api.get('/library/fines', { params, headers: { Authorization: `Bearer ${token}` } });
      setFines(res.data.fines || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || res.data.count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/library/fines/stats', { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/library/fines/config', { headers: { Authorization: `Bearer ${token}` } });
      setConfig(res.data.config);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchFines();
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    if (user && user.role !== 'librarian') navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const openDetails = (fine) => {
    setSelected(fine);
    setModal('details');
    setError('');
  };

  const openPay = (fine) => {
    setSelected(fine);
    setModal('pay');
    setError('');
  };

  const openWaive = (fine) => {
    setSelected(fine);
    setWaiveReason('');
    setModal('waive');
    setError('');
  };

  const handlePay = async () => {
    setSaving(true);
    try {
      await api.put(`/library/fines/${selected._id}/pay`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setModal(null);
      fetchData();
      showToast('Fine payment recorded successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleWaive = async () => {
    setSaving(true);
    try {
      await api.put(`/library/fines/${selected._id}/waive`, { reason: waiveReason }, { headers: { Authorization: `Bearer ${token}` } });
      setModal(null);
      fetchData();
      showToast('Fine excused successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to excuse fine');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setSaving(true);
    try {
      await api.delete(`/library/fines/${deleteTargetId}`, { headers: { Authorization: `Bearer ${token}` } });
      setFines((p) => p.filter((f) => f._id !== deleteTargetId));
      fetchStats();
      setDeleteTargetId(null);
      showToast('Fine record deleted successfully!', 'delete');
    } catch (err) {
      showToast('Failed to delete fine record.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.put('/library/fines/config', {
        fineRatePerDay: Number(newRate) || config.fineRatePerDay,
        gracePeriodDays: Number(newGrace) ?? config.gracePeriodDays
      }, { headers: { Authorization: `Bearer ${token}` } });
      setConfig({
        ...config,
        fineRatePerDay: Number(newRate) || config.fineRatePerDay,
        gracePeriodDays: Number(newGrace) ?? config.gracePeriodDays
      });
      setModal(null);
      showToast('Configuration updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openConfig = () => {
    setNewRate(config.fineRatePerDay.toString());
    setNewGrace(config.gracePeriodDays.toString());
    setModal('config');
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPage('');
    }
  };

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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by member, book title, Book ID, or Transaction ID..."
              className="w-full py-2.5 pl-9 pr-4 text-xs rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] bg-white text-slate-800 shadow-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="py-2.5 px-3 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-white shadow-sm"
            style={{ color: '#2C2C3E', minWidth: 120 }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Status' : s === 'waived' ? 'Excused' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={openConfig}
            className="px-4 py-2.5 bg-[#9E0D0D] hover:bg-[#7F0A0A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-900/10 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <span className="material-symbols-outlined text-base">settings</span>
            Fine Settings
          </button>
        </div>
      </div>

      {/* Main Content Area (Offset for desktop) */}
      <div className="pt-2 lg:pt-16 pb-4">
        {/* Global Stats Summary */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* 1. Unpaid Fines */}
            <div className="p-3 bg-gradient-to-r from-rose-50/80 via-rose-50/30 to-white rounded-xl border border-rose-200/80 border-l-4 border-l-rose-500 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-2xs border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">pending_actions</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800/70 block">Unpaid Fines</span>
                  <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {stats.unpaidCount} <span className="text-xs font-medium text-slate-800">pending</span>
                  </p>
                </div>
              </div>
              <div className="text-right pl-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Total Due</span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  Rs. {stats.unpaidTotal?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 2. Collected Fines */}
            <div className="p-3 bg-gradient-to-r from-emerald-50/80 via-emerald-50/30 to-white rounded-xl border border-emerald-200/80 border-l-4 border-l-emerald-500 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-2xs border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/70 block">Collected Fines</span>
                  <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {stats.paidCount} <span className="text-xs font-medium text-slate-800">collected</span>
                  </p>
                </div>
              </div>
              <div className="text-right pl-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Total Received</span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  Rs. {stats.paidTotal?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fines Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs bg-white">
          {loading ? (
            <div className="divide-y divide-slate-100 animate-pulse">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-4 bg-slate-200 rounded w-36" />
                  <div className="h-4 bg-slate-200 rounded w-44 flex-1 hidden md:block" />
                  <div className="h-3 bg-slate-100 rounded w-16 hidden lg:block" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : fines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94a3b8' }}>
              <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>payments</span>
              <p className="text-sm font-medium">No fine records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm table-fixed">
                <thead className="sticky top-0 z-10 shadow-2xs bg-white border-b border-slate-200/80">
                  <tr className="divide-x divide-slate-200">
                    <th className="py-3 px-3 w-32 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Transaction ID</th>
                    <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Member</th>
                    <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Book</th>
                    <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center whitespace-nowrap" style={{ color: '#881337' }}>Days Overdue</th>
                    <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center whitespace-nowrap" style={{ color: '#881337' }}>Amount</th>
                    <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center whitespace-nowrap" style={{ color: '#881337' }}>Status</th>
                    <th className="py-3 px-3 w-32 text-xs font-bold uppercase tracking-wide text-center whitespace-nowrap" style={{ color: '#881337' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fines.map((f, idx) => (
                    <FineRow
                      key={f._id}
                      fine={f}
                      index={idx}
                      onView={openDetails}
                      onPay={openPay}
                      onWaive={openWaive}
                      onDelete={(id) => setDeleteTargetId(id)}
                    />
                  ))}
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
              Showing <strong className="text-slate-800">{fines.length > 0 ? (page - 1) * limit + 1 : 0}</strong>–<strong className="text-slate-800">{Math.min(page * limit, totalCount || fines.length)}</strong> of <strong className="text-slate-800">{totalCount || fines.length}</strong> fine records
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

      <FineModals
        modal={modal}
        selected={selected}
        saving={saving}
        error={error}
        handlePay={handlePay}
        handleWaive={handleWaive}
        saveConfig={saveConfig}
        setModal={setModal}
        waiveReason={waiveReason}
        setWaiveReason={setWaiveReason}
        newRate={newRate}
        setNewRate={setNewRate}
        newGrace={newGrace}
        setNewGrace={setNewGrace}
        onDelete={(id) => {
          setModal(null);
          setDeleteTargetId(id);
        }}
      />

      {/* Custom Confirmation Modal for Deletion */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">delete</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Fine Record</h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Are you sure you want to permanently delete this fine record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={saving}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
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
    </DashboardLayout>
  );
}
