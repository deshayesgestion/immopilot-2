/**
 * useActionValidator - Hook pour valider et exécuter des actions
 * avec restrictions du SaaS Admin
 * 
 * Utilisation:
 * const { executeAction } = useActionValidator();
 * await executeAction(
 *   { type: 'create_dossier', module: 'location', feature: 'ia_scoring' },
 *   async () => base44.entities.DossierLocatif.create(data)
 * );
 */

import React, { useCallback } from 'react';
import { appConfig } from '@/lib/AppConfigService';
import { usageTracker } from '@/lib/UsageTrackerService';
import { useAuth } from '@/lib/AuthContext'; // À adapter à votre auth

export function useActionValidator() {
  const { user } = useAuth();

  /**
   * Valider si une action est autorisée selon la config
   */
  const validateAction = useCallback(async (action) => {
    const config = appConfig.getConfig();

    if (!config) {
      throw new Error('Configuration not yet loaded. Please wait...');
    }

    // 1. Vérifier: module activé?
    const module = action.module;
    if (module) {
      const moduleConfig = config.modules?.[module];
      if (!moduleConfig?.enabled) {
        const error = new Error(
          `Le module "${module}" n'est pas activé pour votre abonnement.`
        );
        error.code = 'MODULE_DISABLED';
        error.type = 'validation_error';
        throw error;
      }
    }

    // 2. Vérifier: feature activée?
    if (action.feature) {
      if (!config.features?.[action.feature]) {
        const error = new Error(
          `La fonctionnalité "${action.feature}" n'est pas disponible pour votre plan.`
        );
        error.code = 'FEATURE_DISABLED';
        error.type = 'validation_error';
        throw error;
      }
    }

    // 3. Vérifier: quotas pour module
    if (module && action.quota) {
      const limit = appConfig.getModuleLimit(module, action.quota.key);
      if (limit !== null && action.quota.current >= limit) {
        const error = new Error(
          `Quota dépassé pour ${module}: limite ${limit} ${action.quota.key} atteinte.`
        );
        error.code = 'QUOTA_EXCEEDED';
        error.type = 'quota_error';
        error.limit = limit;
        throw error;
      }
    }

    // 4. Vérifier: quotas globaux (API calls, storage, etc)
    if (action.globalQuota) {
      const limit = appConfig.getGlobalLimit(action.globalQuota.key);
      if (limit !== null && action.globalQuota.current >= limit) {
        const error = new Error(
          `Quota global dépassé: limite ${limit} ${action.globalQuota.key} atteinte.`
        );
        error.code = 'GLOBAL_QUOTA_EXCEEDED';
        error.type = 'quota_error';
        throw error;
      }
    }

    return true; // Action autorisée ✅
  }, []);

  /**
   * Exécuter une action avec validation et tracking
   */
  const executeAction = useCallback(
    async (action, fn) => {
      const startTime = Date.now();
      const userEmail = user?.email || 'unknown';

      try {
        // 1. Valider que action est autorisée
        await validateAction(action);

        // 2. Exécuter l'action
        const result = await fn();

        // 3. Tracker usage
        usageTracker.track({
          type: action.type,
          module: action.module,
          user_email: userEmail,
          details: {
            ...action.details,
            action_id: generateId()
          },
          duration_ms: Date.now() - startTime,
          success: true
        });

        return result;
      } catch (error) {
        // Tracker erreur
        usageTracker.trackError({
          type: error.type || 'action_execution_error',
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack,
          user_email: userEmail,
          module: action.module,
          action_type: action.type
        });

        throw error;
      }
    },
    [user, validateAction]
  );

  /**
   * Vérifier si une action est possible SANS l'exécuter
   * Utile pour disabler des boutons en UI
   */
  const canExecuteAction = useCallback(async (action) => {
    try {
      await validateAction(action);
      return true;
    } catch (error) {
      return false;
    }
  }, [validateAction]);

  /**
   * Obtenir raison si action n'est pas possible
   */
  const getActionBlockReason = useCallback(async (action) => {
    try {
      await validateAction(action);
      return null; // Pas bloquée
    } catch (error) {
      return {
        code: error.code,
        message: error.message,
        type: error.type
      };
    }
  }, [validateAction]);

  return {
    validateAction,
    executeAction,
    canExecuteAction,
    getActionBlockReason
  };
}

/**
 * Wrapper component: bloquer partie UI si action impossible
 */
export function ActionGate({ action, children, fallback }) {
  const { canExecuteAction } = useActionValidator();
  const [canExecute, setCanExecute] = React.useState(null);

  React.useEffect(() => {
    canExecuteAction(action).then(setCanExecute);
  }, [action, canExecuteAction]);

  if (canExecute === null) {
    return null; // Loading
  }

  if (!canExecute) {
    return fallback || (
      <div className="opacity-50 cursor-not-allowed" title="Action not available">
        {children}
      </div>
    );
  }

  return children;
}

/**
 * Helper: générer ID unique
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}