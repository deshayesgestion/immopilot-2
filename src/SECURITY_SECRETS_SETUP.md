# 🔐 Configuration des Secrets Obligatoires

**⚠️ CRITIQUE** : Tous les secrets ci-dessous DOIVENT être configurés avant le déploiement en production.

---

## 📋 Secrets Requis

### 1️⃣ **JWT_SECRET**
- **Description** : Clé secrète pour signer les JWT tokens d'authentification
- **Longueur minimale** : 32 caractères
- **Générer** :
  ```bash
  openssl rand -base64 32
  ```

### 2️⃣ **ADMIN_SECRET**
- **Description** : Secret admin pour les opérations sensibles (pairing codes, config SaaS)
- **Longueur minimale** : 32 caractères
- **Générer** :
  ```bash
  openssl rand -base64 32
  ```

### 3️⃣ **API_HMAC_SECRET**
- **Description** : Clé HMAC pour signer les requêtes API et webhooks
- **Longueur minimale** : 32 caractères
- **Générer** :
  ```bash
  openssl rand -base64 32
  ```

### 4️⃣ **WEBHOOK_VERIFICATION_SECRET**
- **Description** : Secret spécifique pour vérifier les signatures webhook
- **Longueur minimale** : 32 caractères
- **Générer** :
  ```bash
  openssl rand -base64 32
  ```

### 5️⃣ **API_ENCRYPTION_KEY**
- **Description** : Clé AES-256 pour chiffrer les API keys stockées
- **Longueur minimale** : 32 caractères
- **Générer** :
  ```bash
  openssl rand -base64 32
  ```

### 6️⃣ **SAAS_ADMIN_URL**
- **Description** : URL du SaaS Admin (e.g., https://admin.immopilot.fr)
- **Exemple** : `https://admin.immopilot.fr`
- **Longueur minimale** : 10 caractères

### 7️⃣ **SAAS_WEBHOOK_SECRET**
- **Description** : Secret partagé entre SaaS Admin et SaaS Client
- **Longueur minimale** : 32 caractères
- **Générer** :
  ```bash
  openssl rand -base64 32
  ```

---

## 🚀 Configuration

### Base44 Dashboard
1. Allez à **Settings → Secrets**
2. Créez chaque secret avec les valeurs générées :

```
JWT_SECRET = <valeur>
ADMIN_SECRET = <valeur>
API_HMAC_SECRET = <valeur>
WEBHOOK_VERIFICATION_SECRET = <valeur>
API_ENCRYPTION_KEY = <valeur>
SAAS_ADMIN_URL = https://admin.immopilot.fr
SAAS_WEBHOOK_SECRET = <valeur>
```

3. Sauvegardez et vérifiez que chaque secret est bien enregistré

### Variables Locales (.env pour dev)
```env
JWT_SECRET=your_jwt_secret_here
ADMIN_SECRET=your_admin_secret_here
API_HMAC_SECRET=your_api_hmac_secret_here
WEBHOOK_VERIFICATION_SECRET=your_webhook_verification_secret_here
API_ENCRYPTION_KEY=your_api_encryption_key_here
SAAS_ADMIN_URL=https://admin.immopilot.fr
SAAS_WEBHOOK_SECRET=your_saas_webhook_secret_here
```

---

## ✅ Vérification

Pour tester que les secrets sont correctement configurés :

```javascript
import { getValidatedSecrets } from '@/lib/securityManager';

try {
  const secrets = getValidatedSecrets();
  console.log('✅ Tous les secrets sont validés');
} catch (error) {
  console.error('❌ Erreur de configuration:', error.message);
}
```

---

## 🔄 Rotation des Secrets

Pour changer un secret en production :

1. **Générer une nouvelle valeur**
2. **Mettre à jour dans Base44 Dashboard**
3. **Déployer les changements**
4. **Vérifier les logs** pour s'assurer que le nouveau secret est utilisé

⚠️ **Important** : Ne supprimez jamais l'ancien secret immédiatement — gardez-le 24h en cas de rollback.

---

## 🛡️ Bonnes Pratiques

- ✅ Jamais partager les secrets en git/public
- ✅ Chaque environnement (dev, staging, prod) a ses propres secrets
- ✅ Rotate les secrets tous les 3-6 mois
- ✅ Loggez chaque accès aux secrets sensibles
- ✅ Utilisez `getSecret()` au lieu de `process.env.DIRECT`

---

## 📞 Aide

Si un secret est manquant, vous recevrez une erreur :
```
🚨 ERREUR CRITIQUE: Variable d'environnement "JWT_SECRET" manquante!
```

**Action** : Configurez le secret manquant dans Base44 Dashboard.