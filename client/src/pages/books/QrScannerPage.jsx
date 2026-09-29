import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function QrScannerPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [tab, setTab] = useState('member'); // 'member' | 'book'
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { if (user && user.role !== 'librarian') navigate('/dashboard', { replace: true }); }, [user, navigate]);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [tab, query]);

  const handleLookup = async () => {
    if (!query.trim()) return;
    const trimmed = query.trim().toUpperCase();
    if (tab === 'member' && !trimmed.startsWith('KMV-')) { setError('Invalid Member ID format. Must start with KMV-'); return; }
    if (tab === 'book' && !trimmed.startsWith('BK')) { setError('Invalid Book ID format. Must start with BK'); return; }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get(`/library/quick-lookup/${trimmed}`, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
      setHistory((prev) => [{ id: trimmed, type: res.data.type, timestamp: new Date().toLocaleTimeString(), data: res.data }, ...prev].slice(0, 10));
      setQuery(''); // Clear the input field so the next scan is ready
    } catch (err) {
      setError(err.response?.data?.message || 'Not found');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.select();
      }, 50);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleLookup(); }
  };

  const handleResultClick = (item) => {
    setTab(item.type);
    setQuery(item.id);
    setResult(item.data);
    setError('');
  };

  const roleBadge = (role) => {
    const map = { student: { bg: '#dcfce7', color: '#166534' }, teacher: { bg: '#dbeafe', color: '#1e40af' }, librarian: { bg: '#e8d5f5', color: '#7c3aed' } };
    const s = map[role] || { bg: '#f0f0f0', color: '#666' };
    return <span className="text-xs font-bold uppercase px-2 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{role}</span>;
  };

  const statusBadge = (status) => {
    const map = { active: { c: '#166534', bg: '#dcfce7', t: 'Active' }, pending: { c: '#854d0e', bg: '#fef9c3', t: 'Pending' }, rejected: { c: '#b31b25', bg: '#fee2e2', t: 'Rejected' } };
    const s = map[status] || { c: '#666', bg: '#f0f0f0', t: status };
    return <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.c }}>{s.t}</span>;
  };

  return (
    <DashboardLayout>
          <div className="mb-4">
            <h1 className="text-3xl font-extrabold" style={{ color: '#1a1245', fontFamily: "'Manrope', sans-serif" }}>QR / Barcode Scanner</h1>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Scan or enter member/barcode IDs to quickly look up records. Works with USB barcode scanners.</p>
          </div>

          {/* Tab Toggle */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => { setTab('member'); setQuery(''); setResult(null); setError(''); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: tab === 'member' ? '#1a1245' : '#fff', color: tab === 'member' ? '#fff' : '#2C2C3E', border: `1px solid ${tab === 'member' ? '#1a1245' : '#e0e0e0'}` }}>
              <span className="material-symbols-outlined inline-block mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>person</span> Member
            </button>
            <button onClick={() => { setTab('book'); setQuery(''); setResult(null); setError(''); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: tab === 'book' ? '#1a1245' : '#fff', color: tab === 'book' ? '#fff' : '#2C2C3E', border: `1px solid ${tab === 'book' ? '#1a1245' : '#e0e0e0'}` }}>
              <span className="material-symbols-outlined inline-block mr-1" style={{ fontSize: 16, verticalAlign: 'middle' }}>menu_book</span> Book
            </button>
          </div>

          {/* Scan Input */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8', fontSize: 22 }}>qr_code_scanner</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
                placeholder={tab === 'member' ? 'Scan or enter Member ID (e.g. KMV-0001)...' : 'Scan or enter Book ID (e.g. BK001)...'}
                className="w-full py-3 pl-10 pr-4 text-base rounded-xl outline-none"
                style={{ backgroundColor: '#fff', border: '2px solid #1a1245', fontFamily: 'monospace', fontWeight: 'bold' }}
              />
            </div>
            <button onClick={handleLookup} disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#1a1245', color: '#fff', opacity: loading || !query.trim() ? 0.6 : 1, minWidth: 120 }}>
              {loading ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
              ) : 'Search'}
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#fee2e2', color: '#b31b25' }}>
              <span className="material-symbols-outlined inline-block mr-1 align-middle" style={{ fontSize: 18 }}>error</span> {error}
            </div>
          )}

          <div className="flex gap-6">
            {/* Result */}
            <div className="flex-1">
              {result && (
                <>
                  {result.type === 'member' && (
                    <div className="rounded-xl border p-6" style={{ backgroundColor: '#fff', borderColor: '#f0f0f0' }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: '#1a1245' }}>{result.member.name}</h3>
                          <p className="text-xs font-mono font-bold" style={{ color: '#4062BB' }}>{result.member.memberId}</p>
                        </div>
                        {roleBadge(result.member.role)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p style={{ color: '#94a3b8' }}>Email</p>
                          <p style={{ color: '#2C2C3E', fontWeight: 500 }}>{result.member.email}</p>
                        </div>
                        <div>
                          <p style={{ color: '#94a3b8' }}>Grade</p>
                          <p style={{ color: '#2C2C3E', fontWeight: 500 }}>{result.member.grade || '—'}</p>
                        </div>
                        <div>
                          <p style={{ color: '#94a3b8' }}>Status</p>
                          {statusBadge(result.member.status)}
                        </div>
                        <div>
                          <p style={{ color: '#94a3b8' }}>Total Borrows</p>
                          <p style={{ color: '#2C2C3E', fontWeight: 'bold', fontSize: 18 }}>{result.totalBorrows}</p>
                        </div>
                      </div>

                      {/* Active Borrows */}
                      {result.activeBorrows.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2" style={{ color: '#1a1245' }}>Active Borrows</h4>
                          <div className="space-y-2">
                            {result.activeBorrows.map((b) => (
                              <div key={b._id} className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: '#f5f7fa', border: '1px solid #e0e0e0' }}>
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: '#2C2C3E' }}>{b.book?.title} <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>({b.book?.bookId})</span></p>
                                  <p className="text-xs" style={{ color: '#94a3b8' }}>Due: {new Date(b.dueDate).toLocaleDateString()}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                                  backgroundColor: new Date(b.dueDate) < new Date() ? '#fee2e2' : '#dbeafe',
                                  color: new Date(b.dueDate) < new Date() ? '#b31b25' : '#1e40af',
                                }}>
                                  {new Date(b.dueDate) < new Date() ? 'Overdue' : b.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {result.type === 'book' && (
                    <div className="rounded-xl border p-6" style={{ backgroundColor: '#fff', borderColor: '#f0f0f0' }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: '#1a1245' }}>{result.book.title}</h3>
                          <p className="text-xs font-mono font-bold" style={{ color: '#4062BB' }}>{result.book.bookId}</p>
                        </div>
                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-full" style={{ backgroundColor: '#CAD6FF', color: '#3E4A6C' }}>{result.book.category}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p style={{ color: '#94a3b8' }}>Author</p>
                          <p style={{ color: '#2C2C3E', fontWeight: 500 }}>{result.book.author}</p>
                        </div>
                        <div>
                          <p style={{ color: '#94a3b8' }}>ISBN</p>
                          <p style={{ color: '#2C2C3E', fontWeight: 500 }}>{result.book.isbn || '—'}</p>
                        </div>
                        <div>
                          <p style={{ color: '#94a3b8' }}>Publisher</p>
                          <p style={{ color: '#2C2C3E', fontWeight: 500 }}>{result.book.publisher || '—'}</p>
                        </div>
                        <div>
                          <p style={{ color: '#94a3b8' }}>Year</p>
                          <p style={{ color: '#2C2C3E', fontWeight: 500 }}>{result.book.publishedYear || '—'}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 rounded-lg p-4 text-center" style={{ backgroundColor: result.book.availableCopies > 0 ? '#dcfce7' : '#fee2e2' }}>
                          <p className="text-xs" style={{ color: result.book.availableCopies > 0 ? '#166534' : '#b31b25' }}>Available</p>
                          <p className="text-2xl font-bold" style={{ color: result.book.availableCopies > 0 ? '#166534' : '#b31b25' }}>{result.book.availableCopies}</p>
                        </div>
                        <div className="flex-1 rounded-lg p-4 text-center" style={{ backgroundColor: '#f5f7fa' }}>
                          <p className="text-xs" style={{ color: '#94a3b8' }}>Total Copies</p>
                          <p className="text-2xl font-bold" style={{ color: '#1a1245' }}>{result.book.totalCopies}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!result && !error && !loading && (
                <div className="flex flex-col items-center justify-center py-20" style={{ color: '#94a3b8' }}>
                  <span className="material-symbols-outlined mb-2" style={{ fontSize: 64, opacity: 0.2 }}>qr_code_scanner</span>
                  <p className="text-sm font-medium">Scan a barcode or enter an ID to look up</p>
                  <p className="text-xs mt-1">USB barcode scanners work by typing the code — just aim and scan.</p>
                </div>
              )}
            </div>

            {/* Scan History */}
            {history.length > 0 && (
              <div className="w-64 rounded-xl border p-4" style={{ backgroundColor: '#fff', borderColor: '#f0f0f0', alignSelf: 'flex-start' }}>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Scan History</h4>
                <div className="space-y-2">
                  {history.map((item, i) => (
                    <button key={i} onClick={() => handleResultClick(item)} className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors" style={{ border: '1px solid #f0f0f0' }}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: item.type === 'member' ? '#2563eb' : '#1a1245' }}>
                          {item.type === 'member' ? 'person' : 'menu_book'}
                        </span>
                        <div>
                          <p className="text-xs font-mono font-bold" style={{ color: '#1a1245' }}>{item.id}</p>
                          <p className="text-xs" style={{ color: '#94a3b8' }}>{item.timestamp}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          {history.length > 0 && (
            <div className="flex gap-4 mt-4">
              {[
                ['Total Scans', history.length],
                ['Members', history.filter((h) => h.type === 'member').length],
                ['Books', history.filter((h) => h.type === 'book').length],
              ].map(([label, val]) => (
                <div key={label} className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}>
                  <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{label}</p>
                  <p className="text-xl font-bold" style={{ color: '#1a1245' }}>{val}</p>
                </div>
              ))}
            </div>
          )}
    </DashboardLayout>
  );
}
