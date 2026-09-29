// ==================================================================================
// 👤 MEMBER 2: LIBRARIAN DASHBOARD
// WHAT DOES THIS FILE DO?
// This is the main dashboard that the Librarian sees after logging in.
// It loads statistics from the database, such as:
// - Total Books, Active Borrows, Overdue Books, Total Fines.
// - It also shows visual charts and recent activity lists.
// ==================================================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import HeroBorrowingChart from './HeroBorrowingChart'

const ms = {
  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
}

const pieColors = [
  '#A78BFA', '#60A5FA', '#F472B6', '#34D399', '#FBBF24', '#F87171', '#818CF8', '#2DD4BF',
  '#A3E635', '#C084FC', '#FB923C', '#38BDF8', '#F0ABFC', '#4ADE80', '#FDE047', '#FDA4AF'
]
const pieColors3D = [
  '#7C3AED', '#2563EB', '#DB2777', '#059669', '#D97706', '#DC2626', '#4F46E5', '#0D9488',
  '#65A30D', '#9333EA', '#EA580C', '#0284C7', '#C026D3', '#16A34A', '#CA8A04', '#E11D48'
]

const getCategoryColor = (category) => {
  const categoryColors = {
    'Fiction': { color: '#A78BFA', color3D: '#7C3AED' },
    'Science': { color: '#60A5FA', color3D: '#2563EB' },
    'History': { color: '#FB923C', color3D: '#EA580C' },
    'Math': { color: '#38BDF8', color3D: '#0284C7' },
    'Reference': { color: '#34D399', color3D: '#059669' },
    'Technology': { color: '#C084FC', color3D: '#9333EA' },
    'Biography': { color: '#F472B6', color3D: '#DB2777' },
  };
  
  const normalized = category ? category.trim() : 'General';
  if (categoryColors[normalized]) {
    return categoryColors[normalized];
  }
  
  // Fallback: Deterministic assignment using hash code of string
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % pieColors.length;
  return {
    color: pieColors[index],
    color3D: pieColors3D[index]
  };
};


function PieChart({ data, size = 120, centerText }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  const r = size / 2 - 5
  const cx = size / 2
  const cy = size / 2
  let cumulative = 0
  
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    cumulative += pct
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const largeArc = pct > 0.5 ? 1 : 0
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    const catColors = getCategoryColor(d.label)
    return {
      path,
      color: catColors.color,
      color3D: catColors.color3D
    }
  })

  return (
    <svg width={size} height={size + 8} className="mx-auto my-2" style={{ overflow: 'visible' }}>
      <defs>
        {/* Realistic glossy glass gradients for top face */}
        {slices.map((slice, i) => (
          <linearGradient key={`glass-grad-${i}`} id={`glass-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={slice.color} stopOpacity="0.95" />
            <stop offset="35%" stopColor={slice.color} stopOpacity="0.6" />
            <stop offset="70%" stopColor={slice.color3D} stopOpacity="0.4" />
            <stop offset="100%" stopColor={slice.color3D} stopOpacity="0.8" />
          </linearGradient>
        ))}
        {/* Realistic glassy gradients for 3D depth side face */}
        {slices.map((slice, i) => (
          <linearGradient key={`glass-grad3d-${i}`} id={`glass-grad3d-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={slice.color3D} stopOpacity="0.9" />
            <stop offset="100%" stopColor={slice.color3D} stopOpacity="0.45" />
          </linearGradient>
        ))}
      </defs>

      {/* 1. Flat outer background shadow */}
      <circle cx={cx} cy={cy + 6} r={r} fill="rgba(26, 18, 69, 0.12)" style={{ filter: 'blur(3px)' }} />
      
      {/* 2. 3D extrusion thickness side height (layered stacking for smooth solid 3D effect) */}
      {[1, 2, 3, 4, 5].map((offset) => 
        slices.map((slice, i) => (
          <path 
            key={`bg-${offset}-${i}`} 
            d={slice.path} 
            fill={`url(#glass-grad3d-${i})`} 
            transform={`translate(0, ${offset})`} 
          />
        ))
      )}
      
      {/* 3. Top colored slices */}
      {slices.map((slice, i) => (
        <path 
          key={`fg-${i}`} 
          d={slice.path} 
          fill={`url(#glass-grad-${i})`} 
          stroke="rgba(255, 255, 255, 0.85)" 
          strokeWidth="1.2" 
        />
      ))}
      
      {/* 4. 3D inner hole extrusion shadow */}
      <circle cx={cx} cy={cy + 3.5} r={r * 0.5} fill="rgba(26, 18, 69, 0.15)" />
      
      {/* 5. Top inner hole cutout */}
      <circle cx={cx} cy={cy} r={r * 0.5} fill="#fff" />
      
      {/* 6. Center total text */}
      <text 
        x={cx} 
        y={cy} 
        textAnchor="middle" 
        dominantBaseline="central" 
        className="text-xl font-black" 
        fill="#1E2A4A"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {centerText !== undefined ? centerText : total}
      </text>
    </svg>
  )
}


