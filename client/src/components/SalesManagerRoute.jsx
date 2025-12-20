import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SalesManagerRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'sales_manager') {
    return <Navigate to="/" replace />;
  }

  return children;
}

