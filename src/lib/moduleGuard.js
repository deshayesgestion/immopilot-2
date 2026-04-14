/**
 * moduleGuard — Protection backend pour les modules
 * À utiliser dans les fonctions backend pour bloquer accès si module désactivé
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

export async function checkModuleAccess(req, moduleName) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Récupérer la config tenant
    const configs = await base44.entities.TenantConfig.list();
    if (!configs.length) {
      throw new Error('Configuration tenant non trouvée');
    }

    const config = configs[0];
    const module = config.modules?.[moduleName];

    if (!module?.enabled) {
      throw new Error(`Module "${moduleName}" non activé pour ce tenant`);
    }

    return {
      allowed: true,
      config,
      module,
    };
  } catch (error) {
    return {
      allowed: false,
      error: error.message,
    };
  }
}

/**
 * Exemple d'utilisation dans une fonction backend:
 *
 * import { checkModuleAccess } from '@/lib/moduleGuard.js';
 *
 * Deno.serve(async (req) => {
 *   const moduleCheck = await checkModuleAccess(req, 'crm');
 *   if (!moduleCheck.allowed) {
 *     return Response.json({ error: moduleCheck.error }, { status: 403 });
 *   }
 *   // Continuer avec la logique métier...
 * });
 */