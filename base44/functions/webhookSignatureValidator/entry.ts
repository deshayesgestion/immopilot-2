/**
 * Webhook Signature Validator
 * 
 * Valide les signatures HMAC des webhooks reçus
 * Protège contre les replay attacks avec timestamps
 */

/**
 * Valider la signature d'un webhook entrant
 * @param {Request} req - Requête HTTP
 * @param {string} secretName - Nom du secret à utiliser
 * @param {number} maxAgeSeconds - Âge maximum du timestamp (défaut: 300s)
 * @returns {Promise<boolean>}
 */
export async function validateWebhookSignature(
  req,
  secretName = 'API_HMAC_SECRET',
  maxAgeSeconds = 300
) {
  try {
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      console.warn('❌ Webhook: Signature ou timestamp manquant');
      return false;
    }

    // Vérifier le timestamp (anti-replay)
    const webhookTime = parseInt(timestamp);
    const now = Date.now();
    const ageMilils = now - webhookTime;

    if (ageMilils > maxAgeSeconds * 1000) {
      console.warn(`❌ Webhook: Timestamp expiré`);
      return false;
    }

    // Récupérer le body et le secret
    const body = await req.text();
    const secret = Deno.env.get(secretName);

    if (!secret || secret.trim() === '') {
      console.error(`🚨 Webhook: Secret "${secretName}" manquant`);
      return false;
    }

    // Calculer signature attendue
    const payload = `${timestamp}.${body}`;
    const expectedSig = await signPayload(payload, secret);

    // Comparaison sécurisée (constant-time)
    const isValid = constantTimeCompare(expectedSig, signature);

    if (!isValid) {
      console.warn('❌ Webhook: Signature invalide');
    } else {
      console.log('✅ Webhook: Signature valide');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Webhook validation error:', error);
    return false;
  }
}

/**
 * Signer un payload avec HMAC-SHA256
 */
async function signPayload(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Comparaison constant-time
 */
function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export default {
  validateWebhookSignature,
};