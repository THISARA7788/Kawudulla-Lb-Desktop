import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LibrarianDashboardMain from '../../components/dashboard/LibrarianDashboardMain';
import TeacherDashboardMain from '../../components/dashboard/TeacherDashboardMain';
import StudentDashboardMain from '../../components/dashboard/StudentDashboardMain';

const Dashboard = () => {
  const { user } = useAuth();

  // Librarian → Librarian Dashboard Main
  if (user?.role === 'librarian') {
    return (
      <DashboardLayout>
        <LibrarianDashboardMain />
      </DashboardLayout>
    );
  }

  // Teacher → Teacher Dashboard Main
  if (user?.role === 'teacher') {
    return (
      <DashboardLayout>
        <TeacherDashboardMain />
      </DashboardLayout>
    );
  }

  // Student → Student Dashboard Main
  return (
    <DashboardLayout>
      <StudentDashboardMain />
    </DashboardLayout>
  );
};

export default Dashboard;
