import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const formContainerRef = useRef(null);

  const { token } = useParams();

  useEffect(() => {
    if (error && formContainerRef.current) {
      formContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200', width: '0%' };
    let score = 0;
    
    // Length check
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(pass)) score += 1; // Has uppercase
    if (/[a-z]/.test(pass)) score += 1; // Has lowercase
    if (/[0-9]/.test(pass)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Has special char
    
    if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500', width: '33%' };
    if (score <= 4) return { score, text: 'Medium', color: 'bg-amber-500', width: '66%' };
    return { score, text: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setError('Password must contain uppercase, lowercase, numbers, and special symbols');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50" style={{ fontFamily: "'Poppins', sans-serif" }}>
      
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

      {/* ===== LEFT SHOWCASE PANEL (Aesthetic replica of reference photo) ===== */}
      <div
        className="hidden lg:flex lg:w-[58%] flex-col items-center justify-center relative overflow-hidden px-8 select-none h-full border-r border-slate-100"
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
              <button type="button" className="w-full py-1.5 text-white rounded-lg text-[9px] font-extrabold tracking-wider transition-colors uppercase mt-1.5 bg-[#9E0D0D] hover:bg-[#7F0A0A]">
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

      {/* ===== RIGHT FORM PANEL (Clean forms layout with card frame) ===== */}
      <div ref={formContainerRef} className="flex-1 flex items-center justify-center bg-[#F8FAFC] px-4 sm:px-6 py-12 h-full overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100/50 p-8 sm:p-10">

          {/* Logo brand and greetings */}
          <div className="mb-8 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3.5 mb-6">
              <img src="/images/logo.png" alt="KMV Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div className="text-left">
                <h1 className="text-base font-black tracking-tight" style={{ color: '#1E2A4A', fontFamily: "'Manrope', sans-serif" }}>KAWUDULLA MAHA VIDYALAYA</h1>
                <p className="text-[11px] font-bold tracking-widest leading-none mt-0.5 font-manrope" style={{ color: '#9E0D0D', fontFamily: "'Manrope', sans-serif" }}>LIBRARY PORTAL</p>
              </div>
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-1" style={{ color: '#1E2A4A', fontFamily: "'Manrope', sans-serif" }}>Reset Password</h2>
            <p className="text-sm text-slate-400">Enter your new password below</p>
          </div>

          {/* Error notifications */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-xs font-semibold text-center bg-red-50 border border-red-200 text-red-600">
              {error}
            </div>
          )}
          
          {/* Success notification */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl text-xs font-semibold text-center bg-emerald-50 border border-emerald-200 text-emerald-600">
              ✓ {successMessage}
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password field */}
              <div>
                <label className="block text-xs font-bold text-[#1E2A4A] uppercase tracking-wider mb-2">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9E0D0D] transition-colors duration-200">
                    <span className="material-symbols-outlined text-[19px]">lock</span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold placeholder-slate-500 focus:bg-white focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 outline-none transition-all duration-200"
                    style={{ fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 transition-colors"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>

                {/* Password Strength Indicator Bar */}
                {newPassword && (
                  <div className="mt-2.5 px-1 space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between items-center text-[10px] font-extrabold select-none">
                      <span className="text-slate-400 uppercase tracking-wider">Password Security</span>
                      <span 
                        className="text-[8.5px] uppercase font-black px-2 py-0.5 rounded-full border shadow-sm transition-all duration-300"
                        style={
                          getPasswordStrength(newPassword).text === 'Weak' 
                            ? { backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }
                            : getPasswordStrength(newPassword).text === 'Medium'
                            ? { backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.2)' }
                            : { backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.2)' }
                        }
                      >
                        {getPasswordStrength(newPassword).text}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getPasswordStrength(newPassword).color}`}
                        style={{ width: getPasswordStrength(newPassword).width }}
                      />
                    </div>

                    {/* Dynamic Password Suggestions Checklist */}
                    {newPassword && !(newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) && (
                      <div className="mt-2.5 text-[10px] space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100/50 select-none animate-fadeIn">
                        <p className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-500 mb-0.5">Password Requirements:</p>
                        <div className="space-y-1.5 font-semibold text-slate-500">
                          {!(newPassword.length >= 8) && (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <span className="material-symbols-outlined text-[12px] font-bold text-slate-350">circle</span>
                              <span>At least 8 characters</span>
                            </div>
                          )}
                          
                          {!/[A-Z]/.test(newPassword) && (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <span className="material-symbols-outlined text-[12px] font-bold text-slate-350">circle</span>
                              <span>At least one uppercase letter (A-Z)</span>
                            </div>
                          )}

                          {!/[a-z]/.test(newPassword) && (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <span className="material-symbols-outlined text-[12px] font-bold text-slate-350">circle</span>
                              <span>At least one lowercase letter (a-z)</span>
                            </div>
                          )}

                          {!/[0-9]/.test(newPassword) && (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <span className="material-symbols-outlined text-[12px] font-bold text-slate-350">circle</span>
                              <span>At least one number (0-9)</span>
                            </div>
                          )}

                          {!/[^A-Za-z0-9]/.test(newPassword) && (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <span className="material-symbols-outlined text-[12px] font-bold text-slate-350">circle</span>
                              <span>At least one special symbol (e.g. @, #, $, %)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password field */}
              <div>
                <label className="block text-xs font-bold text-[#1E2A4A] uppercase tracking-wider mb-2">Confirm New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9E0D0D] transition-colors duration-200">
                    <span className="material-symbols-outlined text-[19px]">lock</span>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold placeholder-slate-500 focus:bg-white focus:border-[#9E0D0D] focus:ring-4 focus:ring-[#9E0D0D]/10 outline-none transition-all duration-200"
                    style={{ fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-655 transition-colors"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>

                {/* Confirm Password Verification Box */}
                {confirmPassword && (
                  <div className="mt-2 px-1">
                    <div className="flex justify-between items-center text-[10px] font-extrabold select-none">
                      <span className="text-slate-400 uppercase tracking-wider">Password Match</span>
                      <span 
                        className="text-[8.5px] uppercase font-black px-2 py-0.5 rounded-full border shadow-sm"
                        style={
                          newPassword !== confirmPassword 
                            ? { backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }
                            : { backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.2)' }
                        }
                      >
                        {newPassword !== confirmPassword ? 'Mismatch' : 'Matched'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#9E0D0D] hover:bg-[#7F0A0A] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-900/10 active:scale-[0.98] transform transition-all duration-150"
                style={{ cursor: 'pointer' }}
              >
                {loading ? 'Resetting password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login link */}
          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-block w-full py-3.5 text-center border-2 border-slate-200 hover:border-[#9E0D0D] text-slate-500 hover:text-[#9E0D0D] rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-white"
            >
              Back to Login
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ResetPassword;
