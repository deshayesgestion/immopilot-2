/**
 * syncClientConfig — SaaS CLIENT
 * Récupère la configuration depuis ADMIN et l'applique localement
 * POST /syncClientConfig
 * Body: { tenantId: string, apiKey: string }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import crypto from 'node:crypto';

const validateApiKeySignature = (apiKey, adminUrl) => {
  // TODO: Implémenter validation HMAC de la signature
  // Pour demo, accepter tous les appels avec tenant_id + api_key valides
  return true;
};

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    const { tenantId, apiKey } = body;

    if (!tenantId || !apiKey) {
      return Response.json(
        { error: 'tenantId et apiKey requis' },
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chercher la configuration de sync
    const syncs = await base44.entities.ClientAdminSync.filter({
      tenant_id: tenantId,
    });

    let sync;
    if (syncs && syncs.length > 0) {
      sync = syncs[0];

      // Valider l'API key
      if (sync.api_key !== apiKey) {
        return Response.json(
          { error: 'API key invalide' },
          { status: 401 }
        );
      }
    } else {
      // Première synchronisation: créer l'entrée
      sync = await base44.entities.ClientAdminSync.create({
        tenant_id: tenantId,
        api_key: apiKey,
        admin_url: req.headers.get('origin') || 'https://admin.immopilot.fr',
        modules: [],
        status: 'active',
        config: {},
      });
    }

    // TODO: Appel à l'ADMIN pour récupérer la configuration
    // const adminResponse = await fetch(`${sync.admin_url}/api/tenant/${tenantId}/config`, {
    //   headers: { 'Authorization': `Bearer ${apiKey}` }
    // });
    // const adminConfig = await adminResponse.json();

    // Mock de configuration depuis ADMIN
    const adminConfig = {
      plan: 'professional',
      modules: ['location', 'vente', 'comptabilite'],
      status: 'active',
      restrictions: {
        maxUsers: 10,
        maxProperties: 100,
        features: ['crm', 'invoicing', 'leases'],
      },
    };

    // Mettre à jour la sync avec la config récupérée
    await base44.entities.ClientAdminSync.update(sync.id, {
      plan: adminConfig.plan,
      modules: adminConfig.modules,
      status: adminConfig.status,
      config: adminConfig,
      last_sync: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      tenantId,
      plan: adminConfig.plan,
      modules: adminConfig.modules,
      status: adminConfig.status,
      restrictions: adminConfig.restrictions,
      nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      message: 'Configuration synchronisée avec succès',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});