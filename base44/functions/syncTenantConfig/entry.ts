/**
 * syncTenantConfig — Synchronise la config tenant depuis SaaS ADMIN
 * Appelée automatiquement ou manuellement
 * POST /syncTenantConfig
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer la connexion ADMIN
    const connections = await base44.entities.AdminConnection.list();
    if (!connections.length) {
      return Response.json(
        { error: 'Non connecté à un SaaS ADMIN' },
        { status: 400 }
      );
    }

    const connection = connections[0];
    if (!connection.api_key || connection.status !== 'connected') {
      return Response.json(
        { error: 'Connexion ADMIN non validée' },
        { status: 400 }
      );
    }

    // Appeler l'API ADMIN pour récupérer la config
    const adminUrl = connection.admin_url || 'https://admin.immopilot.fr';
    const configResponse = await fetch(`${adminUrl}/api/tenant/${connection.tenant_id}/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!configResponse.ok) {
      return Response.json(
        { error: `Erreur ADMIN: ${configResponse.statusText}` },
        { status: configResponse.status }
      );
    }

    const configData = await configResponse.json();

    // Sauvegarder ou mettre à jour la config locale
    const existingConfigs = await base44.entities.TenantConfig.list();
    let savedConfig;

    if (existingConfigs.length > 0) {
      savedConfig = await base44.entities.TenantConfig.update(existingConfigs[0].id, {
        tenant_id: configData.tenant_id,
        tenant_name: configData.tenant_name,
        modules: configData.modules,
        max_users: configData.max_users,
        storage_gb: configData.storage_gb,
        last_synced: new Date().toISOString(),
        sync_status: 'synced',
      });
    } else {
      savedConfig = await base44.entities.TenantConfig.create({
        tenant_id: configData.tenant_id,
        tenant_name: configData.tenant_name,
        admin_url: adminUrl,
        modules: configData.modules,
        max_users: configData.max_users,
        storage_gb: configData.storage_gb,
        last_synced: new Date().toISOString(),
        sync_status: 'synced',
      });
    }

    return Response.json({
      success: true,
      config: savedConfig,
      message: 'Configuration synchronisée avec succès',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});