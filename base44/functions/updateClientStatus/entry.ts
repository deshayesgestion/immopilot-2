/**
 * updateClientStatus — SaaS ADMIN
 * Mise à jour du statut d'un client (active, suspended, blocked)
 * POST /updateClientStatus
 * Body: { tenantId: string, status: string, reason?: string }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    const { tenantId, status, reason } = body;

    if (!tenantId || !status) {
      return Response.json(
        { error: 'tenantId et status requis' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'suspended', 'blocked'];
    if (!validStatuses.includes(status)) {
      return Response.json(
        { error: `Status invalide. Doit être: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Chercher le pairing code associé
    const pairings = await base44.entities.AdminPairingCode.filter({
      tenant_id: tenantId,
    });

    if (!pairings || pairings.length === 0) {
      return Response.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const pairing = pairings[0];

    // Mettre à jour le statut
    await base44.entities.AdminPairingCode.update(pairing.id, {
      status,
      notes: reason || `Statut changé en ${status}`,
    });

    // TODO: Notifier le CLIENT que son statut a changé
    // await fetch(`${pairing.client_url}/api/sync-config`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${pairing.api_key}` },
    //   body: JSON.stringify({ status })
    // });

    return Response.json({
      success: true,
      tenantId,
      status,
      message: `Statut du client changé en ${status}`,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});