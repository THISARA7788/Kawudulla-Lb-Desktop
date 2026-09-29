// =========================================================================
// WHAT DOES THIS FILE DO?
// This is the top dashboard header panel. It displays a menu toggle button
// (hamburger menu) on mobile/tablet viewports, fetches and shows real-time
// unread notification badge alerts, and links directly to the member profile.
// =========================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import NotificationsPanel from './NotificationsPanel'
import SyncBadge from './SyncBadge'
import api from '../../api/axios'

export default function TopBar({ onMenuToggle }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])

  const path = location.pathname
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const d = new Date();
  const formattedDate = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

  let pageTitle = ''
  if (path.startsWith('/dashboard')) {
    pageTitle = user?.role === 'librarian' ? 'Librarian Dashboard' : user?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'
  } else if (path.startsWith('/books')) {
    pageTitle = user?.role === 'librarian' ? 'Book Catalogue' : 'Browse Books'
  } else if (path.startsWith('/my-borrowings')) {
    pageTitle = 'My Borrowings'
  } else if (path.startsWith('/my-fines')) {
    pageTitle = 'My Fines'
  } else if (path.startsWith('/book-requests')) {
    pageTitle = 'Requested Books'
  } else if (path.startsWith('/issue-book')) {
    pageTitle = 'Issue Book Center'
  } else if (path.startsWith('/return-book')) {
    pageTitle = 'Return Book'
  } else if (path.startsWith('/renew-book')) {
    pageTitle = 'Renew Book'
  } else if (path.startsWith('/pending-registration')) {
    pageTitle = 'Pending Registration'
  } else if (path.startsWith('/members')) {
    pageTitle = 'Members List'
  } else if (path.startsWith('/circulation')) {
    pageTitle = 'Circulation'
  } else if (path.startsWith('/fines')) {
    pageTitle = 'Fines Management'
  } else if (path.startsWith('/reports')) {
    pageTitle = 'Library Reports'
  } else if (path.startsWith('/qr-scanner')) {
    pageTitle = 'QR Scanner'
  } else if (path.startsWith('/profile')) {
    pageTitle = 'Profile & Settings'
  } else {
    const seg = path.split('/').filter(Boolean)[0] || ''
    pageTitle = seg ? seg.charAt(0).toUpperCase() + seg.slice(1).replace('-', ' ') : 'Library System'
  }

  const pageSubtitle = formattedDate

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      if (res.data) {
        setNotifications(res.data.notifications || [])
        setUnreadCount(res.data.unreadCount || 0)
      }
    } catch (e) { /* ignore */ }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
    } catch (e) { /* ignore */ }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
    } catch (e) { /* ignore */ }
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    loadNotifications()
  }

  return (
    <>
      {/* Fullscreen Blur Backdrop covering Sidebar (z-30), Header, and main content (z-0) */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40 transition-opacity animate-fadeIn cursor-pointer"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowNotifications(false)}
        />
      )}

      <header
        className={`fixed top-0 right-0 left-0 lg:left-64 h-16 flex items-center justify-between pl-4 lg:pl-8 pr-3 lg:pr-4 transition-all duration-200 ${
          showNotifications ? 'z-50' : 'z-30'
        }`}
        style={{
          backgroundColor: showNotifications ? 'transparent' : '#ffffff',
          borderBottom: showNotifications ? '1px solid transparent' : '1px solid #e2e8f0',
        }}
      >
        <div 
          className="flex items-center gap-3 transition-all duration-300"
          style={{
            filter: showNotifications ? 'blur(6px)' : 'none',
            opacity: showNotifications ? 0.35 : 1,
            pointerEvents: showNotifications ? 'none' : 'auto',
            userSelect: showNotifications ? 'none' : 'auto',
          }}
        >
          {/* Hamburger menu on Mobile / Tablets */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            style={{ color: '#4F5B7D' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24, verticalAlign: 'middle' }}>menu</span>
          </button>

          {/* Dynamic Page Title on Left */}
          {pageTitle && (
            <div className="hidden sm:flex flex-col justify-center">
              <h1 className="text-xl font-extrabold tracking-tight leading-tight text-slate-800" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {pageTitle}
              </h1>
              {pageSubtitle && (
                <p className="text-xs font-normal leading-tight mt-0.5 hidden md:block text-slate-400">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <SyncBadge />
          <div className="relative z-50">
            <button
              onClick={toggleNotifications}
              className={`p-2 transition-all rounded-xl cursor-pointer ${
                showNotifications
                  ? 'bg-white text-[#9E0D0D] shadow-lg ring-2 ring-white/50'
                  : 'hover:bg-slate-100 text-[#4F5B7D]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, verticalAlign: 'middle' }}>notifications</span>
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1 pointer-events-none shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}

            {showNotifications && (
              <NotificationsPanel
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onRefresh={loadNotifications}
              />
            )}
          </div>
        </div>
      </header>
    </>
  )
}
