/**
 * Webhook Signature Validator — Fonction Backend
 * 
 * Valide les signatures HMAC des webhooks
 * Protège contre les replay attacks
 * 
 * POST /validateWebhookSignature
 * Body: { payload: string, signature: string, timestamp: number }
 */

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();
    const { payload, signature, timestamp, secretName = 'API_HMAC_SECRET', maxAgeSeconds = 300 } = body;

    if (!payload || !signature || !timestamp) {
      return Response.json(
        { error: 'payload, signature et timestamp requis' },
        { status: 400 }
      );
    }

    // Vérifier le timestamp (anti-replay)
    const now = Date.now();
    const ageMilils = now - timestamp;

    if (ageMilils > maxAgeSeconds * 1000) {
      return Response.json(
        { error: 'Webhook expiré (timestamp trop ancien)', isValid: false },
        { status: 401 }
      );
    }

    // Récupérer le secret
    const secret = Deno.env.get(secretName);
    if (!secret || secret.trim() === '') {
      console.error(`🚨 Secret "${secretName}" manquant`);
      return Response.json(
        { error: 'Configuration serveur invalide' },
        { status: 500 }
      );
    }

    // Calculer la signature attendue
    const fullPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(fullPayload));
    const expectedSig = Array.from(new Uint8Array(expectedSigBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Comparaison sécurisée (constant-time)
    let result = 0;
    const minLen = Math.min(expectedSig.length, signature.length);
    for (let i = 0; i < minLen; i++) {
      result |= expectedSig.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    result |= expectedSig.length ^ signature.length;

    const isValid = result === 0;

    if (!isValid) {
      console.warn('❌ Webhook: Signature invalide (tampering détecté)');
    } else {
      console.log('✅ Webhook: Signature valide');
    }

    return Response.json({
      isValid,
      timestamp,
      ageMillis: ageMilils,
      message: isValid ? 'Webhook vérifié avec succès' : 'Signature invalide',
    });
  } catch (error) {
    console.error('Webhook validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});