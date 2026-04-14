import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Copy, Loader2, Check, X, Plus, Eye, EyeOff, Trash2, Lock } from 'lucide-react';

function GeneratePairingCodeModal({ onClose, onGenerated }) {
  const [form, setForm] = useState({
    clientName: '',
    plan: 'professional',
    modules: ['location', 'vente', 'comptabilite'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('generatePairingCode', form);
      onGenerated(response.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (module) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter(m => m !== module)
        : [...prev.modules, module]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold">Nouveau code de pairing</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary/60 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Nom du client</label>
            <Input
              value={form.clientName}
              onChange={e => setForm({ ...form, clientName: e.target.value })}
              placeholder="Agence Immobilière XYZ"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Plan</label>
            <select
              value={form.plan}
              onChange={e => setForm({ ...form, plan: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-input"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Modules</label>
            <div className="space-y-2">
              {['location', 'vente', 'comptabilite'].map(mod => (
                <label key={mod} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.modules.includes(mod)}
                    onChange={() => toggleModule(mod)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{mod.charAt(0).toUpperCase() + mod.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={!form.clientName || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Générer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminClientLinks() {
  const [pairings, setPairings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [showCode, setShowCode] = useState({});

  const loadPairings = async () => {
    try {
      const data = await base44.entities.AdminPairingCode.list('-created_date', 100);
      setPairings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPairings();
  }, []);

  const handleGeneratedCode = (data) => {
    setGeneratedCode(data);
    setPairings(prev => [{ ...data, id: 'temp' }, ...prev]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      connected: 'bg-green-100 text-green-700',
      suspended: 'bg-red-100 text-red-700',
      blocked: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || 'bg-gray-100';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showModal && <GeneratePairingCodeModal onClose={() => setShowModal(false)} onGenerated={handleGeneratedCode} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Liaisons Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les connexions SaaS CLIENT</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="rounded-full gap-2">
          <Plus className="w-4 h-4" /> Nouveau code
        </Button>
      </div>

      {generatedCode && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900 mb-2">Code généré: {generatedCode.clientName}</p>
              <div className="bg-white rounded-lg p-3 font-mono text-sm border border-green-200 mb-2">
                {generatedCode.code}
              </div>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedCode.code)} className="gap-2">
                <Copy className="w-4 h-4" /> Copier le code
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : pairings.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune liaison encore</p>
          </div>
        ) : (
          <div className="divide-y">
            {pairings.map(p => (
              <div key={p.id} className="p-5 hover:bg-secondary/20 transition-colors">
                <div className="flex items-start gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{p.client_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Tenant: {p.tenant_id}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusColor(p.status)}`}>
                    {p.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                  <div>
                    <p className="text-muted-foreground">Plan</p>
                    <p className="font-semibold text-foreground">{p.plan}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Modules</p>
                    <p className="font-semibold text-foreground">{p.modules?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Connecté</p>
                    <p className="font-semibold text-foreground">{p.connected_at ? '✓' : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Code expires</p>
                    <p className="font-semibold text-foreground">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}</p>
                  </div>
                </div>

                {p.api_key && (
                  <div className="bg-secondary/30 rounded-lg p-2 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <code className="flex-1 truncate font-mono text-muted-foreground">
                        {showCode[p.id] ? p.api_key : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <button
                        onClick={() => setShowCode(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        {showCode[p.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(p.api_key)}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">Voir détails</Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}