import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { OrganizationProvider } from '@/lib/OrganizationContext';
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
import AdminUsers from './pages/admin/AdminUsers';
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
import AccueilIA from './pages/admin/AccueilIA';
import GestionEmails from './pages/admin/GestionEmails';
import AdminImport from './pages/admin/AdminImport';
import AdminSecurite from './pages/admin/AdminSecurite';
import HubCommunication from './pages/admin/HubCommunication';
import AdminTaches from './pages/admin/AdminTaches';
import AdminAgenda from './pages/admin/AdminAgenda';
import ClientLayout from './components/client/ClientLayout';
import EspaceRouter from './pages/client/EspaceRouter';
import LocataireDashboard from './pages/client/LocataireDashboard';
import LocataireDocuments from './pages/client/LocataireDocuments';
import LocatairePaiements from './pages/client/LocatairePaiements';
import LocataireIncidents from './pages/client/LocataireIncidents';
import ClientMessages from './pages/client/ClientMessages';
import ProprietaireDashboard from './pages/client/ProprietaireDashboard';
import ProprietaireBiens from './pages/client/ProprietaireBiens';
import ProprietaireRevenus from './pages/client/ProprietaireRevenus';
import ProprietaireDocuments from './pages/client/ProprietaireDocuments';
import AcquereurDashboard from './pages/client/AcquereurDashboard';
import AcquereurVisites from './pages/client/AcquereurVisites';
import AcquereurDocuments from './pages/client/AcquereurDocuments';
import AcquereurRecherche from './pages/client/AcquereurRecherche';
import ConnectAdmin from './pages/ConnectAdmin';
import ModuleGuard from './components/admin/ModuleGuard';
import ModuleVente from './pages/admin/ModuleVente';
import ModuleLocation from './pages/admin/ModuleLocation';
import ModuleComptabilite from './pages/admin/ModuleComptabilite';

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
      {/* Route cachée pour connexion SaaS */}
      <Route path="/connect-admin" element={<ConnectAdmin />} />

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


        <Route path="/admin/utilisateurs" element={<AdminUsers />} />
        <Route path="/admin/location" element={<ModuleGuard moduleName="location"><AdminLocation /></ModuleGuard>} />
        <Route path="/admin/attribution" element={<ModuleGuard moduleName="location"><AdminAttribution /></ModuleGuard>} />
        <Route path="/admin/attribution/:id" element={<ModuleGuard moduleName="location"><AdminAttributionDetail /></ModuleGuard>} />
        <Route path="/admin/suivi" element={<ModuleGuard moduleName="location"><AdminSuivi /></ModuleGuard>} />
        <Route path="/admin/suivi/:id" element={<ModuleGuard moduleName="location"><AdminSuiviDetail /></ModuleGuard>} />
        <Route path="/admin/sortie" element={<ModuleGuard moduleName="location"><AdminSortie /></ModuleGuard>} />
        <Route path="/admin/sortie/:id" element={<ModuleGuard moduleName="location"><AdminSortieDetail /></ModuleGuard>} />
        <Route path="/admin/parametres" element={<AdminSettings />} />
        <Route path="/admin/vente/mandats" element={<ModuleGuard moduleName="vente"><AdminMandats /></ModuleGuard>} />
        <Route path="/admin/vente/biens" element={<ModuleGuard moduleName="vente"><AdminVenteBiens /></ModuleGuard>} />
        <Route path="/admin/vente/acquereurs" element={<ModuleGuard moduleName="vente"><AdminAcquereurs /></ModuleGuard>} />
        <Route path="/admin/vente/transactions" element={<ModuleGuard moduleName="vente"><AdminTransactions /></ModuleGuard>} />
        <Route path="/admin/vente/transactions/:id" element={<ModuleGuard moduleName="vente"><AdminTransactionDetail /></ModuleGuard>} />
        <Route path="/admin/vente/cloture" element={<ModuleGuard moduleName="vente"><AdminVenteCloture /></ModuleGuard>} />
        <Route path="/admin/comptabilite" element={<ModuleGuard moduleName="compta"><AdminComptabilite /></ModuleGuard>} />
        <Route path="/admin/modules/vente" element={<ModuleGuard moduleName="vente"><ModuleVente /></ModuleGuard>} />
        <Route path="/admin/modules/location" element={<ModuleGuard moduleName="location"><ModuleLocation /></ModuleGuard>} />
        <Route path="/admin/modules/comptabilite" element={<ModuleGuard moduleName="compta"><ModuleComptabilite /></ModuleGuard>} />
        <Route path="/admin/parametres/accueil-ia" element={<AccueilIA />} />
        <Route path="/admin/parametres/emails" element={<GestionEmails />} />
        <Route path="/admin/import" element={<AdminImport />} />
        <Route path="/admin/securite" element={<AdminSecurite />} />
        <Route path="/admin/communications" element={<HubCommunication />} />
        <Route path="/admin/taches" element={<AdminTaches />} />
        <Route path="/admin/agenda" element={<AdminAgenda />} />
      </Route>

      {/* ── ESPACES CLIENTS ── */}
      <Route path="/espace" element={<EspaceRouter />} />
      <Route element={<ClientLayout />}>
        {/* Locataire */}
        <Route path="/espace/locataire" element={<LocataireDashboard />} />
        <Route path="/espace/locataire/documents" element={<LocataireDocuments />} />
        <Route path="/espace/locataire/paiements" element={<LocatairePaiements />} />
        <Route path="/espace/locataire/incidents" element={<LocataireIncidents />} />
        <Route path="/espace/locataire/messages" element={<ClientMessages />} />
        {/* Propriétaire */}
        <Route path="/espace/proprietaire" element={<ProprietaireDashboard />} />
        <Route path="/espace/proprietaire/biens" element={<ProprietaireBiens />} />
        <Route path="/espace/proprietaire/revenus" element={<ProprietaireRevenus />} />
        <Route path="/espace/proprietaire/documents" element={<ProprietaireDocuments />} />
        <Route path="/espace/proprietaire/messages" element={<ClientMessages />} />
        {/* Acquéreur */}
        <Route path="/espace/acquereur" element={<AcquereurDashboard />} />
        <Route path="/espace/acquereur/visites" element={<AcquereurVisites />} />
        <Route path="/espace/acquereur/documents" element={<AcquereurDocuments />} />
        <Route path="/espace/acquereur/recherche" element={<AcquereurRecherche />} />
        <Route path="/espace/acquereur/messages" element={<ClientMessages />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <OrganizationProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </OrganizationProvider>
    </AuthProvider>
  )
}

export default App