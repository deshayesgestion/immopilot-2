# 📖 GUIDE D'INTÉGRATION - Architecture Client-Admin

## 1️⃣ INITIALISATION AU DÉMARRAGE APP

### Modifier `main.jsx`

```javascript
import { appConfig } from '@/lib/AppConfigService';
import { usageTracker } from '@/lib/UsageTrackerService';

async function initializeApp() {
  try {
    // 1. Charger config du SaaS admin
    await appConfig.initialize();
    
    // 2. Démarrer tracking usage
    usageTracker.initialize();
    
    console.log('✅ App initialized');
  } catch (error) {
    console.error('Init error:', error);
  }
}

// Appeler au démarrage
initializeApp();
```

---

## 2️⃣ UTILISER FEATURE GATES DANS NAVIGATION

### Modifier `components/admin/AdminSidebar.jsx`

```jsx
import { FeatureGate, AvailableModules, ConfigStatusPanel } from '@/components/FeatureGate';

export function AdminSidebar() {
  return (
    <nav className="space-y-2">
      <ConfigStatusPanel />
      
      <FeatureGate module="location">
        <Link to="/admin/modules/location" className="menu-item">
          🔑 Location
        </Link>
      </FeatureGate>

      <FeatureGate module="vente">
        <Link to="/admin/modules/vente" className="menu-item">
          📈 Vente
        </Link>
      </FeatureGate>

      <FeatureGate module="comptabilite">
        <Link to="/admin/modules/comptabilite" className="menu-item">
          💳 Comptabilité
        </Link>
      </FeatureGate>

      <FeatureGate feature="ia_scoring">
        <Link to="/admin/ai" className="menu-item">
          🤖 IA & Scoring
        </Link>
      </FeatureGate>

      {/* Modules non disponibles cachés automatiquement */}
    </nav>
  );
}
```

---

## 3️⃣ VALIDER ACTIONS AVEC RESTRICTIONS

### Modifier composant de création dossier

```jsx
import { useActionValidator } from '@/hooks/useActionValidator';

function CreateDossierForm() {
  const { executeAction, canExecuteAction } = useActionValidator();
  const [isEnabled, setIsEnabled] = useState(true);

  // Vérifier si action possible (pour disabler bouton)
  useEffect(() => {
    canExecuteAction({
      type: 'create_dossier',
      module: 'location',
      feature: 'ia_scoring'
    }).then(setIsEnabled);
  }, [canExecuteAction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await executeAction(
        {
          type: 'create_dossier',
          module: 'location',
          feature: 'ia_scoring',
          details: { bien_id: formData.bien_id },
          // Quotas à vérifier
          quota: {
            key: 'max_dossiers',
            current: dossierCount // À calculer depuis BD
          }
        },
        async () => {
          // Créer le dossier
          const dossier = await base44.entities.DossierLocatif.create(formData);
          return dossier;
        }
      );
      
      // Succès
      showSuccess('Dossier créé');
    } catch (error) {
      // Erreur (quota, module disabled, etc)
      showError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={!isEnabled}>
        Créer dossier
      </button>
    </form>
  );
}
```

---

## 4️⃣ TRACKER USAGE DES FEATURES

### Dans les pages/modules

```javascript
import { usageTracker } from '@/lib/UsageTrackerService';

// Tracker génération PDF
async function generateBailPDF(dossier) {
  const startTime = Date.now();
  
  try {
    const pdf = await generatePDF(dossier, 'bail');
    
    usageTracker.trackFeatureUsage('pdf_generation', {
      module: 'location',
      template: 'bail',
      duration_ms: Date.now() - startTime,
      file_size_kb: pdf.size / 1024
    });
    
    return pdf;
  } catch (error) {
    usageTracker.trackError({
      type: 'pdf_generation_error',
      message: error.message,
      module: 'location'
    });
    throw error;
  }
}

// Tracker signature
async function requestSignature(document) {
  try {
    const result = await signatureService.request(document);
    
    usageTracker.track({
      type: 'signature_requested',
      module: 'location',
      details: { doc_type: document.type }
    });
    
    return result;
  } catch (error) {
    usageTracker.trackError({
      type: 'signature_error',
      message: error.message,
      module: 'location'
    });
    throw error;
  }
}

// Tracker scoring IA
async function scoreCandidat(candidat) {
  const startTime = Date.now();
  
  try {
    const score = await invokeAI(candidat);
    
    usageTracker.trackFeatureUsage('ia_scoring', {
      module: 'location',
      score: score.value,
      duration_ms: Date.now() - startTime
    });
    
    return score;
  } catch (error) {
    usageTracker.trackError({
      type: 'ia_scoring_error',
      message: error.message,
      module: 'location'
    });
    throw error;
  }
}
```

