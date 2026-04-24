/**
 * generatePairingCode — SaaS ADMIN
 * Génère un code de pairing unique pour un nouveau client
 * POST /generatePairingCode
 * Body: { clientName: string, agencyId?: string, plan: string, modules: array }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    // ── VALIDATION SECRETS (obligatoire au démarrage) ──
    const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET');
    if (!ADMIN_SECRET || ADMIN_SECRET.trim() === '') {
      console.error('🚨 ERREUR: Variable ADMIN_SECRET manquante!');
      return Response.json(
        { error: 'Configuration serveur invalide' },
        { status: 500 }
      );
    }

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    const { clientName, agencyId, plan = 'professional', modules = ['location', 'vente', 'comptabilite'] } = body;

    if (!clientName) {
      return Response.json({ error: 'clientName requis' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    // Seul un admin peut générer des codes
    if (!admin || admin.role !== 'admin') {
      return Response.json(
        { error: 'Seul un admin peut générer des codes de pairing' },
        { status: 403 }
      );
    }

    // Générer code et tenant_id uniques
    const code = 'PAIR-' + crypto.getRandomValues(new Uint8Array(8))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')
      .toUpperCase();
    const tenantId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 jours

    // Enregistrer le code de pairing
    const pairingCode = await base44.entities.AdminPairingCode.create({
      code,
      tenant_id: tenantId,
      client_name: clientName,
      agency_id: agencyId,
      plan,
      modules,
      status: 'pending',
      expires_at: expiresAt,
    });

    return Response.json({
      success: true,
      code,
      tenantId,
      clientName,
      plan,
      modules,
      expiresAt,
      message: 'Code de pairing généré avec succès',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});