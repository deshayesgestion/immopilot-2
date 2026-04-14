import { useState } from 'react';
import { Copy, Check, Code2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const endpoints = [
  {
    name: 'generatePairingCode',
    method: 'POST',
    description: 'Génère un code de pairing unique pour un nouveau client',
    role: 'Admin SaaS ADMIN',
    request: {
      clientName: 'string (required)',
      agencyId: 'string (optional)',
      plan: 'string (starter | professional | enterprise)',
      modules: 'array (location, vente, comptabilite)',
    },
    response: {
      success: 'boolean',
      code: 'string (PAIR-XXXXXXXX)',
      tenantId: 'string',
      clientName: 'string',
      plan: 'string',
      modules: 'array',
      expiresAt: 'ISO datetime (7 days)',
      message: 'string',
    },
    example: {
      request: JSON.stringify({
        clientName: 'Mon Agence Immobilière',
        agencyId: 'agency_123',
        plan: 'professional',
        modules: ['location', 'vente', 'comptabilite'],
      }, null, 2),
      response: JSON.stringify({
        success: true,
        code: 'PAIR-A1B2C3D4E5F6G7H8',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        clientName: 'Mon Agence Immobilière',
        plan: 'professional',
        modules: ['location', 'vente', 'comptabilite'],
        expiresAt: '2026-04-21T10:00:00.000Z',
        message: 'Code de pairing généré avec succès',
      }, null, 2),
    },
  },
  {
    name: 'initiateSaaSConnection',
    method: 'POST',
    description: 'Initie la connexion au SaaS ADMIN avec le code de pairing (appelé par SaaS CLIENT)',
    role: 'User SaaS CLIENT',
    request: {
      pairingCode: 'string (PAIR-XXXXXXXX, required)',
      clientUrl: 'string (URL du SaaS CLIENT, required)',
    },
    response: {
      connectionId: 'string',
      status: 'string (pending)',
      message: 'string',
    },
    example: {
      request: JSON.stringify({
        pairingCode: 'PAIR-A1B2C3D4E5F6G7H8',
        clientUrl: 'https://client.immopilot.fr',
      }, null, 2),
      response: JSON.stringify({
        connectionId: 'conn_123456',
        status: 'pending',
        message: 'Connexion en attente de validation par le SaaS ADMIN',
      }, null, 2),
    },
  },
  {
    name: 'validateClientConnection',
    method: 'POST',
    description: 'Valide et finalise la connexion d\'un SaaS CLIENT (appel de SaaS ADMIN)',
    role: 'Admin SaaS ADMIN',
    request: {
      pairingCode: 'string (PAIR-XXXXXXXX, required)',
      clientUrl: 'string (URL du SaaS CLIENT, required)',
    },
    response: {
      success: 'boolean',
      tenantId: 'string',
      apiKey: 'string (sk_...)',
      plan: 'string',
      modules: 'array',
      adminUrl: 'string',
      syncInterval: 'number (heures)',
      status: 'string (connected)',
      message: 'string',
    },
    example: {
      request: JSON.stringify({
        pairingCode: 'PAIR-A1B2C3D4E5F6G7H8',
        clientUrl: 'https://client.immopilot.fr',
      }, null, 2),
      response: JSON.stringify({
        success: true,
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        apiKey: 'sk_abcdef1234567890abcdef1234567890',
        plan: 'professional',
        modules: ['location', 'vente', 'comptabilite'],
        adminUrl: 'https://admin.immopilot.fr',
        syncInterval: 24,
        status: 'connected',
        message: 'Connexion validée avec succès',
      }, null, 2),
    },
  },
];

function CodeBlock({ code, language = 'json' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto font-mono">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
      </button>
    </div>
  );
}

function EndpointCard({ endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <code className="bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg text-sm font-mono font-bold">
                {endpoint.method}
              </code>
              <code className="text-sm font-mono text-slate-600">/api/{endpoint.name}</code>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
            <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {endpoint.role}
            </span>
          </div>
        </div>

        {/* Request/Response Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-border/30">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Paramètres</p>
            <div className="space-y-1 text-xs text-slate-600">
              {Object.entries(endpoint.request).map(([key, type]) => (
                <div key={key} className="font-mono">
                  <span className="text-slate-900 font-semibold">{key}</span>
                  <span className="text-slate-400"> — {type}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Réponse</p>
            <div className="space-y-1 text-xs text-slate-600">
              {Object.entries(endpoint.response).map(([key, type]) => (
                <div key={key} className="font-mono">
                  <span className="text-slate-900 font-semibold">{key}</span>
                  <span className="text-slate-400"> — {type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expand button */}
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="outline"
          className="w-full gap-2 text-sm h-9 rounded-lg"
        >
          <Code2 className="w-4 h-4" />
          {expanded ? 'Masquer les exemples' : 'Voir les exemples'}
        </Button>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-border/30 space-y-6">
            <div>
              <p className="text-sm font-bold mb-3">Exemple de requête</p>
              <CodeBlock code={endpoint.example.request} />
            </div>
            <div>
              <p className="text-sm font-bold mb-3">Exemple de réponse</p>
              <CodeBlock code={endpoint.example.response} />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> Remplacez les valeurs d'exemple par les vôtres. Les endpoints sont déployés automatiquement et accessibles via POST.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAPI() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Documentation API</h1>
        <p className="text-sm text-muted-foreground">
          Endpoints pour la gestion des connexions SaaS entre Admin et Client
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Où trouver les URLs réelles:</strong> Consultez <strong>Dashboard → Code → Functions</strong> pour chaque fonction pour obtenir son URL complète.
          Les endpoints sont déployés automatiquement avec la structure: <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[11px] font-mono">https://your-domain/api/functionName</code>
        </p>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {endpoints.map((endpoint) => (
          <EndpointCard key={endpoint.name} endpoint={endpoint} />
        ))}
      </div>

      {/* Flux */}
      <div className="bg-white rounded-2xl border border-border/50 p-6">
        <h2 className="text-lg font-bold mb-4">Flux de connexion</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div>
              <p className="font-semibold text-sm">Admin ADMIN génère un code</p>
              <p className="text-xs text-muted-foreground mt-1">
                Appel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono">POST /generatePairingCode</code>
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div>
              <p className="font-semibold text-sm">Client utilise le code</p>
              <p className="text-xs text-muted-foreground mt-1">
                Appel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono">POST /initiateSaaSConnection</code>
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <div>
              <p className="font-semibold text-sm">Admin valide la connexion</p>
              <p className="text-xs text-muted-foreground mt-1">
                Appel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono">POST /validateClientConnection</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}