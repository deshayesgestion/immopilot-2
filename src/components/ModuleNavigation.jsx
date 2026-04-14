import { useTenantConfig } from '@/hooks/useTenantConfig';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  FileText,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

const MODULE_ICONS = {
  crm: Users,
  devis: FileText,
  facturation: DollarSign,
  prospects: Briefcase,
};

const MODULE_LABELS = {
  crm: 'CRM',
  devis: 'Devis',
  facturation: 'Facturation',
  prospects: 'Prospects',
};

const MODULE_PATHS = {
  crm: '/admin/crm',
  devis: '/admin/devis',
  facturation: '/admin/facturation',
  prospects: '/admin/prospects',
};

/**
 * ModuleNavigation — Menu de navigation basé sur les modules activés
 */
export default function ModuleNavigation() {
  const { config, loading, error } = useTenantConfig();
  const location = useLocation();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-900">Erreur configuration</p>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const modules = Object.entries(config?.modules || {})
    .filter(([, module]) => module?.enabled)
    .map(([name]) => name);

  if (modules.length === 0) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
        <p className="text-sm text-amber-900">Aucun module activé</p>
      </div>
    );
  }

  return (
    <nav className="space-y-1">
      {modules.map((moduleName) => {
        const Icon = MODULE_ICONS[moduleName];
        const label = MODULE_LABELS[moduleName];
        const path = MODULE_PATHS[moduleName];
        const isActive = location.pathname === path;

        return (
          <Link
            key={moduleName}
            to={path}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * ModuleStatus — Affiche l'état des modules du tenant
 */
export function ModuleStatus() {
  const { config, loading } = useTenantConfig();

  if (loading) return null;

  const enabledCount = Object.values(config?.modules || {}).filter(
    (m) => m?.enabled
  ).length;
  const totalCount = Object.keys(config?.modules || {}).length;

  return (
    <div className="p-3 bg-secondary/20 rounded-lg text-xs text-muted-foreground">
      <p>
        <strong>{enabledCount}</strong> / <strong>{totalCount}</strong> modules activés
      </p>
      {config?.last_synced && (
        <p className="mt-1">
          Synchronisé: {new Date(config.last_synced).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}