// ==================================================================================
// 👤 MEMBER 1: LANDING PAGE
// WHAT DOES THIS FILE DO?
// This is the public homepage (Landing Page) of the Library Portal that anyone sees.
// It shows school details (Kawudulla MV), welcome messages, and a "Get Started" 
// button to redirect users to login or register.
// ==================================================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Keyframe Animations for Floating and Rotating effects */}
      <style>{`
        @keyframes float-badge {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes float-badge-reverse {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(8px) rotate(-1deg); }
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0) rotate(-2.5deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float-badge {
          animation: float-badge 5s ease-in-out infinite;
        }
        .animate-float-badge-reverse {
          animation: float-badge-reverse 5s ease-in-out infinite;
        }
        .animate-float-y {
          animation: float-y 5s ease-in-out infinite;
        }
        .animate-rotate-slow {
          animation: rotate-slow 40s linear infinite;
        }
      `}</style>

      {/* ===== LEFT BRANDING COLUMN (Landing Slogan & Action Button) ===== */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        <div className="max-w-xl">

          {/* Logo brand */}
          <div className="flex items-center gap-3.5 mb-10">
            <img src="/images/logo.png" alt="KMV School Logo" className="w-14 h-14 object-contain" />
            <div className="text-left">
              <h1 className="text-sm font-black tracking-tight" style={{ color: '#9E0D0D', fontFamily: "'Manrope', sans-serif" }}>
                KAWUDULLA MAHA VIDYALAYA
              </h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest leading-none mt-0.5">
                LIBRARY PORTAL
              </p>
            </div>
          </div>

          {/* Slogans / Slogan headers */}
          <h2 className="text-4xl sm:text-5xl font-black leading-[1.15] tracking-tight mb-5" style={{ color: '#1E2A4A', fontFamily: "'Manrope', sans-serif" }}>
            Smartly<br />
            Discover Knowledge<br />
            <span style={{
              background: 'linear-gradient(90deg, #9E0D0D 0%, #D97706 50%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>Borrow with Ease</span>
          </h2>

          {/* Slogans paragraphs */}
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Welcome to the official Kawudulla Maha Vidyalaya Library Portal. Search books by title, author, category, or ISBN barcode, borrow and return books with ease, track your borrowing history, and manage your library account anytime, from any device.
          </p>

          {/* CTA login redirect button */}
          <div>
            {/* -------------------------------------------------------------
                🔴 BUTTON: Main Landing Page "Login" Button
                To change the color of this button:
                - Modify "bg-[#9E0D0D]" to your color (e.g. bg-blue-600 or bg-[#1e40af])
                - Modify "hover:bg-[#7F0A0A]" for the hover state color
               ------------------------------------------------------------- */}
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-3.5 bg-[#9E0D0D] hover:bg-[#7F0A0A] active:scale-[0.98] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-[#9E0D0D]/30 hover:shadow-lg hover:shadow-[#9E0D0D]/40 transition-all duration-200 cursor-pointer flex items-center gap-2"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              <span>Login</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

        </div>
      </div>

      {/* ===== RIGHT GRAPHICS COLUMN (Aesthetic replica of reference photo) ===== */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col items-center justify-center relative overflow-hidden px-8 select-none border-l border-slate-100"
        style={{ backgroundColor: '#FCFDFE' }}
      >
        {/* Soft abstract blur blobs (Crimson & Amber tinted) */}
        <div className="absolute rounded-full filter blur-3xl opacity-30" style={{ width: 400, height: 400, background: 'rgba(158, 13, 13, 0.1)', top: '5%', left: '-5%' }} />
        <div className="absolute rounded-full filter blur-3xl opacity-30" style={{ width: 350, height: 350, background: 'rgba(217, 119, 6, 0.08)', bottom: '5%', right: '-5%' }} />

        {/* Outer composition container */}
        <div className="relative w-full max-w-xl h-[560px]">

          {/* 1. Crimson semicircle shape on top left */}
          <div className="absolute top-[100px] left-[40px] w-16 h-9 rounded-t-full transform -rotate-45 opacity-90 z-0" style={{ backgroundColor: '#9E0D0D' }} />

          {/* 2. Amber circle/arc ring segment on the right */}
          <div className="absolute right-[20px] top-[140px] w-36 h-36 border-[24px] rounded-full opacity-10 z-0 animate-rotate-slow" style={{ borderColor: '#D97706' }} />
          <div className="absolute right-[0px] top-[240px] w-28 h-28 rounded-full opacity-80 z-0" style={{ backgroundColor: '#D97706', clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)', transform: 'scale(1.25) rotate(45deg)' }} />

          {/* 3. Background Y-Axis Chart Grid on the bottom-left */}
          <div className="absolute bottom-[40px] left-[10px] flex flex-col justify-between h-[200px] border-l border-slate-200 pl-2.5 text-[10px] text-slate-400 font-mono z-0 select-none">
            <span>600</span>
            <span>500</span>
            <span>400</span>
            <span>300</span>
            <span>200</span>
            <span>100</span>
            {/* Crimson curve line */}
            <svg className="absolute left-0 bottom-0 w-[230px] h-[150px] overflow-visible" style={{ pointerEvents: 'none' }}>
              <path d="M 0 130 Q 60 30, 120 100 T 230 40" fill="none" stroke="#9E0D0D" strokeWidth="2.5" strokeDasharray="3 3" />
            </svg>
          </div>

          {/* 4. Large Main Visual Photo (Real photo of students) */}
          <div className="absolute bottom-[60px] left-[70px] right-[20px] h-[300px] rounded-[32px] overflow-hidden shadow-2xl border-[8px] border-white z-10 bg-white">
            <img
              src="/images/library_illustration.jpg"
              alt="Students Studying"
              className="w-full h-full object-cover"
            />
          </div>

          {/* 5. Double-Pane Calendar/Booking Widget (Top Left, overlays photo) */}
          <div className="absolute top-[75px] left-[0px] bg-white shadow-2xl rounded-2xl p-4 border border-slate-100/80 flex gap-4 w-[360px] z-20 animate-float-y">
            {/* Left Pane: Month grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-[10px] font-extrabold text-slate-700">March 2026</span>
                <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-slate-400 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
                {Array.from({ length: 28 }).map((_, idx) => {
                  const isSelected = idx + 1 === 21;
                  return (
                    <span
                      key={idx}
                      className={`p-0.5 rounded flex items-center justify-center text-[8px] ${isSelected ? 'text-white font-bold' : ''}`}
                      style={isSelected ? { backgroundColor: '#9E0D0D' } : {}}
                    >
                      {idx + 1}
                    </span>
                  );
                })}
              </div>
            </div>
            {/* Divider line */}
            <div className="w-px bg-slate-100 self-stretch" />
            {/* Right Pane: Slot Details */}
            <div className="w-[140px] flex flex-col justify-between text-left">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Active Checkouts</p>
                <div className="space-y-1">
                  <div className="bg-slate-50 rounded p-1 text-[9px] font-bold text-slate-700 flex justify-between">
                    <span>Due Soon</span>
                    <span style={{ color: '#D97706' }}>02</span>
                  </div>
                  <div className="bg-slate-50 rounded p-1 text-[9px] font-bold text-slate-700 flex justify-between">
                    <span>Overdue</span>
                    <span style={{ color: '#9E0D0D' }}>00</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="w-full py-1.5 text-white rounded-lg text-[9px] font-extrabold tracking-wider transition-colors uppercase mt-1.5 bg-[#9E0D0D] hover:bg-[#7F0A0A]"
              >
                Active Slot
              </button>
            </div>
          </div>

          {/* 6. Floating pill: Automatic Reminders (Top Right) */}
          <div className="absolute top-[80px] right-[0px] shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border z-20" style={{ backgroundColor: '#FDF2F2', borderColor: '#FEE2E2', color: '#9E0D0D' }}>
            <span className="material-symbols-outlined text-[15px] font-bold" style={{ color: '#9E0D0D' }}>notifications</span>
            <span className="text-[10px] font-bold tracking-wide">Automatic Reminders</span>
          </div>

          {/* 7. Floating badge: Increases Knowledge (Left Center) */}
          <div className="absolute left-[-30px] top-[260px] shadow-xl rounded-xl px-4 py-3 border flex items-center gap-2.5 z-30 animate-float-badge" style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A', color: '#92400E' }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#D97706' }}>
              <span className="material-symbols-outlined text-[15px]">menu_book</span>
            </div>
            <span className="text-[10px] font-extrabold tracking-wide">Increases Knowledge</span>
          </div>

          {/* 8. Floating badge: Reduces Conflicts (Bottom Center) */}
          <div className="absolute bottom-[20px] left-[55%] -translate-x-1/2 shadow-xl rounded-xl px-5 py-3 border flex items-center gap-2.5 z-20 animate-float-badge-reverse" style={{ backgroundColor: '#FDF2F2', borderColor: '#FEE2E2', color: '#7F0A0A' }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#9E0D0D' }}>
              <span className="material-symbols-outlined text-[15px]">hourglass_empty</span>
            </div>
            <span className="text-[10px] font-extrabold tracking-wide">Reduces Conflicts</span>
          </div>

        </div>
      </div>

    </div>
  );
}
