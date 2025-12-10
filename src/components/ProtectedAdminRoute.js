import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  console.log('ProtectedAdminRoute - user:', user);
  console.log('ProtectedAdminRoute - isAuthenticated:', isAuthenticated);
  console.log('ProtectedAdminRoute - loading:', loading);
  console.log('ProtectedAdminRoute - user_type:', user?.user_type);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Redirect to home if not admin or inventory manager
  if (!user || (user.user_type !== 'admin' && user.user_type !== 'inventory_manager')) {
    console.log('Not admin or inventory manager, redirecting to home. User type:', user?.user_type);
    return <Navigate to="/" replace />;
  }

  console.log('Admin/Inventory Manager access granted');
  // Render admin content if user is admin or inventory manager
  return children;
};

export default ProtectedAdminRoute;
