/**
 * validatePairingCode — SaaS ADMIN
 * Valide le code de pairing du SaaS CLIENT
 * POST /validatePairingCode
 * Body: { pairingCode: string, clientUrl: string, connectionId: string }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    const { pairingCode, clientUrl, connectionId } = body;

    if (!pairingCode || !clientUrl || !connectionId) {
      return Response.json(
        { error: 'pairingCode, clientUrl et connectionId requis' },
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);
    const adminUser = await base44.auth.me();

    // Seul un admin peut valider
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json(
        { error: 'Seul un admin peut valider les codes de pairing' },
        { status: 403 }
      );
    }

    // TODO: Vérifier que le pairing code est valide
    // Pour demo, on accepte tous les codes qui commencent par "PAIR-"
    if (!pairingCode.startsWith('PAIR-')) {
      return Response.json(
        { error: 'Code de pairing invalide', status: 'failed' },
        { status: 400 }
      );
    }

    // Générer tenant_id et api_key
    const tenantId = crypto.randomUUID();
    const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');

    // Mettre à jour la connexion (dans le SaaS ADMIN)
    // Note: Dans un vrai système, stocker aussi dans une table AdminTenant
    const connection = await base44.entities.AdminConnection.update(
      connectionId,
      {
        tenant_id: tenantId,
        api_key: apiKey,
        admin_url: req.headers.get('origin') || 'https://admin.immopilot.fr',
        status: 'connected',
        connected_at: new Date().toISOString(),
      }
    );

    return Response.json({
      success: true,
      tenantId,
      apiKey,
      status: 'connected',
      message: 'Connexion validée avec succès',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});