import React from 'react';

export default function FineRow({ fine, index = 0, onView, onPay, onWaive, onDelete }) {
  const isSettled = fine.status === 'paid' || fine.status === 'waived';

  const statusStyle = {
    unpaid: { bg: '#fee2e2', color: '#991b1b' },
    paid: { bg: '#dcfce7', color: '#166534' },
    waived: { bg: '#ece9f8', color: '#5b51d0' },
  }[fine.status] || { bg: '#f0f0f0', color: '#666' };

  return (
    <tr
      onClick={() => onView && onView(fine)}
      className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'} hover:bg-[#EAEFF5] transition-all duration-150 cursor-pointer ${
        isSettled ? 'opacity-75 hover:opacity-100' : ''
      }`}
      title="Click to view fine details"
    >
      <td className={`py-3 px-4 text-center text-xs font-mono font-bold ${isSettled ? 'text-slate-500' : 'text-[#4F5B7D]'}`}>
        {fine.fineId || fine.transaction?.transactionId || '—'}
      </td>
      <td className="py-3 px-4 text-left">
        <div className={`text-xs font-medium ${isSettled ? 'text-slate-600' : 'text-slate-800'}`}>{fine.user?.name || '—'}</div>
        <div className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">
          {fine.user?.memberId || '—'}
        </div>
      </td>
      <td className="py-3 px-4 text-left">
        <div className={`text-xs font-medium ${isSettled ? 'text-slate-600' : 'text-slate-800'}`}>{fine.book?.title || '—'}</div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{fine.book?.bookId || '—'}</div>
      </td>
      <td className="py-3 px-4 text-center text-xs font-bold whitespace-nowrap" style={{ color: '#b31b25' }}>
        {fine.daysOverdue}d
      </td>
      <td className="py-3 px-4 text-center text-xs font-bold whitespace-nowrap min-w-[120px]" style={{ color: '#1a1245' }}>
        Rs. {fine.amount?.toFixed(2)}
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {fine.status === 'waived' ? 'excused' : fine.status}
        </span>
      </td>
      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1">
          {fine.status === 'unpaid' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPay(fine);
              }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors cursor-pointer"
              title="Mark Paid"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
            </button>
          )}
          {fine.status === 'unpaid' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWaive(fine);
              }}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
              title="Excuse Fine"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(fine._id);
            }}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
            title="Delete"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
