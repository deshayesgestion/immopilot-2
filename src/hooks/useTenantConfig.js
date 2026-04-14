import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useTenantConfig — Hook pour récupérer et cacher la config tenant
 * Gère la synchronisation et le cache local
 */
export function useTenantConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Récupérer la config tenant depuis la BD locale
        const configs = await base44.entities.TenantConfig.list();
        if (configs.length > 0) {
          setConfig(configs[0]);
        } else {
          setError('Configuration tenant non trouvée');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Helper : vérifier si un module est activé
  const isModuleEnabled = (moduleName) => {
    return config?.modules?.[moduleName]?.enabled === true;
  };

  // Helper : obtenir les features d'un module
  const getModuleFeatures = (moduleName) => {
    return config?.modules?.[moduleName]?.features || [];
  };

  return {
    config,
    loading,
    error,
    isModuleEnabled,
    getModuleFeatures,
  };
}

/**
 * Composant wrapper pour protéger les modules
 * Usage: <ModuleGuard module="crm"><CRMPage /></ModuleGuard>
 */
export function ModuleGuard({ module, children }) {
  const { isModuleEnabled, loading } = useTenantConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isModuleEnabled(module)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Module non disponible</h1>
          <p className="text-muted-foreground">
            Le module <strong>{module}</strong> n'est pas activé pour votre compte.
          </p>
        </div>
      </div>
    );
  }

  return children;
}