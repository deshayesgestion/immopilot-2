/**
 * FeatureGate - Affiche/masque UI selon la config SaaS Admin
 * 
 * Utilisation:
 * <FeatureGate module="location">
 *   <Link to="/modules/location">Module Location</Link>
 * </FeatureGate>
 * 
 * <FeatureGate feature="ia_scoring" fallback={<DisabledMessage />}>
 *   <ScoringButton />
 * </FeatureGate>
 */

import React, { useEffect, useState } from 'react';
import { appConfig } from '@/lib/AppConfigService';
import { AlertCircle } from 'lucide-react';

/**
 * Gate par module activé/désactivé
 */
export function FeatureGate({
  module,
  feature,
  children,
  fallback = null,
  showMessage = false
}) {
  const [isEnabled, setIsEnabled] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (module) {
        setIsEnabled(appConfig.isModuleEnabled(module));
      } else if (feature) {
        setIsEnabled(appConfig.isFeatureEnabled(feature));
      }
      setConfig(appConfig.getConfig());
    };

    checkAccess();

    // Réagir aux changements config
    const unsubscribe = appConfig.onConfigChange(() => {
      checkAccess();
    });

    return unsubscribe;
  }, [module, feature]);

  if (isEnabled === null) {
    return null; // Loading
  }

  if (!isEnabled) {
    return (
      fallback || (
        showMessage && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {module ? `Module « ${module} »` : 'Fonctionnalité'} indisponible
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Cette fonctionnalité n'est pas activée pour votre abonnement actuel.
                </p>
                {config?.pricing?.plan && (
                  <p className="text-xs text-amber-600 mt-1">
                    Plan actuel: <span className="font-semibold">{config.pricing.plan}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      )
    );
  }

  return children;
}

/**
 * Gate par quota atteint
 */
export function QuotaGate({
  module,
  quotaKey,
  currentValue,
  children,
  fallback = null
}) {
  const [limit, setLimit] = useState(null);
  const [isExceeded, setIsExceeded] = useState(false);

  useEffect(() => {
    const checkQuota = () => {
      const quotaLimit = appConfig.getModuleLimit(module, quotaKey);
      setLimit(quotaLimit);
      setIsExceeded(quotaLimit !== null && currentValue >= quotaLimit);
    };

    checkQuota();

    const unsubscribe = appConfig.onConfigChange(() => {
      checkQuota();
    });

    return unsubscribe;
  }, [module, quotaKey, currentValue]);

  if (isExceeded) {
    return (
      fallback || (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900">Quota atteint</p>
              <p className="text-xs text-red-700 mt-0.5">
                Vous avez atteint la limite de {limit} {quotaKey} pour ce module.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Contactez votre administrateur pour augmenter votre quota.
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  return children;
}

/**
 * Liste de modules disponibles (utile pour navigation)
 */
export function AvailableModules({ render }) {
  const [modules, setModules] = useState([]);

  useEffect(() => {
    const updateModules = () => {
      const config = appConfig.getConfig();
      if (config?.modules) {
        const available = Object.entries(config.modules)
          .filter(([_, mod]) => mod.enabled)
          .map(([name, mod]) => ({
            name,
            enabled: true,
            limit: mod.max_dossiers
          }));
        setModules(available);
      }
    };

    updateModules();

    const unsubscribe = appConfig.onConfigChange(() => {
      updateModules();
    });

    return unsubscribe;
  }, []);

  return render ? render(modules) : (
    <div className="space-y-1">
      {modules.map(mod => (
        <div key={mod.name} className="text-sm text-muted-foreground">
          ✓ {mod.name}
        </div>
      ))}
    </div>
  );
}

/**
 * Status panel: afficher statut config + plan
 */
export function ConfigStatusPanel() {
  const [config, setConfig] = React.useState(null);
  const [lastSync, setLastSync] = React.useState(null);

  React.useEffect(() => {
    const updateConfig = () => {
      setConfig(appConfig.getConfig());
      setLastSync(appConfig.lastSync);
    };

    updateConfig();

    const unsubscribe = appConfig.onConfigChange(() => {
      updateConfig();
    });

    return unsubscribe;
  }, []);

  if (!config) {
    return (
      <div className="text-xs text-amber-600 p-2 bg-amber-50 rounded">
        ⏳ Configuration chargement...
      </div>
    );
  }

  return (
    <div className="text-xs space-y-1 p-2 bg-slate-50 rounded border border-slate-200">
      <div>
        <span className="text-muted-foreground">Plan:</span>
        <span className="font-semibold ml-2">{config.pricing?.plan || 'custom'}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Modules:</span>
        <span className="ml-2">
          {Object.entries(config.modules || {})
            .filter(([_, m]) => m.enabled)
            .map(([name]) => name)
            .join(', ') || 'None'}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Dernière sync:</span>
        <span className="ml-2">
          {lastSync ? new Date(lastSync).toLocaleTimeString('fr-FR') : 'jamais'}
        </span>
      </div>
    </div>
  );
}

/**
 * Déboguer: afficher config brute (pour dev)
 */
export function ConfigDebug({ visible = false }) {
  const [config, setConfig] = React.useState(null);

  React.useEffect(() => {
    const updateConfig = () => {
      setConfig(appConfig.getConfig());
    };

    updateConfig();

    const unsubscribe = appConfig.onConfigChange(() => {
      updateConfig();
    });

    return unsubscribe;
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs max-h-96 overflow-auto border border-slate-700">
      <p className="font-bold mb-2">🔧 CONFIG DEBUG</p>
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
}