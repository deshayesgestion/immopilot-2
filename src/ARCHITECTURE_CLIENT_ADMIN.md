# 🏗️ ARCHITECTURE - SaaS CLIENT PILOTÉ À DISTANCE

**Concept:** Le SaaS Client = "Machine métier" exécutant les règles du SaaS Admin

---

## 📐 STRUCTURE GLOBALE

```
┌─────────────────────────────────────────────────────────┐
│                    SaaS ADMIN (Contrôle)                 │
│  • Configuration par agence                              │
│  • Tarifs & abonnements                                  │
│  • Permissions utilisateurs                              │
│  • Monitoring usage                                      │
│  • Facturation & analytics                               │
└──────────────┬──────────────────────────────────────────┘
               │
        📡 API SYNCHRONISATION
        (Polling 5min + Webhook)
               │
┌──────────────▼──────────────────────────────────────────┐
│              SaaS CLIENT (Exécution)                     │
│  • Workflows location/vente/compta                       │
│  • Documents PDF                                         │
│  • Signatures électroniques                              │
│  • IA scoring (local)                                    │
│  • Logs d'usage → remontée                               │
│  • Applique restrictions                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUX DE DONNÉES

### 1️⃣ Sync Configuration (Admin → Client)

**Quand:** Au démarrage + toutes les 5 min (polling)

```json
POST /api/client/config/sync

Request (Client):
{
  "agency_id": "agence-123",
  "client_version": "1.0.0",
  "last_sync": "2026-04-24T10:00:00Z"
}

Response (Admin):
{
  "agency_id": "agence-123",
  "configuration": {
    "modules": {
      "location": { "enabled": true, "max_dossiers": 100 },
      "vente": { "enabled": true, "max_dossiers": 50 },
      "comptabilite": { "enabled": false },
      "signatures": { "enabled": true, "provider": "yousign" },
      "calendar": { "enabled": true, "provider": "google" }
    },
    "permissions": {
      "agents": [
        { "email": "agent@agence.com", "role": "agent", "modules": ["location", "vente"] },
        { "email": "comptable@agence.com", "role": "comptable", "modules": ["comptabilite"] }
      ]
    },
    "features": {
      "ia_scoring": true,
      "automated_emails": true,
      "calendar_sync": true,
      "pdf_generation": true
    },
    "limits": {
      "daily_api_calls": 10000,
      "max_users": 5,
      "max_concurrent_pdfs": 10,
      "storage_gb": 50
    },
    "pricing": {
      "plan": "pro",
      "monthly_cost": 199,
      "next_billing": "2026-05-24"
    }
  },
  "timestamp": "2026-04-24T10:05:00Z"
}
```

### 2️⃣ Usage Reporting (Client → Admin)

**Quand:** Toutes les heures (ou event-driven pour critiques)

```json
POST /api/admin/usage/report

Request (Client):
{
  "agency_id": "agence-123",
  "period": "2026-04-24T09:00:00Z to 2026-04-24T10:00:00Z",
  "usage": {
    "modules": {
      "location": { "dossiers_created": 2, "actions": 45 },
      "vente": { "dossiers_created": 1, "actions": 12 },
      "comptabilite": { "actions": 0 }
    },
    "features": {
      "ia_scoring": { "calls": 3, "avg_time_ms": 450 },
      "pdfs_generated": 5,
      "emails_sent": 8,
      "signatures_requested": 2,
      "signatures_completed": 1
    },
    "performance": {
      "api_latency_ms": 145,
      "ui_responsiveness": "good",
      "errors_count": 0
    },
    "users_active": 3,
    "storage_used_gb": 2.4
  },
  "errors": [
    { "timestamp": "2026-04-24T09:45:00Z", "type": "pdf_generation_timeout", "details": "..." }
  ]
}

Response (Admin):
{
  "status": "ok",
  "message": "Usage recorded",
  "actions": [] // Si admin needs to update config
}
```

### 3️⃣ Restriction Enforcement (Client-side)

**Quand:** À chaque action utilisateur

```javascript
// Pseudo-code: Vérifier si action autorisée

async function canUserAction(user, action) {
  const config = await appConfig.getConfig();
  
  // Vérifier: module enabled?
  if (!config.modules[action.module].enabled) {
    throw new Error(`Module ${action.module} is disabled for this plan`);
  }
  
  // Vérifier: utilisateur has permission?
  const userRole = config.permissions[user.email]?.role;
  if (!userRole || !userRole.modules.includes(action.module)) {
    throw new Error(`User ${user.email} not authorized for ${action.module}`);
  }
  
  // Vérifier: quotas respectés?
  const usage = await usageTracker.getHourlyUsage();
  if (usage.api_calls > config.limits.daily_api_calls) {
    throw new Error(`Daily API quota exceeded`);
  }
  
  return true; // Action autorisée
}
```

---

## 📦 COMPOSANTS IMPLÉMENTATION

### Component 1: AppConfig Service

**Fichier:** `lib/AppConfigService.js`

```javascript
class AppConfigService {
  constructor() {
    this.config = null;
    this.lastSync = null;
    this.syncInterval = 5 * 60 * 1000; // 5 min
  }

