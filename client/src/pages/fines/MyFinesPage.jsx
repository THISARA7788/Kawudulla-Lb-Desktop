import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api/axios';

export default function MyFinesPage() {
  const [finesData, setFinesData] = useState({ fines: [], unpaid: [], resolved: [], totalUnpaidAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' | 'resolved'

  const fetchFines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/library/my-fines');
      setFinesData(res.data || { fines: [], unpaid: [], resolved: [], totalUnpaidAmount: 0 });
    } catch (err) {
      console.error('Error fetching personal fines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const { unpaid = [], resolved = [], totalUnpaidAmount = 0 } = finesData;
  const currentList = activeTab === 'unpaid' ? unpaid : resolved;

  return (
    <DashboardLayout>
      <div className="space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${totalUnpaidAmount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>payments</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Fines</p>
              <p className="text-xl font-extrabold text-slate-900">
                Rs. {totalUnpaidAmount}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>warning</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Items</p>
              <p className="text-xl font-extrabold text-slate-900">{unpaid.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>check_circle</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved Fines</p>
              <p className="text-xl font-extrabold text-slate-800">{resolved.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 p-1 rounded-2xl shadow-inner select-none w-fit">
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'unpaid'
                ? 'bg-[#9E0D0D] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            Pending Dues ({unpaid.length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'resolved'
                ? 'bg-[#9E0D0D] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            Resolved History ({resolved.length})
          </button>
        </div>

        {/* Fines List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100 animate-pulse">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-20 hidden sm:block" />
                  <div className="h-3 bg-slate-100 rounded w-16 hidden md:block" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                  <div className="h-6 w-16 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
            <span className="material-symbols-outlined mb-2 text-emerald-500" style={{ fontSize: 40 }}>
              check_circle
            </span>
            <p className="text-xs font-semibold text-slate-700">
              {activeTab === 'unpaid' ? 'No unpaid fines' : 'No resolved fines in history'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-slate-700 uppercase tracking-wider divide-x divide-slate-200">
                    <th className="py-3 px-3 font-bold text-center">Book Title</th>
                    <th className="py-3 px-3 font-bold text-center w-36">Overdue Duration</th>
                    <th className="py-3 px-3 font-bold text-center w-28">Rate / Day</th>
                    <th className="py-3 px-3 font-bold text-center w-32">Fine Amount</th>
                    <th className="py-3 px-3 font-bold text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentList.map((fine) => (
                    <tr key={fine._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-xs text-slate-800">{fine.book?.title || 'Unknown Book'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {fine.book?.author || ''} {fine.fineId && `• Fine ID: ${fine.fineId}`}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {fine.daysOverdue} days
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        Rs. {fine.ratePerDay}
                      </td>
                      <td className={`py-3 px-4 font-bold ${fine.status === 'unpaid' ? 'text-rose-600' : 'text-slate-800'}`}>
                        Rs. {fine.amount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            fine.status === 'unpaid'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : fine.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {fine.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
