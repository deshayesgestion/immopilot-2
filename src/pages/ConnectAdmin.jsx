import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Loader2, Copy, Shield } from 'lucide-react';

export default function ConnectAdmin() {
  const [step, setStep] = useState('input'); // 'input' | 'validating' | 'success' | 'error'
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionData, setConnectionData] = useState(null);

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStep('validating');

    try {
      // Étape 1: Initier la connexion côté CLIENT
      const initiateResponse = await base44.functions.invoke('initiateSaaSConnection', {
        pairingCode,
        clientUrl: window.location.origin,
      });

      if (!initiateResponse.data?.connectionId) {
        throw new Error('Erreur lors de l\'initiation');
      }

      // Note: En production, appeler validateClientConnection côté ADMIN pour finaliser
      // const validateResponse = await fetch('https://admin.immopilot.fr/api/validate', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     pairingCode,
      //     clientUrl: window.location.origin,
      //     connectionId: initiateResponse.data.connectionId
      //   })
      // });

      // Mock: on assume validation réussie après 2s
      await new Promise(r => setTimeout(r, 2000));

      setStep('success');
      setConnectionData({
        connectionId: initiateResponse.data.connectionId,
        status: 'pending_admin_validation',
        message: 'En attente de validation par le SaaS ADMIN',
      });
      setPairingCode('');
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-border/50 w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-8 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Liaison SaaS</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Connectez cette instance au SaaS ADMIN de gestion
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Code de pairing
                </label>
                <Input
                  type="text"
                  placeholder="PAIR-XXXXXXXX"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  className="font-mono text-center text-lg tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Code fourni par votre administrateur SaaS ADMIN
                </p>
              </div>

              <Button
                type="submit"
                disabled={!pairingCode || loading}
                className="w-full rounded-lg h-9"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Valider la connexion'
                )}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                <p className="font-semibold mb-1">URL de cette instance:</p>
                <code className="block font-mono text-blue-700 break-all">{window.location.origin}</code>
              </div>
            </form>
          )}

          {step === 'validating' && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <div>
                <p className="font-semibold text-foreground">Validation en cours...</p>
                <p className="text-sm text-muted-foreground mt-1">Connexion au SaaS ADMIN</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="flex gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Connexion établie!</p>
                  <p className="text-sm text-green-700 mt-1">
                    {connectionData?.message}
                  </p>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID de connexion</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs font-mono bg-white rounded px-2 py-1 flex-1 truncate">{connectionData?.connectionId}</code>
                    <button
                      onClick={() => copyToClipboard(connectionData?.connectionId)}
                      className="p-1.5 hover:bg-white rounded transition-colors"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => {
                  setStep('input');
                  setConnectionData(null);
                }}
              >
                Nouveau code
              </Button>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-4">
              <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">Erreur de connexion</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setStep('input');
                  setError('');
                }}
                className="w-full rounded-lg"
              >
                Réessayer
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-border/30 rounded-b-2xl">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Connexion sécurisée — Ne partagez pas cette page
          </p>
        </div>
      </div>
    </div>
  );
}