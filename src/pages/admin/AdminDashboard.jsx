import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Users, Settings, Mail, Store, BarChart, LogOut, Building, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

import AdminSettings from '@/components/admin/AdminSettings';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminEmail from '@/components/admin/AdminEmail';
import AdminRetail from '@/components/admin/AdminRetail';
import AdminCompanies from '@/components/admin/AdminCompanies';
import AdminCandidates from '@/components/admin/AdminCandidates';
import AdminInterviews from '@/components/admin/AdminInterviews';

const tabs = {
  overview: { icon: BarChart, label: 'Resumen', component: AdminOverview },
  companies: { icon: Building, label: 'Empresas', component: AdminCompanies },
  candidates: { icon: Users, label: 'Candidatos', component: AdminCandidates },
  interviews: { icon: FileText, label: 'Entrevistas', component: AdminInterviews },
  // users: { icon: Users, label: 'Todos los Usuarios', component: AdminUsers }, // Hidden to avoid redundancy
  settings: { icon: Settings, label: 'Ajustes', component: AdminSettings },
  email: { icon: Mail, label: 'Plantillas Email', component: AdminEmail },
  retail: { icon: Store, label: 'Parámetros Retail', component: AdminRetail },
};

const AdminDashboard = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  
  const ActiveComponent = tabs[tab]?.component || tabs.overview.component;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950/50 border-r border-slate-800 flex flex-col p-4">
        <div className="flex items-center gap-3 p-4 mb-6">
          <Shield className="w-8 h-8 text-cyan-400" />
          <h1 className="text-xl font-bold gradient-text">Admin Panel</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {Object.entries(tabs).map(([key, { icon: Icon, label }]) => (
            <Button
              key={key}
              variant={tab === key ? 'secondary' : 'ghost'}
              className={`w-full justify-start ${tab === key ? 'bg-blue-500/20 text-cyan-300' : 'hover:bg-slate-800'}`}
              onClick={() => navigate(`/admin-dashboard/${key}`)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </Button>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="p-2 mb-2 text-center border-t border-slate-800 pt-4">
            <p className="text-sm font-semibold text-slate-300">{profile?.full_name}</p>
            <p className="text-xs text-slate-500">{profile?.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start hover:bg-red-500/10 hover:text-red-400" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;