---

## 5️⃣ API BACKEND - ENDPOINTS À CRÉER

### Créer les endpoints SaaS Client

```javascript
// backend/functions/clientConfigSync.js
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { agency_id, client_version, last_sync } = await req.json();

  // Récupérer config de l'agence
  const config = await getAgencyConfig(agency_id); // À implémenter

  return Response.json({
    configuration: config,
    timestamp: new Date().toISOString()
  });
});

// backend/functions/clientUsageReport.js
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { agency_id, period_start, period_end, events } = await req.json();

  // Sauvegarder usage
  await saveUsageReport(agency_id, {
    period_start,
    period_end,
    events_count: events.length,
    events
  });

  // Analyser usage pour potentielles actions
  const actions = await analyzeUsageAndGenerateActions(agency_id, events);

  return Response.json({
    status: 'ok',
    actions // Actions à appliquer côté client
  });
});
```

---

## 6️⃣ TESTER LOCALEMENT

### Simuler config Admin

```javascript
// lib/MockConfigService.js (pour testing)
export const mockConfig = {
  modules: {
    location: { enabled: true, max_dossiers: 100 },
    vente: { enabled: true, max_dossiers: 50 },
    comptabilite: { enabled: false } // Désactivé
  },
  features: {
    ia_scoring: true,
    pdf_generation: true,
    calendar_sync: true
  },
  limits: {
    daily_api_calls: 10000,
    max_users: 5,
    storage_gb: 50
  },
  pricing: {
    plan: 'pro',
    monthly_cost: 199
  }
};

// Dans AppConfigService pour dev
if (process.env.NODE_ENV === 'development') {
  // Charger mock config si API unavailable
  if (!config) {
    this.config = mockConfig;
    console.log('Using mock config for development');
  }
}
```

---

## 7️⃣ DASHBOARD ADMIN - AFFICHER USAGE

### Créer page d'analytics agences

```jsx
// pages/admin/AdminAgencyAnalytics.jsx

function AdminAgencyAnalytics({ agencyId }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageReport(agencyId).then(setUsage).finally(() => setLoading(false));
  }, [agencyId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1>Usage Agence {agencyId}</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <p className="text-muted-foreground">Dossiers Location</p>
          <p className="text-2xl font-bold">{usage.location_dossiers}</p>
        </Card>
        <Card>
          <p className="text-muted-foreground">Dossiers Vente</p>
          <p className="text-2xl font-bold">{usage.vente_dossiers}</p>
        </Card>
        <Card>
          <p className="text-muted-foreground">PDFs Générés</p>
          <p className="text-2xl font-bold">{usage.pdfs_generated}</p>
        </Card>
        <Card>
          <p className="text-muted-foreground">Signatures</p>
          <p className="text-2xl font-bold">{usage.signatures_completed}</p>
        </Card>
      </div>

      {/* Timeline usage */}
      <UsageChart data={usage.hourly_data} />

      {/* Errors */}
      <ErrorsPanel errors={usage.errors} />

      {/* Config appliquée */}
      <ConfigPanel agencyId={agencyId} />
    </div>
  );
}
```

---

## 8️⃣ CHECKLIST D'INTÉGRATION

- [ ] Créer `lib/AppConfigService.js`
- [ ] Créer `lib/UsageTrackerService.js`
- [ ] Créer `hooks/useActionValidator.js`
- [ ] Créer `components/FeatureGate.jsx`
- [ ] Modifier `main.jsx` pour initialiser services
- [ ] Modifier `AdminSidebar.jsx` pour utiliser FeatureGate
- [ ] Ajouter validation dans composants critiques (CreateDossier, etc)
- [ ] Ajouter tracking usage dans features principales
- [ ] Créer endpoints backend (clientConfigSync, clientUsageReport)
- [ ] Créer page admin pour afficher usage/analytics agences
- [ ] Tester avec mock config en local
- [ ] Tester avec vrai endpoint une fois prêt

---

## 9️⃣ RÉSULTAT FINAL

✅ SaaS Client = "Machine métier" piloté à distance  
✅ Configuration synchronisée depuis Admin  
✅ Restrictions appliquées localement  
✅ Usage trackë et reporté au Admin  
✅ Scalable: ajouter agences sans code  

**Prochaine étape:** Créer dashboard Admin pour gérer configs et voir analytics