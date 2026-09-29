import React from 'react';

export default function FineModals({
  modal,
  selected,
  saving,
  error,
  handlePay,
  handleWaive,
  saveConfig,
  setModal,
  waiveReason,
  setWaiveReason,
  newRate,
  setNewRate,
  newGrace,
  setNewGrace,
  openPay,
  openWaive,
  onDelete
}) {
  if (!modal) return null;

  return (
    <>
      {/* View Fine Details Modal */}
      {modal === 'details' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fine Record</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-lg font-black text-[#881337] font-mono">
                    {selected.fineId || selected.transaction?.transactionNumber || selected.transaction?.transactionId || '—'}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    selected.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'waived'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selected.status === 'waived' ? 'Excused' : selected.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Fine Calculation Summary */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-[#4C0000] rounded-xl text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-300">Total Fine Amount</span>
                    <p className="text-2xl font-black text-amber-400 mt-0.5">Rs. {selected.amount?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-300">Overdue Duration</span>
                    <p className="text-lg font-bold text-white mt-0.5">{selected.daysOverdue} days</p>
                  </div>
                </div>
                {selected.ratePerDay && (
                  <p className="text-[11px] text-slate-300 mt-2 pt-2 border-t border-white/10">
                    Calculation: {selected.daysOverdue} days × Rs. {selected.ratePerDay}/day = Rs. {selected.amount?.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Borrower Info */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">Borrower Information</span>
                <p className="text-sm font-bold text-slate-800">{selected.user?.name || '—'}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Member ID</span>
                    <span className="font-mono font-bold text-indigo-900">{selected.user?.memberId || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Grade / Role</span>
                    <span className="font-medium text-slate-700">{selected.user?.grade || selected.user?.role || '—'}</span>
                  </div>
                  {selected.user?.email && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">Email</span>
                      <span className="text-slate-700">{selected.user?.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Info */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Book Information</span>
                <p className="text-sm font-bold text-slate-800">{selected.book?.title || '—'}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Book ID</span>
                    <span className="font-mono font-bold text-emerald-900">{selected.book?.bookId || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Author</span>
                    <span className="font-medium text-slate-700">{selected.book?.author || '—'}</span>
                  </div>
                  {selected.book?.category && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Category</span>
                      <span className="text-slate-700">{selected.book?.category}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Excuse / Payment Note */}
              {selected.status === 'waived' && selected.waiveReason && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Excuse Reason</span>
                  <p className="text-xs text-slate-700 mt-1 italic">"{selected.waiveReason}"</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {selected.status === 'unpaid' && (
                  <>
                    <button
                      onClick={() => {
                        setModal('pay');
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>payments</span>
                      Mark Paid
                    </button>
                    <button
                      onClick={() => {
                        setModal('waive');
                      }}
                      className="px-3.5 py-2 bg-[#9E0D0D] hover:bg-[#7F0A0A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                      Excuse
                    </button>
                  </>
                )}
                <button
                  onClick={() => onDelete && onDelete(selected._id)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Delete this fine record"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  Delete
                </button>
              </div>
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {modal === 'pay' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="rounded-2xl p-6 w-full max-w-sm bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#881337]">Mark Fine as Paid</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="rounded-xl p-4 mb-4 bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <p className="text-slate-700">Member: <strong className="text-slate-900">{selected.user?.name}</strong> <span className="font-mono text-slate-400">({selected.user?.memberId})</span></p>
              <p className="text-slate-700">Book: <strong className="text-slate-900">{selected.book?.title}</strong></p>
              <p className="text-base font-bold text-emerald-800 pt-1">Amount: Rs. {selected.amount?.toFixed(2)}</p>
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">{error}</div>}
            <div className="flex gap-2">
              <button onClick={handlePay} disabled={saving} className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm cursor-pointer disabled:opacity-50">
                {saving ? 'Processing...' : 'Confirm Payment'}
              </button>
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excuse Modal */}
      {modal === 'waive' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="rounded-2xl p-6 w-full max-w-sm bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#881337]">Excuse Fine</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="rounded-xl p-4 mb-4 bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <p className="text-slate-700">Member: <strong className="text-slate-900">{selected.user?.name}</strong></p>
              <p className="text-slate-700">Amount to excuse: <strong className="text-rose-700">Rs. {selected.amount?.toFixed(2)}</strong></p>
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">{error}</div>}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1 text-slate-600">Reason for Excusing (optional)</label>
              <textarea
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder="e.g. Medical leave, school event, authorized exception..."
                rows="3"
                className="w-full px-3 py-2 text-xs rounded-xl outline-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#9E0D0D] resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleWaive} disabled={saving} className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#9E0D0D] hover:bg-[#7F0A0A] text-white shadow-sm cursor-pointer disabled:opacity-50">
                {saving ? 'Processing...' : 'Excuse Fine'}
              </button>
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {modal === 'config' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="rounded-2xl p-6 w-full max-w-sm bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#881337]">Fine Settings</h2>
              <button onClick={() => setModal(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Fine Rate per Day (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl outline-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#9E0D0D]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={newGrace}
                  onChange={(e) => setNewGrace(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl outline-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#9E0D0D]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Number of days after due date before fines apply.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveConfig} disabled={saving} className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#9E0D0D] hover:bg-[#7F0A0A] text-white shadow-sm cursor-pointer disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
