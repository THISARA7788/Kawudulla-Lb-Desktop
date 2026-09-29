import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function ProfileSettings() {
  const { user, token, login } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [role] = useState(user?.role || '');
  const [grade, setGrade] = useState(user?.grade || '');

  const [loading, setLoading] = useState(false);

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Cloud Sync & Disaster Recovery state
  const [syncStatus, setSyncStatus] = useState(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setGrade(user.grade || '');
    }
  }, [user]);

  // Fetch Cloud status
  const fetchSyncStatus = async () => {
    try {
      const res = await api.get('/sync/status');
      setSyncStatus(res.data);
    } catch (e) {
      console.warn('Sync status fetch error:', e.message);
    }
  };

  useEffect(() => {
    if (user?.role === 'librarian') {
      fetchSyncStatus();
      const interval = setInterval(fetchSyncStatus, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/auth/me', { name: name.trim(), grade: grade.trim() });
      const updatedUser = res.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(updatedUser, token);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200', width: '0%' };
    let score = 0;
    
    // Length check
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(pass)) score += 1; // Has uppercase
    if (/[a-z]/.test(pass)) score += 1; // Has lowercase
    if (/[0-9]/.test(pass)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Has special char
    
    if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500', width: '33%' };
    if (score <= 4) return { score, text: 'Medium', color: 'bg-amber-500', width: '66%' };
    return { score, text: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      showToast('Password must contain uppercase, lowercase, numbers, and special symbols.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleManualBackup = async () => {
    setBackingUp(true);
    try {
      const res = await api.post('/sync/backup');
      showToast(`Cloud backup complete! Saved ${res.data?.totalPushed || 0} records to Cloud Atlas.`, 'success');
      fetchSyncStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Backup failed. Check internet connection.', 'error');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    setRestoring(true);
    setShowRestoreModal(false);
    try {
      const res = await api.post('/sync/restore');
      showToast(`Restore complete! Loaded ${res.data?.totalRestored || 0} records from Cloud Atlas onto this computer.`, 'success');
      fetchSyncStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Restore failed. Check cloud connection.', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (e) {
      return isoStr;
    }
  };

  const pwStrength = getPasswordStrength(newPassword);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Page Header */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Profile & Settings</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">Manage your personal profile, credentials, and system data</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                role === 'librarian' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                role === 'teacher' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid for Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Profile Information */}
          <div className="rounded-2xl border border-slate-200/80 border-l-4 border-l-[#9E0D0D] bg-white p-6 shadow-2xs flex flex-col h-full">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#9E0D0D]">
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Profile Information</h3>
                <p className="text-[11px] text-slate-400 font-medium">Update your account name and information</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-[#9E0D0D] focus:ring-3 focus:ring-[#9E0D0D]/10 transition-all duration-150"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                      lock
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Permanently linked to your library credentials.</p>
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Grade / Class
                    </label>
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-[#9E0D0D] focus:ring-3 focus:ring-[#9E0D0D]/10 transition-all duration-150"
                      placeholder="e.g. Grade 10-A"
                    />
                  </div>
                )}
              </div>

              <div className="pt-6 mt-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-md shadow-black/25 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-white/10 hover:border-white/25 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #4C0000 0%, #150000 100%)',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px] text-white">progress_activity</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-white">save</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Security & Change Password */}
          <div className="rounded-2xl border border-slate-200/80 border-l-4 border-l-[#9E0D0D] bg-white p-6 shadow-2xs flex flex-col h-full">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#9E0D0D]">
                <span className="material-symbols-outlined text-[22px]">lock_reset</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Security & Password</h3>
                <p className="text-[11px] text-slate-400 font-medium">Update your account login password</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-[#9E0D0D] focus:ring-3 focus:ring-[#9E0D0D]/10 transition-all duration-150"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#9E0D0D] focus:outline-none transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showCurrentPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-[#9E0D0D] focus:ring-3 focus:ring-[#9E0D0D]/10 transition-all duration-150"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#9E0D0D] focus:outline-none transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showNewPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2.5 space-y-1.5 px-0.5">
                      <div className="flex justify-between items-center text-[10px] font-extrabold select-none">
                        <span className="text-slate-400 uppercase tracking-wider">Security Score</span>
                        <span 
                          className="text-[8.5px] uppercase font-black px-2 py-0.5 rounded-full border shadow-xs"
                          style={
                            pwStrength.score <= 2 
                              ? { backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }
                              : pwStrength.score <= 4 
                              ? { backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.2)' }
                              : { backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.2)' }
                          }
                        >
                          {pwStrength.text} Security
                        </span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-200/60">
                        <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`} style={{ width: pwStrength.width }}></div>
                      </div>

                      {/* Rule checklist */}
                      {pwStrength.score < 5 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80">
                          <p className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider mb-1">To ensure security, please include:</p>
                          <div className="grid grid-cols-1 gap-1">
                            {newPassword.length < 8 && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[12px] font-bold text-slate-400">circle</span>
                                <span>At least 8 characters long</span>
                              </div>
                            )}
                            
                            {!/[A-Z]/.test(newPassword) && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[12px] font-bold text-slate-400">circle</span>
                                <span>At least one uppercase letter (A-Z)</span>
                              </div>
                            )}

                            {!/[a-z]/.test(newPassword) && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[12px] font-bold text-slate-400">circle</span>
                                <span>At least one lowercase letter (a-z)</span>
                              </div>
                            )}

                            {!/[0-9]/.test(newPassword) && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[12px] font-bold text-slate-400">circle</span>
                                <span>At least one number (0-9)</span>
                              </div>
                            )}

                            {!/[^A-Za-z0-9]/.test(newPassword) && (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[12px] font-bold text-slate-400">circle</span>
                                <span>At least one special symbol (e.g. @, #, $, %)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs font-semibold rounded-xl outline-none border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-[#9E0D0D] focus:ring-3 focus:ring-[#9E0D0D]/10 transition-all duration-150"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#9E0D0D] focus:outline-none transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Confirm Password Verification Box */}
                  {confirmPassword && (
                    <div className="mt-2 px-0.5">
                      <div className="flex justify-between items-center text-[10px] font-extrabold select-none">
                        <span className="text-slate-400 uppercase tracking-wider">Password Match</span>
                        <span 
                          className="text-[8.5px] uppercase font-black px-2 py-0.5 rounded-full border shadow-xs"
                          style={
                            newPassword !== confirmPassword 
                              ? { backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }
                              : { backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.2)' }
                          }
                        >
                          {newPassword !== confirmPassword ? 'Does Not Match' : 'Matches'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-auto">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-md shadow-black/25 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-white/10 hover:border-white/25 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #4C0000 0%, #150000 100%)',
                  }}
                >
                  {changingPassword ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px] text-white">progress_activity</span>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-white">key</span>
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Card 3: Cloud Backup & Recovery (Librarian Exclusive) */}
        {role === 'librarian' && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-800">Cloud Backup</h3>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      syncStatus?.isOnline
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${syncStatus?.isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {syncStatus?.isOnline ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Last Backup: <span className="font-semibold text-slate-600">{formatDateTime(syncStatus?.lastBackupTime)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleManualBackup}
                  disabled={backingUp || restoring}
                  className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 border border-slate-200"
                >
                  {backingUp ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px] text-sky-600">progress_activity</span>
                      <span>Backing Up...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px] text-sky-600">backup</span>
                      <span>Backup Now</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRestoreModal(true)}
                  disabled={backingUp || restoring}
                  className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #9E0D0D 0%, #4C0000 100%)',
                  }}
                >
                  {restoring ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px] text-white">progress_activity</span>
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px] text-white">cloud_download</span>
                      <span>Restore from Cloud</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal for Restore (No Native Alerts) */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#9E0D0D] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">cloud_download</span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-slate-800">Restore Library from Cloud?</h3>
              <p className="text-xs text-slate-500">
                This will download all books, members, and transactions from Cloud Atlas onto this computer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="py-2 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestoreFromCloud}
                className="py-2 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-sm active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #9E0D0D 0%, #4C0000 100%)',
                }}
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Animated Toast Notifications */}
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
          <div
            className={`toast-popup pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-xl text-white shadow-lg border ${
              toast.type === 'error'
                ? 'bg-rose-600 border-rose-500/50'
                : toast.type === 'delete'
                ? 'bg-rose-700 border-rose-600/50'
                : 'bg-[#9E0D0D] border-[#7F0A0A]'
            }`}
          >
            <span className="material-symbols-outlined text-white font-bold" style={{ fontSize: 18 }}>
              {toast.type === 'error' ? 'warning' : toast.type === 'delete' ? 'delete_forever' : 'check_circle'}
            </span>
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