{/* -------------------------------------------------------------
    🔴 CONFIG: Dashboard "Quick Action" Button Colors
    To change the background or icon color of the dashboard buttons:
    - Edit the "bg" (background HEX) or "icon" (icon/text HEX) value below.
   ------------------------------------------------------------- */}
const quickActionColors = {
  "Issue Book Center": { bg: '#EAFDF3', icon: '#1E7A4A' },
  "Return Book": { bg: '#EFF6FF', icon: '#1D4ED8' },
  "Add New Book": { bg: '#FFF7ED', icon: '#D97706' },
  "View Reports": { bg: '#FAF5FF', icon: '#8B5CF6' },
}

function QuickAction({ icon, label, onClick }) {
  const colors = quickActionColors[label] ?? { bg: '#f1f5f9', icon: '#475569' }
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-2.5 px-3 rounded-full border bg-transparent transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group w-full justify-start pl-4 cursor-pointer"
      style={{ backgroundColor: colors.bg, borderColor: `${colors.icon}22` }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 flex-shrink-0 bg-white shadow-sm border border-slate-100/50"
      >
        <span className="material-symbols-outlined transition-transform duration-300" style={{ color: colors.icon, fontSize: 16 }}>{icon}</span>
      </div>
      <span className="text-[10px] font-black uppercase tracking-wider transition-colors duration-300 whitespace-nowrap" style={{ color: colors.icon }}>{label}</span>
    </button>
  )
}

const getGradientForCategory = (category) => {
  switch (category) {
    case 'Fiction':
      return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    case 'Science':
      return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
    case 'History':
      return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
    case 'Math':
      return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    case 'Reference':
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    case 'Technology':
      return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
    case 'Biography':
      return 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)';
    default:
      return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
  }
};

