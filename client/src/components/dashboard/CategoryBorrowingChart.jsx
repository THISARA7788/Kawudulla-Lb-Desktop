import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const categoryColors = {
  Fiction: '#7C3AED',
  Science: '#2563EB',
  History: '#EA580C',
  Math: '#0284C7',
  Reference: '#059669',
  Technology: '#9333EA',
  Biography: '#DB2777',
  General: '#9E0D0D',
};

export default function CategoryBorrowingChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/library/reports/borrowing-chart');
        setData(res.data);
      } catch (err) {
        console.error('Error loading category borrowing chart:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const topCategory = data?.topCategoryOverall || 'None';
  const totalBorrows = data?.totalThisYear || 0;
  const monthly = data?.monthly || [];

  return (
    <section className="rounded-xl p-4 border bg-white flex flex-col justify-between" style={{ borderColor: '#f0f0f0' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ color: '#1E2A4A', fontFamily: "'Manrope', sans-serif" }}>
          Borrowing Trends & Categories
        </h3>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {data?.year || new Date().getFullYear()}
        </span>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center text-slate-400 text-xs animate-pulse">
          <span className="material-symbols-outlined animate-spin mr-2" style={{ fontSize: 18 }}>progress_activity</span>
          Loading trends...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Top Borrowed Category
              </span>
              <span className="text-sm font-black text-slate-800" style={{ color: categoryColors[topCategory] || '#9E0D0D' }}>
                {topCategory}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Annual Borrows
              </span>
              <span className="text-sm font-black text-[#9E0D0D]">
                {totalBorrows} Books
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {monthly.slice(0, 5).map((m) => {
              const maxVal = Math.max(...monthly.map((x) => x.count || 0), 1);
              const pct = Math.round(((m.count || 0) / maxVal) * 100);
              return (
                <div key={m.month} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 w-10">{m.month}</span>
                  <div className="flex-1 mx-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#9E0D0D] transition-all duration-300"
                      style={{ width: `${Math.max(pct, m.count > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-700 text-[11px] w-14 text-right">
                    {m.count} {m.count === 1 ? 'bk' : 'bks'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
