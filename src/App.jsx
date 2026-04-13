import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import PropertiesSale from './pages/PropertiesSale';
import PropertiesRent from './pages/PropertiesRent';
import Estimation from './pages/Estimation';
import Contact from './pages/Contact';
import About from './pages/About';
import PropertyDetail from './pages/PropertyDetail';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';

import AdminCRM from './pages/admin/AdminCRM';
import AdminAI from './pages/admin/AdminAI';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAgents from './pages/admin/AdminAgents';
import AdminDossiers from './pages/admin/AdminDossiers';
import AdminLocation from './pages/admin/AdminLocation';
import DossierLocatif from './pages/admin/DossierLocatif';
import DossierLocatifDetail from './pages/admin/DossierLocatifDetail';
import AdminAttribution from './pages/admin/AdminAttribution';
import AdminAttributionDetail from './pages/admin/AdminAttributionDetail';
import AdminSuivi from './pages/admin/AdminSuivi';
import AdminSortie from './pages/admin/AdminSortie';
import AdminSortieDetail from './pages/admin/AdminSortieDetail';
import AdminVenteBiens from './pages/admin/AdminVenteBiens';
import AdminAcquereurs from './pages/admin/AdminAcquereurs';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminTransactionDetail from './pages/admin/AdminTransactionDetail';
import AdminVenteCloture from './pages/admin/AdminVenteCloture';
import AdminMandats from './pages/admin/AdminMandats';
import AdminComptabilite from './pages/admin/AdminComptabilite';
import AdminSuiviDetail from './pages/admin/AdminSuiviDetail';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/vente" element={<PropertiesSale />} />
        <Route path="/location" element={<PropertiesRent />} />
        <Route path="/estimation" element={<Estimation />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/a-propos" element={<About />} />
        <Route path="/bien/:id" element={<PropertyDetail />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Dashboard />} />


        <Route path="/admin/equipe" element={<AdminAgents />} />
        <Route path="/admin/location" element={<AdminLocation />} />
        <Route path="/admin/attribution" element={<AdminAttribution />} />
        <Route path="/admin/attribution/:id" element={<AdminAttributionDetail />} />
        <Route path="/admin/suivi" element={<AdminSuivi />} />
        <Route path="/admin/suivi/:id" element={<AdminSuiviDetail />} />
        <Route path="/admin/sortie" element={<AdminSortie />} />
        <Route path="/admin/sortie/:id" element={<AdminSortieDetail />} />
        <Route path="/admin/parametres" element={<AdminSettings />} />
        <Route path="/admin/vente/mandats" element={<AdminMandats />} />
        <Route path="/admin/vente/biens" element={<AdminVenteBiens />} />
        <Route path="/admin/vente/acquereurs" element={<AdminAcquereurs />} />
        <Route path="/admin/vente/transactions" element={<AdminTransactions />} />
        <Route path="/admin/vente/transactions/:id" element={<AdminTransactionDetail />} />
        <Route path="/admin/vente/cloture" element={<AdminVenteCloture />} />
        <Route path="/admin/comptabilite" element={<AdminComptabilite />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App