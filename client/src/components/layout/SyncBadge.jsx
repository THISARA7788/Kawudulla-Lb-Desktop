import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function SyncBadge() {
  const [statusData, setStatusData] = useState({
    status: 'idle',
    isOnline: false,
    lastBackupTime: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/sync/status');
      if (res.data) {
        setStatusData(res.data);
      }
    } catch (e) {
      setStatusData((prev) => ({ ...prev, status: 'offline', isOnline: false }));
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // 10s poll for responsive status changes
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (isSyncing || statusData.status === 'backing_up') return;
    setIsSyncing(true);
    setToastMessage({ text: 'Backing up to cloud...', type: 'loading' });

    try {
      const res = await api.post('/sync/backup');
      if (res.data && res.data.success) {
        setToastMessage({ text: `Backup complete (${res.data.totalPushed || 0} records)`, type: 'success' });
        await fetchStatus();
      } else {
        setToastMessage({ text: 'Cloud is up to date', type: 'success' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Cloud unreachable (offline)';
      setToastMessage({ text: msg, type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  const formatLastSync = (isoString) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  const isBackingUp = isSyncing || statusData.status === 'backing_up';
  const isConnected = statusData.isOnline;
  const lastSyncTime = formatLastSync(statusData.lastBackupTime || statusData.lastSyncTime);

  return (
    <div className="relative flex items-center select-none">
      {/* Dynamic Sync Status Button */}
      <button
        onClick={handleManualSync}
        disabled={isBackingUp}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`p-2 rounded-xl transition-all cursor-pointer relative flex items-center justify-center ${
          isBackingUp
            ? 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-300/40'
            : isConnected
            ? 'hover:bg-emerald-50 text-emerald-600'
            : 'hover:bg-slate-100 text-slate-400'
        }`}
        aria-label="Cloud sync status"
        title={isBackingUp ? 'Backing up to cloud...' : isConnected ? 'Cloud Connected (Click to sync)' : 'Offline'}
      >
        {/* Not Backing up: green cloud_done */}
        {!isBackingUp && isConnected && (
          <span
            className="material-symbols-outlined text-emerald-600 transition-transform duration-300"
            style={{ fontSize: 22, verticalAlign: 'middle' }}
          >
            cloud_done
          </span>
        )}

        {/* Backing up Moment: green cloud_done + sync spinner */}
        {isBackingUp && (
          <div className="relative flex items-center justify-center">
            <span
              className="material-symbols-outlined text-emerald-600 opacity-75"
              style={{ fontSize: 22, verticalAlign: 'middle' }}
            >
              cloud_done
            </span>
            <span
              className="material-symbols-outlined text-emerald-700 animate-spin absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs"
              style={{ fontSize: 13, lineHeight: 1 }}
            >
              sync
            </span>
          </div>
        )}

        {/* Offline Moment: gray cloud_off */}
        {!isConnected && !isBackingUp && (
          <span
            className="material-symbols-outlined text-slate-400 transition-transform duration-300"
            style={{ fontSize: 22, verticalAlign: 'middle' }}
          >
            cloud_off
          </span>
        )}
      </button>

      {/* Sleek Floating Hover Tooltip */}
      {showTooltip && !toastMessage && (
        <div className="absolute top-11 right-0 z-50 pointer-events-none bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-xl border border-slate-700/80 whitespace-nowrap animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isBackingUp ? 'bg-amber-400 animate-ping' : isConnected ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            <span>{isBackingUp ? 'Backing up to cloud...' : isConnected ? (lastSyncTime ? `Synced • ${lastSyncTime}` : 'Cloud Synced') : 'Offline Mode'}</span>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="absolute top-11 right-0 z-50 whitespace-nowrap bg-slate-900 text-white text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <span
            className={`material-symbols-outlined text-[16px] ${
              toastMessage.type === 'loading'
                ? 'animate-spin text-amber-400'
                : toastMessage.type === 'success'
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {toastMessage.type === 'loading' ? 'sync' : toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-semibold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

