/**
 * ⚠️ BACKEND ONLY — Security Manager
 * 
 * Gestion centralisée des secrets & variables d'environnement
 * À utiliser UNIQUEMENT dans les fonctions backend (functions/)
 * 
 * RÈGLES :
 * - Aucun secret en dur dans le code
 * - Toutes les variables d'environnement sont OBLIGATOIRES
 * - Erreur si variable manquante
 * 
 * Ne pas importer côté frontend !
 */

// ── VALIDATION SECRETS OBLIGATOIRES ────────────────────────────────────────

const REQUIRED_SECRETS = {
  // Authentification & JWT
  JWT_SECRET: { description: 'Clé secrète pour signer les JWT tokens', minLength: 32 },
  ADMIN_SECRET: { description: 'Secret admin pour opérations sensibles', minLength: 32 },
  
  // API & Webhooks
  API_HMAC_SECRET: { description: 'Clé HMAC pour signer les webhooks', minLength: 32 },
  WEBHOOK_VERIFICATION_SECRET: { description: 'Secret de vérification webhooks', minLength: 32 },
  
  // Chiffrement
  API_ENCRYPTION_KEY: { description: 'Clé AES-256 pour chiffrer les API keys', minLength: 32 },
  
  // SaaS
  SAAS_ADMIN_URL: { description: 'URL du SaaS Admin', minLength: 10 },
  SAAS_WEBHOOK_SECRET: { description: 'Secret partagé SaaS <> Client', minLength: 32 },
};

/**
 * Valider qu'un secret est présent et respecte les contraintes
 * BACKEND ONLY — À utiliser dans les fonctions Deno
 * @throws {Error} Si le secret est invalide ou manquant
 */
function getEnv(name) {
  // Utiliser globalThis pour accéder à Deno de manière compatible
  if (typeof globalThis !== 'undefined' && globalThis.Deno) {
    return globalThis.Deno.env.get(name);
  }
  return null;
}

export function validateSecret(secretName, value = null) {
  const config = REQUIRED_SECRETS[secretName];
  
  if (!config) {
    throw new Error(`❌ Secret "${secretName}" n'est pas connu. Vérifiez la configuration.`);
  }
  
  const actualValue = value || getEnv(secretName);
  
  if (!actualValue || actualValue.trim() === '') {
    throw new Error(
      `🚨 ERREUR CRITIQUE: Variable d'environnement "${secretName}" manquante!\n` +
      `Description: ${config.description}\n` +
      `Longueur minimale: ${config.minLength} caractères`
    );
  }
  
  if (actualValue.length < config.minLength) {
    throw new Error(
      `❌ Secret "${secretName}" trop court (${actualValue.length}/${config.minLength} min)`
    );
  }
  
  return actualValue;
}

/**
 * Obtenir tous les secrets validés au démarrage
 * BACKEND ONLY
 * @returns {Object} Dictionnaire des secrets validés
 */
export function getValidatedSecrets() {
  const secrets = {};
  const errors = [];
  
  for (const [secretName, config] of Object.entries(REQUIRED_SECRETS)) {
    try {
      secrets[secretName] = validateSecret(secretName);
    } catch (error) {
      errors.push(error.message);
    }
  }
  
  if (errors.length > 0) {
    console.error('\n' + '='.repeat(60));
    console.error('🔐 ERREURS DE CONFIGURATION SECRETS');
    console.error('='.repeat(60));
    errors.forEach(e => console.error('\n' + e));
    console.error('\n' + '='.repeat(60) + '\n');
    throw new Error('Configuration des secrets incomplète. Arrêt.');
  }
  
  console.log('✅ Tous les secrets sont validés et présents');
  return secrets;
}

/**
 * Obtenir un secret spécifique avec validation
 * BACKEND ONLY
 */
export function getSecret(secretName) {
  return validateSecret(secretName);
}

/**
 * Vérifier l'intégrité d'une signature HMAC
 * @param {string} payload - Données signées
 * @param {string} signature - Signature reçue
 * @param {string} secretName - Nom du secret à utiliser
 * @returns {boolean}
 */
export async function verifyHmacSignature(payload, signature, secretName = 'API_HMAC_SECRET') {
  const secret = getSecret(secretName);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Comparaison sécurisée (constant-time)
  return constantTimeCompare(expectedHex, signature);
}

/**
 * Signer un payload avec HMAC
 * @param {string} payload - Données à signer
 * @param {string} secretName - Nom du secret à utiliser
 * @returns {Promise<string>} Signature hex
 */
export async function signHmac(payload, secretName = 'API_HMAC_SECRET') {
  const secret = getSecret(secretName);
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
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Comparaison de chaînes sécurisée (constant-time)
 * Protège contre les timing attacks
 */
function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Obtenir la liste de tous les secrets requis (pour documentation)
 */
export function getRequiredSecretsInfo() {
  return Object.entries(REQUIRED_SECRETS).map(([name, config]) => ({
    name,
    ...config,
  }));
}

export default {
  validateSecret,
  getValidatedSecrets,
  getSecret,
  verifyHmacSignature,
  signHmac,
  getRequiredSecretsInfo,
};