  async initialize() {
    // Charger config au démarrage
    await this.syncConfig();
    // Poll en continu
    setInterval(() => this.syncConfig(), this.syncInterval);
  }

  async syncConfig() {
    try {
      const response = await fetch('/api/client/config/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: this.getAgencyId(),
          client_version: '1.0.0',
          last_sync: this.lastSync
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.config = data.configuration;
        this.lastSync = new Date();
        await this.applyConfiguration();
      }
    } catch (error) {
      console.error('Config sync failed:', error);
      // Fallback: use cached config
    }
  }

  isModuleEnabled(moduleName) {
    return this.config?.modules[moduleName]?.enabled ?? false;
  }

  getModuleLimit(moduleName, limitName) {
    return this.config?.modules[moduleName]?.[limitName] ?? 0;
  }

  getConfig() {
    return this.config;
  }

  private async applyConfiguration() {
    // Appliquer config: cacher modules disabled, etc
    this.updateUI();
  }

  private updateUI() {
    // Mettre à jour UI selon config
    // Ex: cacher onglet "Comptabilité" si module disabled
  }
}

export const appConfig = new AppConfigService();
```

### Component 2: Usage Tracker Service

**Fichier:** `lib/UsageTrackerService.js`

```javascript
class UsageTrackerService {
  constructor() {
    this.events = [];
    this.reportInterval = 60 * 60 * 1000; // 1h
    this.flushInterval = null;
  }

  initialize() {
    // Envoyer usage toutes les heures
    this.flushInterval = setInterval(() => this.flush(), this.reportInterval);
  }

  // Enregistrer action
  track(event) {
    this.events.push({
      timestamp: new Date().toISOString(),
      type: event.type,
      module: event.module,
      user_email: event.user_email,
      details: event.details,
      duration_ms: event.duration_ms
    });
  }

  // Enregistrer erreur
  trackError(error) {
    this.events.push({
      timestamp: new Date().toISOString(),
      type: 'error',
      error_type: error.type,
      error_message: error.message,
      stack: error.stack
    });
  }

  // Envoyer usage au SaaS admin
  async flush() {
    if (this.events.length === 0) return;

    try {
      const response = await fetch('/api/admin/usage/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: appConfig.getAgencyId(),
          period_start: this.getPeriodStart(),
          period_end: new Date().toISOString(),
          events: this.events
        })
      });

      if (response.ok) {
        this.events = []; // Clear après envoi OK
        const result = await response.json();
        
        // Si admin envoie actions (ex: update config)
        if (result.actions?.length > 0) {
          await this.processAdminActions(result.actions);
        }
      }
    } catch (error) {
      console.error('Usage report failed:', error);
      // Keep events, retry next hour
    }
  }

  private getPeriodStart() {
    const now = new Date();
    const hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
    return hour.toISOString();
  }

  async processAdminActions(actions) {
    // Exécuter actions reçues du admin
    // Ex: actions=[{ type: 'update_config' }]
    for (const action of actions) {
      if (action.type === 'update_config') {
        await appConfig.syncConfig();
      }
    }
  }
}

export const usageTracker = new UsageTrackerService();
```

### Component 3: Feature Gate Middleware

**Fichier:** `components/FeatureGate.jsx`

```jsx
import { appConfig } from '@/lib/AppConfigService';
import { usageTracker } from '@/lib/UsageTrackerService';

export function FeatureGate({ module, children, fallback }) {
  const isEnabled = appConfig.isModuleEnabled(module);

  if (!isEnabled) {
    return fallback || (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          Le module <strong>{module}</strong> n'est pas activé dans votre plan.
        </p>
        <p className="text-xs text-amber-600 mt-1">
          Contactez votre administrateur pour l'activer.
        </p>
      </div>
    );
  }

  return children;
}

// Usage dans navigation
export function AdminSidebar() {
  return (
    <nav>
      <FeatureGate module="location">
        <Link to="/admin/modules/location">🔑 Location</Link>
      </FeatureGate>
      
      <FeatureGate module="vente">
        <Link to="/admin/modules/vente">📈 Vente</Link>
      </FeatureGate>
      
      <FeatureGate module="comptabilite">
        <Link to="/admin/modules/comptabilite">💳 Comptabilité</Link>
      </FeatureGate>
    </nav>
  );
}
```

### Component 4: Action Interceptor (Restrictions)

**Fichier:** `hooks/useActionValidator.js`

```javascript
import { appConfig } from '@/lib/AppConfigService';
import { usageTracker } from '@/lib/UsageTrackerService';

