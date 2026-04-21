/**
 * getOrganizationConfig — SaaS CLIENT
 * Retourne la configuration de l'organisation (plan, modules, limites, features)
 * GET /getOrganizationConfig
 *
 * TODO: Connecter au SaaS ADMIN via AdminConnection/ClientAdminSync
 * pour récupérer la config réelle selon le tenant_id
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ────────────────────────────────────────────────────────────
    // TODO: Remplacer par une vraie récupération depuis AdminConnection
    //
    // const connections = await base44.entities.AdminConnection.filter({ status: 'connected' });
    // const connection = connections[0];
    // if (connection) {
    //   const res = await fetch(`${connection.admin_url}/api/organization/config`, {
    //     headers: { 'Authorization': `Bearer ${connection.api_key}` }
    //   });
    //   const config = await res.json();
    //   return Response.json(config);
    // }
    // ────────────────────────────────────────────────────────────

    // Données mockées (plan pro)
    const config = {
      organizationId: "org_mock_001",
      plan: "pro",
      modulesActifs: {
        vente: true,
        location: true,
        compta: true,
      },
      limites: {
        maxUtilisateurs: 20,
        maxEspacesClients: 100,
      },
      features: {
        ia: true,
        automation: false,
      },
    };

    return Response.json(config);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});