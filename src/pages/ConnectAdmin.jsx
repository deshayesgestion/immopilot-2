import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Loader2, Copy } from 'lucide-react';

export default function ConnectAdmin() {
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [connectionData, setConnectionData] = useState(null);

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Appeler la fonction backend CLIENT
      const response = await base44.functions.invoke('initiateSaaSConnection', {
        pairingCode,
        clientUrl: window.location.origin,
      });

      if (response.data?.connectionId) {
        setSuccess(true);
        setConnectionData(response.data);
        setPairingCode('');
      } else {
        setError('Erreur lors de l\'initiation de la connexion');
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-border/50 w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-8 border-b border-border/30">
          <h1 className="text-2xl font-bold text-foreground mb-2">Connexion SaaS</h1>
          <p className="text-sm text-muted-foreground">
            Connectez votre instance CLIENT au SaaS ADMIN
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!success ? (
            <form onSubmit={handleConnect} className="space-y-4">
              {error && (
                <div className="flex gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Code de pairing
                </label>
                <Input
                  type="text"
                  placeholder="PAIR-XXXXXXXXXXXX"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Fourni par votre administrateur SaaS ADMIN
                </p>
              </div>

              <Button
                type="submit"
                disabled={!pairingCode || loading}
                className="w-full rounded-lg gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Connecter'
                )}
              </Button>

              <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground">
                <strong>URL CLIENT:</strong>
                <code className="block mt-1 font-mono break-all">{window.location.origin}</code>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Connexion réussie!</p>
                  <p className="text-sm text-green-700">
                    En attente de validation par le SaaS ADMIN
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    ID de connexion
                  </p>
                  <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2">
                    <code className="text-sm font-mono flex-1 truncate">{connectionData?.connectionId}</code>
                    <button
                      onClick={() => copyToClipboard(connectionData?.connectionId)}
                      className="p-1.5 hover:bg-secondary/60 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Statut
                  </p>
                  <div className="inline-block px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                    En attente de validation
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => {
                  setSuccess(false);
                  setConnectionData(null);
                }}
              >
                Nouveau code
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-secondary/20 border-t border-border/30 rounded-b-2xl">
          <p className="text-xs text-muted-foreground">
            Cette page est confidentielle. Ne la partagez pas.
          </p>
        </div>
      </div>
    </div>
  );
}