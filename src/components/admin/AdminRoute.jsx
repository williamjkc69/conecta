import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  console.log('--- AdminRoute Check ---');
  console.log('Current Location:', location.pathname);
  console.log('Auth Loading:', loading);
  console.log('User Object:', user);
  console.log('Profile Object:', profile);
  
  const isAdmin = profile?.role === 'admin';
  console.log('Is Admin?:', isAdmin);

  if (loading) {
    console.log('AdminRoute: Auth is loading, showing loader.');
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    console.log('AdminRoute: No user found, redirecting to /admin-login.');
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    console.log('AdminRoute: User is not an admin, redirecting to /.');
    return <Navigate to="/" replace />;
  }
  
  console.log('AdminRoute: Access granted.');
  console.log('------------------------');

  return children;
};

export default AdminRoute;