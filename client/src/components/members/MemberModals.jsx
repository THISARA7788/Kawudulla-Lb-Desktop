import React, { useState, useRef } from 'react';
import api from '../../api/axios';
import { displayGradeAndClass } from './MemberTable';

export default function MemberModals({
  modal,
  selected,
  form,
  setForm,
  addForm,
  setAddForm,
  handleAddMember,
  saving,
  error,
  handleSave,
  setModal,
  historyLoading,
  historyData,
  setHistoryData,
  onImportComplete,
  showToast,
  ROLES,
  GRADES,
  CLASS_SECTIONS,
  AL_STREAMS
}) {
  const isEditALGrade = form.grade === 'Grade 12' || form.grade === 'Grade 13';
  const isAddALGrade = addForm.grade === 'Grade 12' || addForm.grade === 'Grade 13';

  const [showAddPassword, setShowAddPassword] = useState(false);

  // Bulk Import States & Handlers (Exact matching Book Catalog)
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const downloadMemberTemplate = () => {
    const link = document.createElement("a");
    link.setAttribute("href", "/library_member_import_template.xlsx");
    link.setAttribute("download", "library_member_import_template.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = null;
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('defaultPassword', 'Kmv@1234');

      const res = await api.post('/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResult({
        success: true,
        importedCount: res.data.importedCount,
        skippedCount: res.data.skippedCount,
      });

      if (onImportComplete) {
        onImportComplete(res.data.importedUsers || []);
      }
    } catch (err) {
      console.error('Spreadsheet import error:', err);
      if (showToast) {
        showToast(err.response?.data?.message || 'Failed to import members. Please check column headers.', 'error');
      }
    } finally {
      setImporting(false);
    }
  };

  if (!modal && !importing && !importResult) return null;

  return (
    <>
      {/* Add Modal */}
      {modal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModal(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden relative z-10 p-6 max-h-[90vh] flex flex-col animate-[toast-enter_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9E0D0D]" style={{ fontSize: 24 }}>person_add</span>
                <h2 className="text-lg font-bold" style={{ color: '#1a1245', fontFamily: "'Manrope', sans-serif" }}>Add New Member</h2>
              </div>
              <div className="flex items-center gap-3">
                {/* Bulk Import controls inside header matching Book Catalog */}
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                  <button
                    type="button"
                    onClick={downloadMemberTemplate}
                    className="flex items-center justify-center bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl p-2 shadow-xs text-slate-500 hover:text-slate-700 transition-all active:scale-95 cursor-pointer"
                    title="Download Excel Import Template"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Import Members from CSV/Excel"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
                    Bulk Import
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleBulkImport}
                    className="hidden"
                  />
                </div>
                <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>
            </div>

            {error && <div className="mb-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex-shrink-0">{error}</div>}

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto pr-1 flex-1">
              <form onSubmit={handleAddMember} className="space-y-3.5 pt-1 pb-1">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Full Name *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    placeholder="e.g. Kasun Perera"
                    className="w-full px-3.5 py-2 text-xs rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] bg-[#f8fafc] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Email Address *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    placeholder="e.g. kasun@kmv.edu"
                    className="w-full px-3.5 py-2 text-xs rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] bg-[#f8fafc] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Password *</label>
                  <div className="relative">
                    <input
                      type={showAddPassword ? "text" : "password"}
                      value={addForm.password}
                      onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                      required
                      placeholder="Temporary login password"
                      className="w-full px-3.5 py-2 pr-10 text-xs rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] bg-[#f8fafc] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center p-0.5"
                      tabIndex="-1"
                      title={showAddPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showAddPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Member Role *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      setAddForm((p) => ({
                        ...p,
                        role: nextRole,
                        grade: nextRole === 'teacher' ? 'Teacher' : (nextRole === 'librarian' ? '' : p.grade === 'Teacher' ? '' : p.grade),
                        class: nextRole !== 'student' ? '' : p.class,
                      }));
                    }}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-[#f8fafc] focus:bg-white"
                    style={{ color: '#2C2C3E' }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Student Fields: Grade & Class/Stream */}
                {addForm.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Grade</label>
                      <select
                        value={addForm.grade}
                        onChange={(e) => setAddForm((p) => ({ ...p, grade: e.target.value, class: '' }))}
                        className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-[#f8fafc] focus:bg-white"
                        style={{ color: '#2C2C3E' }}
                      >
                        <option value="">Select Grade</option>
                        {GRADES.filter((g) => g.value !== 'Teacher').map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Class section A-H for grades 1-11 */}
                    {addForm.grade && addForm.grade !== 'Grade 12' && addForm.grade !== 'Grade 13' && addForm.grade !== 'Other' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Class Section</label>
                        <div className="grid grid-cols-4 gap-2">
                          {CLASS_SECTIONS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setAddForm((p) => ({ ...p, class: c }))}
                              className="py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                              style={{
                                backgroundColor: addForm.class === c ? '#9E0D0D' : '#f8fafc',
                                color: addForm.class === c ? '#fff' : '#2C2C3E',
                                borderColor: addForm.class === c ? '#9E0D0D' : '#e2e8f0',
                              }}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* A/L stream for grades 12-13 */}
                    {isAddALGrade && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>A/L Stream</label>
                        <select
                          value={addForm.class}
                          onChange={(e) => setAddForm((p) => ({ ...p, class: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-[#f8fafc] focus:bg-white"
                          style={{ color: '#2C2C3E' }}
                        >
                          <option value="">Select Stream</option>
                          {AL_STREAMS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Teacher Info Banner */}
                {addForm.role === 'teacher' && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center gap-2.5 text-xs text-blue-700">
                    <span className="material-symbols-outlined text-blue-600 text-lg">school</span>
                    <span>Teacher member &mdash; automatically configured for staff borrowing privileges.</span>
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-[#9E0D0D] hover:bg-[#7F0A0A] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                    style={{ opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? 'Creating...' : 'Create Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModal(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden relative z-10 p-6 max-h-[90vh] flex flex-col animate-[toast-enter_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9E0D0D]" style={{ fontSize: 24 }}>edit_square</span>
                <h2 className="text-lg font-bold" style={{ color: '#4C0000', fontFamily: "'Manrope', sans-serif" }}>Edit Member</h2>
              </div>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {error && <div className="mb-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex-shrink-0">{error}</div>}

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto pr-1 flex-1">
              <form onSubmit={handleSave} className="space-y-3.5 pt-1 pb-1">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Member ID</label>
                  <input value={selected.memberId} readOnly disabled className="w-full px-3.5 py-2 text-xs rounded-xl outline-none bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="w-full px-3.5 py-2 text-xs rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] bg-[#f8fafc] focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Email Address *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required className="w-full px-3.5 py-2 text-xs rounded-xl outline-none border border-slate-200 focus:border-[#9E0D0D] bg-[#f8fafc] focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Member Role *</label>
                  <select
                    value={form.role || 'student'}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      setForm((p) => ({
                        ...p,
                        role: nextRole,
                        grade: nextRole === 'teacher' ? 'Teacher' : (nextRole === 'librarian' ? '' : p.grade === 'Teacher' ? '' : p.grade),
                        class: nextRole !== 'student' ? '' : p.class,
                      }));
                    }}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-[#f8fafc] focus:bg-white"
                    style={{ color: '#2C2C3E' }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Student Fields: Grade & Class/Stream */}
                {form.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Grade</label>
                      <select
                        value={form.grade}
                        onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value, class: '' }))}
                        className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-[#f8fafc] focus:bg-white"
                        style={{ color: '#2C2C3E' }}
                      >
                        <option value="">Select Grade</option>
                        {GRADES.filter((g) => g.value !== 'Teacher').map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Class section A-H for grades 1-11 */}
                    {form.grade && form.grade !== 'Grade 12' && form.grade !== 'Grade 13' && form.grade !== 'Other' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>Class Section</label>
                        <div className="grid grid-cols-4 gap-2">
                          {CLASS_SECTIONS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, class: c }))}
                              className="py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                              style={{
                                backgroundColor: form.class === c ? '#9E0D0D' : '#f8fafc',
                                color: form.class === c ? '#fff' : '#2C2C3E',
                                borderColor: form.class === c ? '#9E0D0D' : '#e2e8f0',
                              }}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* A/L stream for grades 12-13 */}
                    {isEditALGrade && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#595c5e' }}>A/L Stream</label>
                        <select
                          value={form.class}
                          onChange={(e) => setForm((p) => ({ ...p, class: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-[#f8fafc] focus:bg-white"
                          style={{ color: '#2C2C3E' }}
                        >
                          <option value="">Select Stream</option>
                          {AL_STREAMS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Teacher Info Banner */}
                {form.role === 'teacher' && (
                  <div className="p-3 bg-red-50/60 border border-red-200/70 rounded-xl flex items-center gap-2.5 text-xs text-[#9E0D0D]">
                    <span className="material-symbols-outlined text-[#9E0D0D] text-lg">school</span>
                    <span>Teacher member &mdash; configured for staff borrowing privileges.</span>
                  </div>
                )}
                <div className="flex gap-3 pt-3">
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#9E0D0D] hover:bg-[#7F0A0A] text-white transition-all shadow-md active:scale-95 cursor-pointer" style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Update Member'}</button>
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {modal === 'history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => { setModal(null); setHistoryData(null); }}></div>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full overflow-hidden relative z-10 p-6 max-h-[90vh] flex flex-col animate-[toast-enter_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9E0D0D]" style={{ fontSize: 24 }}>history</span>
                <h2 className="text-lg font-bold" style={{ color: '#4C0000', fontFamily: "'Manrope', sans-serif" }}>Member History</h2>
              </div>
              <button onClick={() => { setModal(null); setHistoryData(null); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-16" style={{ color: '#94a3b8' }}>
                <span className="material-symbols-outlined animate-spin mr-2 text-[#9E0D0D]" style={{ fontSize: 28 }}>progress_activity</span>Loading history...
              </div>
            ) : (
              <div className="overflow-y-auto pr-1 flex-1">
                {historyData && (
                  <>
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-red-50/40 border border-red-100">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0" style={{ background: 'linear-gradient(135deg, #9E0D0D 0%, #4C0000 100%)' }}>
                        {historyData.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#4C0000' }}>{historyData.user.name}</p>
                        <p className="text-xs text-slate-500">{historyData.user.memberId || 'No ID'} &middot; <span className="capitalize">{historyData.user.role}</span> &middot; {displayGradeAndClass(historyData.user)}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mb-4">
                      {[
                        ['Total Borrowed', historyData.stats.totalBorrows, '#4C0000'],
                        ['Currently Has', historyData.stats.currentBorrows, '#9E0D0D'],
                        ['Returned', historyData.stats.returnedCount, '#166534'],
                        ['Overdue', historyData.stats.overdueCount, historyData.stats.overdueCount > 0 ? '#b31b25' : '#64748b'],
                      ].map(([label, val, col]) => (
                        <div key={label} className="flex-1 text-center px-3 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-2xs">
                          <p className="text-lg font-bold" style={{ color: col }}>{val}</p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {historyData.transactions.length === 0 ? (
                      <div className="text-center py-10" style={{ color: '#94a3b8' }}>
                        <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>history_toggle_off</span>
                        <p className="text-sm font-medium">No borrowing history found</p>
                      </div>
                    ) : (
                      <div className="overflow-y-auto rounded-2xl border border-slate-200" style={{ maxHeight: 340 }}>
                        <table className="w-full text-left text-xs table-fixed">
                          <thead className="sticky top-0 z-10 shadow-xs" style={{ background: '#FFFFFF', borderBottom: '1px solid #CBD5E1' }}>
                            <tr className="divide-x divide-slate-200">
                              <th className="py-2.5 px-3 font-bold text-center uppercase tracking-wide w-[36%]" style={{ color: '#881337' }}>Book</th>
                              <th className="py-2.5 px-3 font-bold text-center uppercase tracking-wide w-[18%]" style={{ color: '#881337' }}>Issue Date</th>
                              <th className="py-2.5 px-3 font-bold text-center uppercase tracking-wide w-[18%]" style={{ color: '#881337' }}>Due Date</th>
                              <th className="py-2.5 px-3 font-bold text-center uppercase tracking-wide w-[18%]" style={{ color: '#881337' }}>Return Date</th>
                              <th className="py-2.5 px-3 font-bold text-center uppercase tracking-wide w-[10%]" style={{ color: '#881337' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {historyData.transactions.map((t, idx) => {
                              const statusColor = t.status === 'returned' ? { bg: '#dcfce7', c: '#166534', label: 'Returned' }
                                : new Date(t.dueDate) < new Date() ? { bg: '#fee2e2', c: '#b31b25', label: 'Overdue' }
                                : { bg: '#fef9c3', c: '#854d0e', label: 'Active' };
                              return (
                                <tr key={t._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'} hover:bg-[#EAEFF5] transition-colors duration-150 divide-x divide-slate-100`}>
                                  <td className="py-2 px-3">
                                    <div className="truncate">
                                      <span className="font-semibold text-xs truncate block text-slate-800" title={t.book?.title}>{t.book?.title || 'Unknown'}</span>
                                      <span className="block text-[10px] truncate text-slate-400" title={t.book?.author}>{t.book?.author || ''}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-center whitespace-nowrap text-slate-600">{formatDate(t.issueDate)}</td>
                                  <td className="py-2 px-3 text-center whitespace-nowrap text-slate-600">{formatDate(t.dueDate)}</td>
                                  <td className="py-2 px-3 text-center whitespace-nowrap text-slate-600">{t.returnDate ? formatDate(t.returnDate) : '—'}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor.bg, color: statusColor.c }}>{statusColor.label}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Import Progress Overlay (Exact matching Book Catalog) */}
      {importing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-all select-none animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4">
            <div className="w-16 h-16 border-4 border-[#9E0D0D] border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-lg font-bold text-slate-800 mt-2">Importing Members</h3>
            <p className="text-xs text-slate-500">Parsing spreadsheet and updating library database. Please wait...</p>
          </div>
        </div>
      )}

      {/* Bulk Import Result Dialog (Exact matching Book Catalog) */}
      {importResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 animate-fadeIn">
            <span className="material-symbols-outlined text-5xl text-emerald-500 mb-3" style={{ fontSize: 56 }}>check_circle</span>
            <h3 className="text-xl font-bold text-slate-800">Import Complete</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Successfully imported <strong className="text-slate-800">{importResult.importedCount}</strong> new members.
            </p>
            {importResult.skippedCount > 0 && (
              <p className="text-xs text-amber-600 mt-1 font-semibold">
                Skipped {importResult.skippedCount} duplicate/invalid records.
              </p>
            )}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 text-left w-full">
              <span className="font-bold text-slate-700 block mb-0.5">Initial Default Password:</span>
              <code className="font-mono font-bold text-[#9E0D0D]">Kmv@1234</code>
              <span className="block text-[10px] text-slate-400 mt-0.5">Members can log in and change this anytime.</span>
            </div>
            <button
              type="button"
              onClick={() => { setImportResult(null); setModal(null); }}
              className="mt-5 w-full py-2.5 bg-[#9E0D0D] text-white rounded-2xl text-sm font-bold shadow-md hover:bg-[#7F0A0A] transition-all active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
