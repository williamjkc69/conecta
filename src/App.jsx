import React from 'react';
import { Helmet } from 'react-helmet';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import CompanyDashboard from '@/pages/CompanyDashboard';
import CandidateDashboard from '@/pages/CandidateDashboard';
import InterviewPage from '@/pages/InterviewPage';
import InterviewSummaryPage from '@/pages/InterviewSummaryPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AdminLoginSimple from '@/pages/admin/AdminLoginSimple';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminRoute from '@/components/admin/AdminRoute';
import { Toaster } from '@/components/ui/toaster';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function App() {
  const { user, loading, signOut, session, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path, options) => {
    navigate(path, options);
  };

  const handleInterviewCompleted = (reportData) => {
    navigate('/interview-summary', { state: { reportData } });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  const userRole = profile?.role;
  const userType = user?.user_metadata?.type;

  return (
    <>
      <Helmet>
        <title>AI Interview Platform - Entrevistas Automatizadas con IA</title>
        <meta name="description" content="Automatiza tu proceso de selección con entrevistas por voz conducidas por IA. Crea vacantes, registra candidatos y entrevista sin agendar ni esperar." />
      </Helmet>
      
      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={
              !user ? <HomePage onNavigate={handleNavigate} /> : 
              userRole === 'admin' ? <Navigate to="/admin-dashboard/overview" /> :
              userType === 'company' ? <Navigate to="/company-dashboard" /> :
              userType === 'candidate' ? <Navigate to="/candidate-dashboard" /> :
              <HomePage onNavigate={handleNavigate} />
            } />
            <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/" />} />
            <Route path="/reset-password" element={session ? <ResetPasswordPage /> : <Navigate to="/" />} />
            
            {/* Admin Routes */}
            <Route path="/admin-login" element={!user ? <AdminLoginSimple /> : <Navigate to="/admin-dashboard/overview" />} />
            <Route path="/admin-dashboard/:tab" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin-dashboard" element={<AdminRoute><Navigate to="/admin-dashboard/overview" /></AdminRoute>} />

            {/* User Routes */}
            <Route path="/company-dashboard" element={
              user && userType === 'company' ? <CompanyDashboard user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" />
            } />
            <Route path="/candidate-dashboard" element={
              user && userType === 'candidate' ? <CandidateDashboard user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" />
            } />
            <Route path="/interview/:applicationId" element={
              user ? <InterviewPage user={user} onInterviewCompleted={handleInterviewCompleted} /> : <Navigate to="/" />
            } />
            <Route path="/interview-summary" element={
              user ? <InterviewSummaryPage onNavigate={handleNavigate} user={user} /> : <Navigate to="/" />
            } />
          </Routes>
        </AnimatePresence>
        <Toaster />
      </div>
    </>
  );
}

export default App;