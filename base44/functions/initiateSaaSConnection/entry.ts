/**
 * initiateSaaSConnection — SaaS CLIENT
 * Initie la connexion au SaaS ADMIN avec pairing code
 * POST /initiateSaaSConnection
 * Body: { pairingCode: string, clientUrl: string }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    const { pairingCode, clientUrl } = body;

    if (!pairingCode || !clientUrl) {
      return Response.json(
        { error: 'pairingCode et clientUrl requis' },
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Enregistrer la tentative de connexion
    const connection = await base44.entities.AdminConnection.create({
      pairing_code: pairingCode,
      client_url: clientUrl,
      status: 'pending',
    });

    // TODO: Appel au SaaS ADMIN pour valider le code de pairing
    // const adminUrl = process.env.SAAS_ADMIN_URL || 'https://admin.immopilot.fr';
    // const response = await fetch(`${adminUrl}/api/validate-pairing`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     pairingCode,
    //     clientUrl,
    //     connectionId: connection.id
    //   })
    // });

    return Response.json({
      connectionId: connection.id,
      status: 'pending',
      message: 'Connexion en attente de validation par le SaaS ADMIN',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});