export function useActionValidator() {
  const validateAction = async (action) => {
    const config = appConfig.getConfig();

    // Vérifier: module enabled?
    if (!config?.modules[action.module]?.enabled) {
      throw new Error(
        `Le module "${action.module}" n'est pas activé pour votre plan.`
      );
    }

    // Vérifier: quotas (ex: max 100 dossiers location)
    const dossierCount = await getDossierCount(action.module);
    const limit = config.modules[action.module].max_dossiers;
    if (dossierCount >= limit) {
      throw new Error(
        `Quota dépassé: maximum ${limit} dossiers ${action.module}.`
      );
    }

    // Vérifier: feature enabled? (ex: IA scoring)
    if (action.feature && !config.features[action.feature]) {
      throw new Error(
        `La fonctionnalité "${action.feature}" n'est pas disponible.`
      );
    }

    return true; // Action autorisée
  };

  const executeAction = async (action, fn) => {
    const startTime = Date.now();
    
    try {
      // Vérifier action autorisée
      await validateAction(action);

      // Exécuter action
      const result = await fn();

      // Tracker usage
      usageTracker.track({
        type: action.type,
        module: action.module,
        user_email: getCurrentUserEmail(),
        details: action.details,
        duration_ms: Date.now() - startTime
      });

      return result;
    } catch (error) {
      // Tracker erreur
      usageTracker.trackError({
        type: error.type || 'action_validation_error',
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  return { validateAction, executeAction };
}

// Usage dans composant
function CreateDossierForm() {
  const { executeAction } = useActionValidator();

  const handleCreate = async (formData) => {
    try {
      await executeAction(
        {
          type: 'create_dossier',
          module: 'location',
          feature: 'ia_scoring',
          details: { bien_id: formData.bien_id }
        },
        async () => {
          const dossier = await base44.entities.DossierLocatif.create(formData);
          return dossier;
        }
      );
    } catch (error) {
      // Afficher erreur restriction
      showError(error.message);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleCreate(new FormData(e.target));
    }}>
      {/* Form fields */}
    </form>
  );
}
```

---

## 🔌 INTÉGRATION AU DÉMARRAGE APP

**Fichier:** `main.jsx` ou `App.jsx`

```javascript
import { appConfig } from '@/lib/AppConfigService';
import { usageTracker } from '@/lib/UsageTrackerService';

async function initializeApp() {
  try {
    // 1. Charger configuration du SaaS admin
    await appConfig.initialize();
    console.log('✅ Configuration chargée');

    // 2. Démarrer tracking usage
    usageTracker.initialize();
    console.log('✅ Usage tracking actif');

    // 3. Appliquer restrictions
    await applyFeatureRestrictions();
    console.log('✅ Restrictions appliquées');

    // 4. Lancer app
    renderApp();
  } catch (error) {
    console.error('❌ Initialisation échouée:', error);
    showOfflineMode(); // Fallback mode si connexion admin impossible
  }
}

function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Routes */}
          </Routes>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
```

---

## 📊 FLUX COMPLET

```
┌─ USER ACTION (créer dossier)
│
├─→ useActionValidator.executeAction()
│   ├─→ Vérifier: module enabled?
│   ├─→ Vérifier: quotas respectés?
│   ├─→ Vérifier: features disponibles?
│   └─→ ✅ Autoriser action
│
├─→ Execute: base44.entities.DossierLocatif.create()
│
├─→ usageTracker.track() [logging local]
│
└─→ Toutes les heures:
    usageTracker.flush() [envoi au SaaS admin]
    
┌─ POLLING (5 min)
│
├─→ appConfig.syncConfig()
│   └─→ Récupérer nouvelle config du SaaS admin
│
└─→ Appliquer restrictions (re-validate)
```

---

## 🎯 AVANTAGES ARCHITECTURE

✅ **Décentralisé:** SaaS Client indépendant si admin offline  
✅ **Contrôlable:** Admin contrôle tout sans code push  
✅ **Scalable:** Ajouter agences sans code changes  
✅ **Observable:** Voir usage real-time de chaque agence  
✅ **Sécurisé:** Quotas + permissions appliquées localement  
✅ **Simple:** Client = exécution pure + reporting  

---

## 📝 PROCHAINES IMPLÉMENTATIONS

1. ✅ AppConfigService (sync config)
2. ✅ UsageTrackerService (logging + reporting)
3. ✅ FeatureGate (UI restrictions)
4. ✅ useActionValidator (action validation)
5. ⏳ Admin Dashboard (view usage, manage configs)
6. ⏳ Webhook support (real-time config updates)
7. ⏳ Offline mode (work when admin unreachable)