/* --- Main Component --- */
export default function LibrarianDashboardMain() {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [borrowingStats, setBorrowingStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const handleBorrowYearChange = async (selectedYear) => {
    try {
      const res = await api.get(`/library/reports/borrowing-chart?year=${selectedYear}`)
      if (res.data) {
        setBorrowingStats(res.data)
      }
    } catch (err) {
      console.error('Error updating borrowing chart year:', err)
    }
  }

  const getRelativeDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    } else {
      const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${datePart} at ${timeStr}`;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsRes, chartRes] = await Promise.all([
          api.get('/library/reports/dashboard'),
          api.get('/library/reports/borrowing-chart'),
        ])
        const stats = statsRes.data

        setDashboardStats(stats)
        setCategories(stats.categoriesMap || {})
        setBooks(stats.recentBooks || [])
        setBorrowingStats(chartRes.data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const totalBooks = dashboardStats?.totalBooks ?? books.length
  const totalCopies = dashboardStats?.totalCopies ?? books.reduce((sum, b) => sum + (b.totalCopies || 0), 0)


  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#2C2C3E' }}>

      {/* ===== Stats Bento Grid ===== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        
        {/* 1. Total Books */}
        <div
          onClick={() => navigate('/books')}
          className="p-2.5 rounded-xl border bg-white cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between w-full relative"
          style={{ borderColor: '#e2e8f0', minHeight: 114 }}
        >
          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#9E0D0D]" style={{ fontSize: 16 }}>library_books</span>
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-20 bg-slate-200/70 rounded-md animate-pulse mb-3.5" />
            ) : (
              <span 
                className="text-3xl font-black text-black tracking-tight block leading-none mb-3.5 whitespace-nowrap"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {totalCopies.toLocaleString('en-US')}
              </span>
            )}
            <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500 block leading-tight">Total Books</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-semibold bg-slate-50 border border-slate-100 text-slate-500 block absolute right-2.5 top-2.5 whitespace-nowrap">
            {loading ? '...' : `${totalBooks.toLocaleString('en-US')} titles`}
          </span>
        </div>

        {/* 2. Available Books */}
        <div
          onClick={() => navigate('/books')}
          className="p-2.5 rounded-xl border bg-white cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between w-full"
          style={{ borderColor: '#e2e8f0', minHeight: 114 }}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: 16 }}>check_circle</span>
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-20 bg-slate-200/70 rounded-md animate-pulse mb-3.5" />
            ) : (
              <span 
                className="text-3xl font-black text-black tracking-tight block leading-none mb-3.5 whitespace-nowrap"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {(dashboardStats?.availableCopies ?? 0).toLocaleString('en-US')}
              </span>
            )}
            <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500 block leading-tight">Available Books</span>
          </div>
        </div>

        {/* 3. Currently Borrowed */}
        <div
          onClick={() => navigate('/circulation')}
          className="p-2.5 rounded-xl border bg-white cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between w-full"
          style={{ borderColor: '#e2e8f0', minHeight: 114 }}
        >
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#D97706]" style={{ fontSize: 16 }}>import_contacts</span>
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-20 bg-slate-200/70 rounded-md animate-pulse mb-3.5" />
            ) : (
              <span 
                className="text-3xl font-black text-black tracking-tight block leading-none mb-3.5 whitespace-nowrap"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {(dashboardStats?.currentlyBorrowed ?? 0).toLocaleString('en-US')}
              </span>
            )}
            <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500 block leading-tight">Currently Borrowed</span>
          </div>
        </div>

        {/* 4. Overdue Books */}
        <div
          onClick={() => navigate('/circulation')}
          className="p-2.5 rounded-xl border bg-white cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between w-full"
          style={{ borderColor: '#e2e8f0', minHeight: 114 }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (!loading && dashboardStats?.overdueCount > 0) ? '#FDF2F2' : '#f1f5f9' }}>
            <span className={`material-symbols-outlined ${(!loading && dashboardStats?.overdueCount > 0) ? 'text-[#9E0D0D]' : 'text-slate-500'}`} style={{ fontSize: 16 }}>warning</span>
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-20 bg-slate-200/70 rounded-md animate-pulse mb-3.5" />
            ) : (
              <span 
                className="text-3xl font-black text-black tracking-tight block leading-none mb-3.5 whitespace-nowrap"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {(dashboardStats?.overdueCount ?? 0).toLocaleString('en-US')}
              </span>
            )}
            <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500 block leading-tight">Overdue Books</span>
          </div>
        </div>

        {/* 5. Pending Registrations */}
        <div
          onClick={() => navigate('/pending-registration')}
          className="p-2.5 rounded-xl border bg-white cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between w-full"
          style={{ borderColor: '#e2e8f0', minHeight: 114 }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (!loading && dashboardStats?.pendingRegistrations > 0) ? '#FEF3C7' : '#f1f5f9' }}>
            <span className={`material-symbols-outlined ${(!loading && dashboardStats?.pendingRegistrations > 0) ? 'text-[#D97706]' : 'text-slate-500'}`} style={{ fontSize: 16 }}>person_add</span>
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-20 bg-slate-200/70 rounded-md animate-pulse mb-3.5" />
            ) : (
              <span 
                className="text-3xl font-black text-black tracking-tight block leading-none mb-3.5 whitespace-nowrap"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {(dashboardStats?.pendingRegistrations ?? 0).toLocaleString('en-US')}
              </span>
            )}
            <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500 block leading-tight whitespace-nowrap">Pending Registrations</span>
          </div>
        </div>

        {/* 6. Total Fines Due */}
        <div
          onClick={() => navigate('/fines')}
          className="p-2.5 rounded-xl border bg-white cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between w-full relative"
          style={{ borderColor: '#e2e8f0', minHeight: 114 }}
        >
          <div className="w-7 h-7 rounded-lg bg-red-50 flex-shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#9E0D0D]" style={{ fontSize: 16 }}>payments</span>
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-24 bg-slate-200/70 rounded-md animate-pulse mb-3.5" />
            ) : (
              <span 
                className="text-3xl font-black text-black tracking-tight block leading-none mb-3.5 whitespace-nowrap"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {`Rs. ${(dashboardStats?.unpaidFines ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              </span>
            )}
            <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-500 block leading-tight">Total Fines Due</span>
          </div>
          <div className="absolute right-2.5 top-2.5 text-right text-[8px] text-slate-400 font-bold leading-tight">
            <div className="text-[#9E0D0D]">Today: Rs. {loading ? '...' : (dashboardStats?.finesDueToday ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <div className="text-slate-500">Month: Rs. {loading ? '...' : (dashboardStats?.finesDueThisMonth ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </section>

      {/* ===== Main Content Area ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

        {/* LEFT Column: Quick Actions + Recent Borrowing Activities */}
        <div className="lg:col-span-6 flex flex-col gap-4">

          {/* Quick Actions */}
          <section>
            <h3 className="text-base font-bold mb-2" style={{ color: '#1E2A4A', fontFamily: "'Manrope', sans-serif" }}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction icon="book_5" label="Issue Book Center" onClick={() => navigate('/issue-book')} />
              <QuickAction icon="assignment_return" label="Return Book" onClick={() => navigate('/return-book')} />
              <QuickAction icon="add_circle" label="Add New Book" onClick={() => navigate('/books')} />
              <QuickAction icon="bar_chart" label="View Reports" onClick={() => navigate('/reports')} />
            </div>
          </section>

          {/* Recently Added Books */}
          <section className="rounded-xl p-4 border bg-white flex-grow flex flex-col justify-between" style={{ borderColor: '#f0f0f0' }}>
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-bold" style={{ color: '#1E2A4A', fontFamily: "'Manrope', sans-serif" }}>
                  Recently Added Books
                </h3>
                <button 
                  onClick={() => navigate('/books')} 
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#9E0D0D' }}
                >
                  View all
                </button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <span className="material-symbols-outlined animate-spin mr-2" style={{ fontSize: 24 }}>progress_activity</span>
                  Loading books...
                </div>
              ) : books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <span className="material-symbols-outlined mb-2 text-slate-300" style={{ fontSize: 40 }}>library_books</span>
                  <p className="text-xs font-medium">No books in catalog yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs table-fixed">
                    <thead className="bg-slate-50/50 border-b border-slate-200/80">
                      <tr className="divide-x divide-slate-200">
                        <th className="py-2 px-2 font-bold text-[#881337] uppercase tracking-wider text-[10px] text-center w-12">Cover</th>
                        <th className="py-2 px-3 font-bold text-[#881337] uppercase tracking-wider text-[10px] text-center w-[42%]">Book Details</th>
                        <th className="py-2 px-2 font-bold text-[#881337] uppercase tracking-wider text-[10px] text-center w-[22%]">Category</th>
                        <th className="py-2 px-2 font-bold text-[#881337] uppercase tracking-wider text-[10px] text-center w-[18%]">Date</th>
                        <th className="py-2 px-2 font-bold text-[#881337] uppercase tracking-wider text-[10px] text-center w-[14%]">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...books]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 3)
                        .map((b) => (
                          <tr key={b._id} className="hover:bg-slate-50/40 transition-colors divide-x divide-slate-100">
                            <td className="py-2 px-2 text-center w-12">
                              <div className="flex justify-center">
                                {b.coverImageUrl ? (
                                  <img 
                                    src={b.coverImageUrl} 
                                    alt={b.title} 
                                    style={{ width: 28, height: 38 }}
                                    className="object-cover rounded shadow-xs hover:scale-105 transition-transform" 
                                  />
                                ) : (
                                  <div 
                                    style={{ width: 28, height: 38, background: getGradientForCategory(b.category) }}
                                    className="rounded flex flex-col items-center justify-center text-white select-none text-[7px] font-bold overflow-hidden shadow-xs" 
                                    title={b.title}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>menu_book</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-800 text-xs truncate block" title={b.title}>
                                {b.title}
                              </span>
                              <span className="font-medium text-slate-500 text-[9px] truncate block mt-0.5" title={b.author}>
                                by {b.author || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold border uppercase tracking-wider bg-red-50 text-[#9E0D0D] border-red-100 truncate inline-block max-w-full" title={b.category || 'General'}>
                                {b.category || 'General'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center text-slate-500 font-medium whitespace-nowrap text-[10px]">
                              {getRelativeDate(b.createdAt)}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-slate-700 text-xs">
                              {b.availableCopies}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT Column: Category Breakdown + Pending User Approvals */}
        <div className="lg:col-span-6 flex flex-col gap-4">

          {/* Category Breakdown */}
          <section className="rounded-xl p-4 border" style={{ backgroundColor: '#fff', borderColor: '#f0f0f0' }}>
            <h3 className="text-base font-bold mb-3" style={{ color: '#1E2A4A', fontFamily: "'Manrope', sans-serif" }}>
              Book Categories
            </h3>
            {loading ? (
              <div className="flex items-center justify-around py-4 animate-pulse">
                <div className="w-[125px] h-[125px] rounded-full bg-slate-100 flex-shrink-0" />
                <div className="space-y-2 flex-1 ml-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-3.5 bg-slate-100 rounded w-4/5" />
                  ))}
                </div>
              </div>
            ) : books.length === 0 ? (
              <p className="text-sm" style={{ color: '#94a3b8' }}>No data yet.</p>
            ) : (
              <div className="flex items-center justify-around">
                <div className="pl-6 flex-shrink-0">
                  <PieChart 
                    data={Object.entries(categories)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, count]) => ({
                        label: cat,
                        value: count,
                      }))} 
                    size={125}
                    centerText={Object.keys(categories).length}
                  />
                </div>
                <div className="space-y-0.5 flex-1 ml-14">
                  {Object.entries(categories)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, showAllCategories ? undefined : 6)
                    .map(([cat, catCopies], idx) => (
                      <div key={cat} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat).color }} />
                           <span className="font-medium text-xs" style={{ color: '#2C2C3E' }}>{cat}</span>
                        </div>
                        <span className="font-bold text-xs pr-10" style={{ color: catCopies > 0 ? '#166534' : '#b31b25' }}>
                          {catCopies}
                        </span>
                      </div>
                    ))}
                  {Object.keys(categories).length > 6 && (
                    <button onClick={() => setShowAllCategories(s => !s)} className="text-xs font-semibold mt-1" style={{ color: '#9E0D0D' }}>
                      {showAllCategories ? 'Show Less' : 'Show More'} ({Object.keys(categories).length - 6})
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Borrowing Chart */}
          {borrowingStats && (
            <HeroBorrowingChart
              yearlyStats={borrowingStats}
              onYearChange={handleBorrowYearChange}
              className="rounded-xl p-4 border bg-white flex-grow flex flex-col justify-between select-none text-slate-800"
              style={{ borderColor: '#f0f0f0' }}
            />
          )}
        </div>
      </div>

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
    </div>
  )
}
