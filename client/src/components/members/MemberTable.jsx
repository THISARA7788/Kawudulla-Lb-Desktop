import React from 'react';

// Sri Lankan school grades
const GRADES = [
  { label: 'Grade 1', value: 'Grade 1' },
  { label: 'Grade 2', value: 'Grade 2' },
  { label: 'Grade 3', value: 'Grade 3' },
  { label: 'Grade 4', value: 'Grade 4' },
  { label: 'Grade 5', value: 'Grade 5' },
  { label: 'Grade 6', value: 'Grade 6' },
  { label: 'Grade 7', value: 'Grade 7' },
  { label: 'Grade 8', value: 'Grade 8' },
  { label: 'Grade 9', value: 'Grade 9' },
  { label: 'Grade 10', value: 'Grade 10' },
  { label: 'Grade 11', value: 'Grade 11' },
  { label: 'Grade 12 (A/L)', value: 'Grade 12' },
  { label: 'Grade 13 (A/L)', value: 'Grade 13' },
  { label: 'Teacher', value: 'Teacher' },
  { label: 'Other', value: 'Other' },
];

function gradeLabel(val) {
  if (!val) return '';
  const match = GRADES.find((g) => g.value === val);
  return match ? match.label : val;
}

function displayGradeAndClass(m) {
  if (m.grade && m.class && m.grade !== 'Grade 12' && m.grade !== 'Grade 13') {
    return `${gradeLabel(m.grade)}-${m.class}`;
  }
  if (m.grade === 'Grade 12' || m.grade === 'Grade 13') {
    const stream = m.class;
    if (stream) return `${gradeLabel(m.grade)} – ${stream}`;
    return gradeLabel(m.grade);
  }
  return gradeLabel(m.grade) || '—';
}

export default function MemberTable({
  loading,
  filtered,
  currentPage = 1,
  setCurrentPage,
  itemsPerPage = 30,
  setItemsPerPage,
  openHistory,
  openEdit,
  handleStatusToggle,
  handleDelete
}) {
  const roleBadge = (role) => {
    const map = {
      student: { bg: '#dcfce7', color: '#166534' },
      teacher: { bg: '#dbeafe', color: '#1e40af' },
      librarian: { bg: '#e8d5f5', color: '#7c3aed' }
    };
    const s = map[role] || { bg: '#f0f0f0', color: '#666' };
    return (
      <span className="text-xs font-bold uppercase px-2 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
        {role}
      </span>
    );
  };

  const statusBadge = (status) => {
    const map = {
      active: { c: '#166534', bg: '#dcfce7', t: 'Active' },
      pending: { c: '#854d0e', bg: '#fef9c3', t: 'Pending' },
      rejected: { c: '#b31b25', bg: '#fee2e2', t: 'Rejected' }
    };
    const s = map[status] || { c: '#666', bg: '#f0f0f0', t: status };
    return (
      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.c }}>
        {s.t}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
              <div className="h-5 w-16 bg-slate-200 rounded-full hidden sm:block" />
              <div className="h-3 bg-slate-100 rounded w-20 hidden md:block" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
              <div className="h-8 w-16 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94a3b8' }}>
        <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, opacity: 0.3 }}>group_off</span>
        <p className="text-sm font-medium">No members found</p>
      </div>
    );
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filtered.slice(startIndex, startIndex + itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm table-fixed">
          <thead className="sticky top-0 z-10 shadow-xs" style={{ background: '#FFFFFF', borderBottom: '1px solid #CBD5E1' }}>
            <tr className="divide-x divide-slate-200">
              <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Member ID</th>
              <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Name</th>
              <th className="py-3 px-3 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Email</th>
              <th className="py-3 px-3 w-24 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Role</th>
              <th className="py-3 px-3 w-32 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Grade / Class</th>
              <th className="py-3 px-3 w-28 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Status</th>
              <th className="py-3 px-3 w-32 text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#881337' }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedList.map((m, idx) => (
              <tr
                key={m._id}
                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFB]'} hover:bg-[#EAEFF5] transition-colors duration-150`}
              >
                <td className="py-3.5 px-4 text-xs font-mono font-bold text-center" style={{ color: '#1a1245' }}>{m.memberId || '—'}</td>
                <td className="py-3.5 px-4 font-medium text-xs text-left" style={{ color: '#2C2C3E' }}>{m.name}</td>
                <td className="py-3.5 px-4 text-xs text-left" style={{ color: '#595c5e' }}>{m.email}</td>
                <td className="py-3.5 px-4 text-center">{roleBadge(m.role)}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="text-xs font-medium" style={{ color: '#2C2C3E' }}>
                    {displayGradeAndClass(m)}
                  </span>
                </td>
                <td className="py-3.5 px-4">{statusBadge(m.status)}</td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* View History */}
                    <button
                      onClick={() => openHistory(m)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/60 shadow-xs transition-all duration-150 active:scale-90 cursor-pointer"
                      title="View Borrowing History"
                    >
                      <span className="material-symbols-outlined text-[17px]">history</span>
                    </button>

                    {/* Edit Member & Role */}
                    <button
                      onClick={() => openEdit(m)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 shadow-xs transition-all duration-150 active:scale-90 cursor-pointer"
                      title="Edit Member & Role"
                    >
                      <span className="material-symbols-outlined text-[17px]">edit</span>
                    </button>

                    {/* Deactivate / Activate Status */}
                    {m.status === 'active' ? (
                      <button
                        onClick={() => handleStatusToggle(m, 'rejected')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/60 shadow-xs transition-all duration-150 active:scale-90 cursor-pointer"
                        title="Deactivate Member"
                      >
                        <span className="material-symbols-outlined text-[17px]">person_off</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusToggle(m, 'active')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 shadow-xs transition-all duration-150 active:scale-90 cursor-pointer"
                        title="Activate Member"
                      >
                        <span className="material-symbols-outlined text-[17px]">person_check</span>
                      </button>
                    )}

                    {/* Delete Member (Trash Icon) */}
                    <button
                      onClick={() => handleDelete(m)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/60 shadow-xs transition-all duration-150 active:scale-90 cursor-pointer"
                      title="Delete Member"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Bar */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                if (typeof setItemsPerPage === 'function') setItemsPerPage(Number(e.target.value));
                if (typeof setCurrentPage === 'function') setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold outline-none shadow-xs"
            >
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>items per page &middot; Showing {totalItems > 0 ? startIndex + 1 : 0} to {endIndex} of {totalItems} members</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage && setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold transition-all cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setCurrentPage && setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-[#1a1245] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage && setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export { displayGradeAndClass, gradeLabel };
