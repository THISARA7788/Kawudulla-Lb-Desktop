import React from 'react';

export default function ReportSummaryCards({
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
  if (!reportData) return null;

  if (reportType === 'circulation') {
    const s = reportData.summary || {};
    const items = [
      { id: 'all', label: 'Total Issued', value: s.issued || 0, icon: 'outbox', border: 'border-l-blue-500', bg: 'from-blue-50/60 to-white', color: '#1e40af' },
      { id: 'returned', label: 'Total Returned', value: s.returned || 0, icon: 'move_to_inbox', border: 'border-l-emerald-500', bg: 'from-emerald-50/60 to-white', color: '#166534' },
      { id: 'active', label: 'Currently Active', value: s.active || 0, icon: 'sync', border: 'border-l-indigo-500', bg: 'from-indigo-50/60 to-white', color: '#4338ca' },
      { id: 'overdue', label: 'Overdue Books', value: s.overdue || 0, icon: 'warning', border: 'border-l-rose-500', bg: 'from-rose-50/60 to-white', color: '#b31b25' },
    ];
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {items.map((item, idx) => {
          const isFilterable = item.id !== 'all';
          const isActive = isFilterable && circulationFilter === item.id;
          return (
            <div
              key={`${item.label}-${idx}`}
              onClick={() => {
                if (!onSelectCirculationFilter) return;
                if (item.id === 'all') {
                  onSelectCirculationFilter('all');
                } else {
                  onSelectCirculationFilter(circulationFilter === item.id ? 'all' : item.id);
                }
              }}
              className={`p-4 rounded-2xl border border-l-4 ${item.border} bg-gradient-to-br ${item.bg} shadow-2xs flex items-center justify-between cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] ${isActive
                  ? 'ring-2 ring-offset-2 ring-[#9E0D0D] border-slate-400'
                  : 'border-slate-200/80 hover:border-slate-300'
                }`}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{item.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-center shadow-2xs">
                <span className="material-symbols-outlined text-[20px]" style={{ color: item.color }}>{item.icon}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (reportType === 'members') {
    const members = reportData.members || [];
    const studentsCount = members.filter(m => m.role === 'student').length;
    const teachersCount = members.filter(m => m.role === 'teacher').length;

    const items = [
      { id: 'all', label: 'Total Members', value: members.length, icon: 'group', border: 'border-l-indigo-500', bg: 'from-indigo-50/60 to-white', color: '#1a1245' },
      { id: 'student', label: 'Students', value: studentsCount, icon: 'school', border: 'border-l-blue-500', bg: 'from-blue-50/60 to-white', color: '#1e40af' },
      { id: 'teacher', label: 'Teachers', value: teachersCount, icon: 'badge', border: 'border-l-emerald-500', bg: 'from-emerald-50/60 to-white', color: '#166534' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {items.map((item, idx) => {
          const isFilterable = item.id !== 'all';
          const isActive = isFilterable && memberFilter === item.id;
          return (
            <div
              key={`${item.label}-${idx}`}
              onClick={() => {
                if (!onSelectMemberFilter) return;
                if (item.id === 'all') {
                  onSelectMemberFilter('all');
                } else {
                  onSelectMemberFilter(memberFilter === item.id ? 'all' : item.id);
                }
              }}
              className={`p-4 rounded-2xl border border-l-4 ${item.border} bg-gradient-to-br ${item.bg} shadow-2xs flex items-center justify-between cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] ${isActive
                  ? 'ring-2 ring-offset-2 ring-[#9E0D0D] border-slate-400'
                  : 'border-slate-200/80 hover:border-slate-300'
                }`}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{item.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-center shadow-2xs">
                <span className="material-symbols-outlined text-[20px]" style={{ color: item.color }}>{item.icon}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (reportType === 'books') {
    const s = reportData.summary || {};
    const items = [
      { id: 'all', label: 'Total Titles', value: s.totalTitles || 0, icon: 'auto_stories', border: 'border-l-indigo-500', bg: 'from-indigo-50/60 to-white', color: '#1a1245' },
      { id: 'all', label: 'Total Copies', value: s.totalCopies || 0, icon: 'library_books', border: 'border-l-emerald-500', bg: 'from-emerald-50/60 to-white', color: '#166534' },
      { id: 'available', label: 'Available Copies', value: s.availableCopies || 0, icon: 'check_circle', border: 'border-l-blue-500', bg: 'from-blue-50/60 to-white', color: '#1e40af' },
      { id: 'borrowed', label: 'Currently Borrowed', value: s.issuedCopies || 0, icon: 'outbox', border: 'border-l-amber-500', bg: 'from-amber-50/60 to-white', color: '#b45309' },
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {items.map((item, idx) => {
          const isFilterable = item.id !== 'all';
          const isActive = isFilterable && bookFilter === item.id;
          return (
            <div
              key={`${item.label}-${idx}`}
              onClick={() => {
                if (!onSelectBookFilter) return;
                if (item.id === 'all') {
                  onSelectBookFilter('all');
                } else {
                  onSelectBookFilter(bookFilter === item.id ? 'all' : item.id);
                }
              }}
              className={`p-4 rounded-2xl border border-l-4 ${item.border} bg-gradient-to-br ${item.bg} shadow-2xs flex items-center justify-between cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] ${isActive
                  ? 'ring-2 ring-offset-2 ring-[#9E0D0D] border-slate-400'
                  : 'border-slate-200/80 hover:border-slate-300'
                }`}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{item.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-center shadow-2xs">
                <span className="material-symbols-outlined text-[20px]" style={{ color: item.color }}>{item.icon}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (reportType === 'fines') {
    const fSummary = reportData.summary || {};
    const items = [
      { id: 'paid', label: 'Collected Fines', value: `Rs. ${(fSummary.totalCollected || 0).toFixed(2)}`, icon: 'check_circle', border: 'border-l-emerald-500', bg: 'from-emerald-50/60 to-white', color: '#166534' },
      { id: 'unpaid', label: 'Unpaid / Outstanding', value: `Rs. ${(fSummary.totalOutstanding || 0).toFixed(2)}`, icon: 'pending', border: 'border-l-rose-500', bg: 'from-rose-50/60 to-white', color: '#b31b25' },
      { id: 'waived', label: 'Excused Fines', value: `Rs. ${(fSummary.totalWaived || 0).toFixed(2)}`, icon: 'cancel', border: 'border-l-purple-500', bg: 'from-purple-50/60 to-white', color: '#7c3aed' },
      { id: 'all', label: 'Total Fine Records', value: fSummary.count || 0, icon: 'receipt_long', border: 'border-l-amber-500', bg: 'from-amber-50/60 to-white', color: '#854d0e' },
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {items.map((item, idx) => {
          const isFilterable = item.id !== 'all';
          const isActive = isFilterable && fineFilter === item.id;
          return (
            <div
              key={`${item.label}-${idx}`}
              onClick={() => {
                if (!onSelectFineFilter) return;
                if (item.id === 'all') {
                  onSelectFineFilter('all');
                } else {
                  onSelectFineFilter(fineFilter === item.id ? 'all' : item.id);
                }
              }}
              className={`p-4 rounded-2xl border border-l-4 ${item.border} bg-gradient-to-br ${item.bg} shadow-2xs flex items-center justify-between cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] ${isActive
                  ? 'ring-2 ring-offset-2 ring-[#9E0D0D] border-slate-400'
                  : 'border-slate-200/80 hover:border-slate-300'
                }`}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.label}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{item.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-100 flex items-center justify-center shadow-2xs">
                <span className="material-symbols-outlined text-[20px]" style={{ color: item.color }}>{item.icon}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
