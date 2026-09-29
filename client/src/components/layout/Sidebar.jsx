// =========================================================================
// WHAT DOES THIS FILE DO?
// This is the left-aligned navigation drawer panel for the library system.
// It maps lists of pages (like Books, Issues, Fines, Scanner) and dynamically
// highlights the active menu link using path matching. Supports mobile
// devices by sliding off-screen using open/close drawer states.
// =========================================================================

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import api from '../../api/axios'

const librarianNavItems = [
  { icon: "grid_view", label: "Dashboard", route: "/dashboard" },
  { icon: "library_books", label: "Book Catalogue", route: "/books" },
  { icon: "book_5", label: "Issue Book", route: "/issue-book" },
  { icon: "assignment_return", label: "Return Book", route: "/return-book" },
  { icon: "autorenew", label: "Renew Book", route: "/renew-book" },
  { icon: "person_check", label: "Pending Registration", route: "/pending-registration" },
  { icon: "group", label: "Members", route: "/members" },
  { icon: "history_edu", label: "Circulation", route: "/circulation" },
  { icon: "payments", label: "Fines", route: "/fines" },
  { icon: "assessment", label: "Reports", route: "/reports" },
]

const memberNavItems = [
  { icon: "grid_view", label: "Dashboard", route: "/dashboard" },
  { icon: "library_books", label: "Browse Books", route: "/books" },
  { icon: "history_edu", label: "My Borrowings", route: "/my-borrowings" },
  { icon: "payments", label: "My Fines", route: "/my-fines" },
  { icon: "mark_email_unread", label: "Requested Books", route: "/book-requests" },
]

const ms = {
  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
}

const msOutline = {
  fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (user?.role !== 'librarian') return

    const fetchPending = async () => {
      try {
        const res = await api.get('/auth/pending')
        if (res.data && typeof res.data.count === 'number') {
          setPendingCount(res.data.count)
        }
      } catch (err) {
        console.error('Error fetching pending registrations:', err)
      }
    }

    fetchPending()
    const interval = setInterval(fetchPending, 30000)
    return () => clearInterval(interval)
  }, [user])

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const handleNav = (route) => {
    if (route && route !== '#') {
      navigate(route)
      if (typeof setIsOpen === 'function') {
        setIsOpen(false)
      }
    }
  }
  const isProfileActive = location.pathname === '/profile'

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-[#3B0000] ${
        isOpen ? 'z-50 translate-x-0' : 'z-30 -translate-x-full lg:translate-x-0'
      }`}
      style={{ 
        padding: '1rem', 
        fontFamily: "'Inter', sans-serif",
        background: 'linear-gradient(to bottom, #4C0000 0%, #150000 100%)'
      }}
    >
      {/* Profile / Brand Header */}
      <div className="flex items-center justify-between gap-3 px-2 mb-8">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="School Logo"
            className="w-10 h-10 object-contain flex-shrink-0 transition-transform duration-300 hover:scale-105"
          />
          <div className="flex flex-col select-none">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '0.05em' }}>
              KAWUDULLA MV
            </h2>
            <span className="text-[10px] font-black text-[#EAB308] tracking-widest uppercase mt-0.5" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '0.15em' }}>
              LIBRARY PORTAL
            </span>
          </div>
        </div>
        {/* Close mobile drawer toggle */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 rounded-xl hover:bg-white/10"
          style={{ color: '#CBD5E1' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
        {(user?.role === 'librarian' ? librarianNavItems : memberNavItems).map((item) => {
          const isActive = item.route !== '#' && (
            location.pathname === item.route || 
            (item.route !== '/dashboard' && location.pathname.startsWith(item.route))
          )
          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.route)}
              className={`flex items-center gap-3 transition-all duration-300 text-sm w-full text-left cursor-pointer border border-transparent ${
                isActive 
                  ? 'font-bold bg-[#9E0D0D] text-white shadow-lg shadow-black/20' 
                  : 'font-semibold text-[#CBD5E1] hover:text-white hover:bg-white/5'
              }`}
              style={{
                padding: '0.65rem 0.85rem',
                margin: '0',
                borderRadius: '12px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'inherit', ...ms }}>{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.route === '/pending-registration' && pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Info Profile Card & Dropdown Chevron */}
      <div className="mt-auto pt-3 border-t border-[#3B0000] flex items-center justify-between gap-2 px-1">
        <div 
          onClick={() => handleNav('/profile')}
          className={`flex items-center gap-3 cursor-pointer p-1.5 rounded-xl flex-1 min-w-0 transition-all duration-300 ${
            isProfileActive 
              ? 'bg-[#9E0D0D] text-white shadow-lg shadow-black/20' 
              : 'hover:bg-white/5'
          }`}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 transition-all duration-300 text-white" style={{ background: 'linear-gradient(135deg, #9E0D0D 0%, #4C0000 100%)' }}>
            {getInitials(user?.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs truncate leading-tight font-bold text-white">
              {user?.name || 'User'}
            </span>
            <span className="text-[10px] capitalize mt-0.5 leading-none text-[#CBD5E1] font-semibold">
              {user?.role || 'Member'}
            </span>
          </div>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={logout}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#F87171] hover:text-white hover:bg-white/5 transition-all cursor-pointer flex-shrink-0"
          title="Logout"
        >
          <span className="material-symbols-outlined text-lg" style={msOutline}>logout</span>
        </button>
      </div>
    </aside>
  )
}
