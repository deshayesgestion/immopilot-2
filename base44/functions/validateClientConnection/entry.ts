/**
 * validateClientConnection — SaaS ADMIN
 * Valide et finalise la connexion d'un SaaS CLIENT
 * POST /validateClientConnection
 * Body: { pairingCode: string, clientUrl: string }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import crypto from 'node:crypto';

const generateApiKey = () => 'sk_' + crypto.randomBytes(32).toString('hex');
const generateHmacHash = (apiKey, secret) => {
  const hmac = crypto.createHmac('sha256', secret || 'admin_secret');
  return hmac.update(apiKey).digest('hex');
};

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
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Chercher le pairing code
    const pairings = await base44.entities.AdminPairingCode.filter({
      code: pairingCode,
    });

    if (!pairings || pairings.length === 0) {
      return Response.json(
        { error: 'Code de pairing invalide ou expiré', status: 'failed' },
        { status: 400 }
      );
    }

    const pairing = pairings[0];

    // Vérifier expiration
    if (pairing.expires_at && new Date(pairing.expires_at) < new Date()) {
      await base44.entities.AdminPairingCode.update(pairing.id, {
        status: 'blocked',
      });
      return Response.json(
        { error: 'Code de pairing expiré', status: 'failed' },
        { status: 400 }
      );
    }

    // Vérifier que le code n'a pas déjà été utilisé
    if (pairing.status !== 'pending') {
      return Response.json(
        { error: 'Ce code a déjà été utilisé', status: 'failed' },
        { status: 400 }
      );
    }

    // Générer API key
    const apiKey = generateApiKey();
    const apiKeyHash = generateHmacHash(apiKey, 'admin_secret');

    // Mettre à jour le pairing code
    await base44.entities.AdminPairingCode.update(pairing.id, {
      api_key: apiKey,
      api_key_hash: apiKeyHash,
      client_url: clientUrl,
      status: 'connected',
      connected_at: new Date().toISOString(),
    });

    // Retourner les données nécessaires au CLIENT
    return Response.json({
      success: true,
      tenantId: pairing.tenant_id,
      apiKey,
      plan: pairing.plan,
      modules: pairing.modules,
      adminUrl: req.headers.get('origin') || 'https://admin.immopilot.fr',
      syncInterval: 24,
      status: 'connected',
      message: 'Connexion validée avec succès',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});