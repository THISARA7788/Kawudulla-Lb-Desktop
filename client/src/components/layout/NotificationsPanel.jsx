import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const TYPE_CONFIG = {
  book_borrowed: { icon: 'menu_book', label: 'Book Borrowed', color: '#3b82f6' },
  book_returned: { icon: 'assignment_returned', label: 'Book Returned', color: '#22c55e' },
  overdue: { icon: 'warning', label: 'Overdue', color: '#ef4444' },
  fine: { icon: 'payments', label: 'Fine Issued', color: '#f59e0b' },
  registration_approved: { icon: 'check_circle', label: 'Registration Approved', color: '#22c55e' },
  registration_rejected: { icon: 'cancel', label: 'Registration Rejected', color: '#ef4444' },
  book_requested: { icon: 'mark_email_unread', label: 'Book Requested', color: '#f59e0b' },
  book_request_approved: { icon: 'check_circle', label: 'Request Approved', color: '#22c55e' },
  book_request_declined: { icon: 'cancel', label: 'Request Declined', color: '#ef4444' },
  general: { icon: 'notifications', label: 'Notification', color: '#8b5cf6' }
}

export default function NotificationsPanel({ notifications, onClose, onMarkRead, onMarkAllRead, onRefresh }) {
  const nodeRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    function handleClickOutside(e) {
      if (nodeRef.current && !nodeRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      onRefresh()
    } catch (e) { /* ignore */ }
  }

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      await onMarkRead(n._id)
      onRefresh()
    }
    onClose()
    
    // Route to appropriate section
    if (n.type.startsWith('book_request')) {
      navigate('/book-requests')
    } else if (n.type === 'fine') {
      navigate(user?.role === 'librarian' ? '/fines' : '/my-fines')
    } else if (['book_borrowed', 'book_returned', 'overdue'].includes(n.type)) {
      navigate(user?.role === 'librarian' ? '/circulation' : '/my-borrowings')
    } else if (n.type.startsWith('registration')) {
      navigate(user?.role === 'librarian' ? '/pending-registration' : '/dashboard')
    }
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const config = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.general

  return (
    <div
      ref={nodeRef}
      className="absolute top-12 right-0 w-[360px] max-h-[500px] overflow-hidden rounded-2xl shadow-2xl z-50 border border-slate-100 bg-slate-50"
      style={{ 
        animation: 'fadeIn .15s ease-out', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 20px 1px rgba(74, 2, 2, 0.15)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#4A0202]" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
        <h3 className="text-white font-bold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.read) && (
            <button onClick={async () => { await onMarkAllRead(); onRefresh() }} className="text-xs font-bold hover:underline" style={{ color: '#EAB308' }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1.5 transition-colors hover:bg-white/10 rounded-lg text-slate-300 hover:text-white">
            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle' }}>close</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[420px] bg-slate-50 divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50">
            <span className="material-symbols-outlined mb-2 text-slate-400" style={{ fontSize: 40 }}>notifications_none</span>
            <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => {
            const c = config(n.type)
            return (
              <div
                key={n._id}
                className={`flex items-start gap-3 px-4 py-3.5 transition-colors group ${!n.read ? 'bg-white' : 'bg-transparent hover:bg-white/60'}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center bg-[#4A0202]">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>{c.icon}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-extrabold tracking-wider uppercase text-slate-700">{c.label}</p>
                    {!n.read && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />}
                  </div>
                  <p className="text-xs font-semibold leading-snug mt-0.5 text-slate-800 whitespace-pre-wrap">{n.message}</p>
                  <p className="text-[10px] font-bold mt-1 text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n._id) }}
                  className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                  style={{ color: '#94a3b8' }}
                  title="Delete notification"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>delete</span>
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
