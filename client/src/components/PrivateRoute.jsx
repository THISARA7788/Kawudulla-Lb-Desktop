import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  // If not authenticated at all, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but account is not active, show blocked message
  if (user?.status && user.status !== 'active') {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#F5F3FC' }}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-slate-100">
          <div style={{ color: '#D9645E', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined text-6xl">block</span>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1245' }}>Account {user.status}</h2>
          <p className="mb-6" style={{ color: '#64748b' }}>
            {user.status === 'pending'
              ? 'Your account is pending librarian approval. Please wait for approval before accessing the system.'
              : 'Your account has been rejected. Please contact the librarian for assistance.'}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-all cursor-pointer"
            style={{ background: '#1a1245' }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // If route is restricted to specific roles, check role
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;
