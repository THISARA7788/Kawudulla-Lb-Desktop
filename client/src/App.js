// =========================================================================
// WHAT DOES THIS FILE DO?
// This file acts as the main Router configuration for the React application.
// It maps path URLs (like /dashboard, /books, /issue-book) to their respective
// React pages. It wraps routes inside <AuthProvider> so they can access the
// logged-in user state, and guards protected routes using <PrivateRoute>.
// =========================================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

/** Page imports */
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import BookManagement from './pages/books/BookManagement';
import IssueBook from './pages/books/IssueBook';
import ReturnBook from './pages/books/ReturnBook';
import RenewBook from './pages/books/RenewBook';
import CirculationRecord from './pages/books/CirculationRecord';
import PendingRegistration from './pages/auth/PendingRegistration';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ProfileSettings from './pages/profile/ProfileSettings';
import MembersPage from './pages/members/MembersPage';
import FineManagement from './pages/books/FineManagement';
import ReportsPage from './pages/books/ReportsPage';
import QrScannerPage from './pages/books/QrScannerPage';
import MyBorrowingsPage from './pages/borrowings/MyBorrowingsPage';
import MyFinesPage from './pages/fines/MyFinesPage';
import BookRequestsPage from './pages/requests/BookRequestsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/books"
          element={
            <PrivateRoute>
              <BookManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-borrowings"
          element={
            <PrivateRoute>
              <MyBorrowingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-fines"
          element={
            <PrivateRoute>
              <MyFinesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/book-requests"
          element={
            <PrivateRoute>
              <BookRequestsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/issue-book"
          element={
            <PrivateRoute roles={['librarian']}>
              <IssueBook />
            </PrivateRoute>
          }
        />
        <Route
          path="/return-book"
          element={
            <PrivateRoute roles={['librarian']}>
              <ReturnBook />
            </PrivateRoute>
          }
        />
        <Route
          path="/renew-book"
          element={
            <PrivateRoute roles={['librarian']}>
              <RenewBook />
            </PrivateRoute>
          }
        />
        <Route
          path="/circulation"
          element={
            <PrivateRoute roles={['librarian']}>
              <CirculationRecord />
            </PrivateRoute>
          }
        />
        <Route
          path="/pending-registration"
          element={
            <PrivateRoute roles={['librarian']}>
              <PendingRegistration />
            </PrivateRoute>
          }
        />
        <Route
          path="/members"
          element={
            <PrivateRoute roles={['librarian']}>
              <MembersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/fines"
          element={
            <PrivateRoute roles={['librarian']}>
              <FineManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute roles={['librarian']}>
              <ReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/qr-scanner"
          element={
            <PrivateRoute roles={['librarian']}>
              <QrScannerPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfileSettings />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
