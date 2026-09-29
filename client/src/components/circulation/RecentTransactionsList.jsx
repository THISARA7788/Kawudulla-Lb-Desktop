import React from 'react';

export default function RecentTransactionsList({
  transactions = [],
  type = 'issues', // 'issues' | 'returns'
  maxHeight = '240px'
}) {
  if (transactions.length === 0) {
    return (
      <p className="text-xs text-center py-3" style={{ color: '#9CA3AF' }}>
        No recent {type}
      </p>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto flex-1 min-h-0" style={{ maxHeight }}>
      {transactions.map((tx, idx) => {
        const isOverdue = new Date(tx.dueDate) < new Date();
        const dueSoon = !isOverdue && new Date(tx.dueDate) - Date.now() < 3 * 86400000;
        const book = tx.book || {};
        const user = tx.user || {};

        if (type === 'issues') {
          return (
            <div
              key={tx._id || idx}
              className="p-2.5 rounded-xl border transition-all space-y-1.5 animate-fadeIn"
              style={{
                backgroundColor: isOverdue ? '#FFF5F5' : dueSoon ? '#FFFDF5' : '#FAFCFD',
                borderColor: isOverdue ? '#FEE2E2' : dueSoon ? '#FEF3C7' : '#F1F5F9',
              }}
            >
              {/* Header: Book Title */}
              <div className="text-xs font-black text-slate-700 truncate leading-snug">
                {book.title || 'Unknown Book'}
              </div>

              {/* User details */}
              <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between gap-2 select-none">
                <div className="flex items-center gap-1 truncate">
                  <span className="material-symbols-outlined text-[12px] text-slate-400 flex-shrink-0">person</span>
                  <span className="truncate">{user.name || 'Unknown User'}</span>
                </div>
                <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                  {user.role === 'student' 
                    ? (user.grade && user.class ? `Gr.${user.grade.replace('Grade ', '')}-${user.class}` : (user.grade ? `Gr.${user.grade.replace('Grade ', '')}` : 'Student'))
                    : (user.role === 'teacher' ? 'Teacher' : (user.role || ''))
                  }
                </span>
              </div>

              {/* Dates grid */}
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-semibold text-slate-400 select-none">
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px] text-slate-350">event</span>
                  {new Date(tx.issueDate).toLocaleDateString()} {new Date(tx.issueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
                <span className={`flex items-center gap-0.5 font-bold ${isOverdue ? 'text-red-500' : 'text-slate-450'}`}>
                  <span className="material-symbols-outlined text-[10px] current-color">schedule</span>
                  {new Date(tx.dueDate).toLocaleDateString()}
                </span>
              </div>
              
              {tx.notes && (
                <div className="pt-1 border-t border-dashed border-slate-200 text-[9px] text-slate-500 flex items-start gap-1">
                  <span className="material-symbols-outlined text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>notes</span>
                  <span className="italic truncate">{tx.notes}</span>
                </div>
              )}
            </div>
          );
        }

        // Returns type
        return (
          <div
            key={tx._id || idx}
            className="p-2.5 rounded-xl border border-slate-100 bg-[#FAFCFD] transition-all space-y-1.5 animate-fadeIn"
          >
            {/* Header: Book Title */}
            <div className="text-xs font-black text-slate-700 truncate leading-snug">
              {book.title || 'Unknown Book'}
            </div>

            {/* User details */}
            <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between gap-2 select-none">
              <div className="flex items-center gap-1 truncate">
                <span className="material-symbols-outlined text-[12px] text-slate-400 flex-shrink-0">person</span>
                <span className="truncate">{user.name || 'Unknown User'}</span>
              </div>
              <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                {user.role === 'student' 
                  ? (user.grade && user.class ? `Gr.${user.grade.replace('Grade ', '')}-${user.class}` : (user.grade ? `Gr.${user.grade.replace('Grade ', '')}` : 'Student'))
                  : (user.role === 'teacher' ? 'Teacher' : (user.role || ''))
                }
              </span>
            </div>

            {/* Dates row */}
            <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center text-[9.5px] font-bold text-slate-400 select-none">
              <span className="text-left">
                {tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '—'}
              </span>
              <span className="text-right font-mono font-black text-slate-500">
                {tx.returnDate ? new Date(tx.returnDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
              </span>
            </div>
            {tx.notes && (
              <div className="pt-1 border-t border-dashed border-slate-200 text-[9px] text-slate-500 flex items-start gap-1">
                <span className="material-symbols-outlined text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>notes</span>
                <span className="italic truncate">{tx.notes}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
