import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function ConnectAdmin() {
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Envoyer le code au SaaS CLIENT pour l'enregistrer localement
      await base44.functions.invoke('initiateSaaSConnection', {
        pairingCode,
        clientUrl: window.location.origin,
      });

      // Code accepté - afficher message de succès
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-border/50 w-full max-w-md">
        <div className="px-6 py-8 border-b border-border/30">
          <h1 className="text-lg font-bold text-foreground mb-1">Activation SaaS</h1>
          <p className="text-sm text-muted-foreground">
            Entrez le code fourni par votre administrateur
          </p>
        </div>

        <form onSubmit={handleConnect} className="p-6 space-y-4">
          {success && (
            <div className="flex gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-green-700">
                <p className="font-semibold">Connexion réussie !</p>
                <p className="mt-1">Vous serez redirigé vers l'accueil dans quelques secondes...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
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
              required
            />
          </div>

          <Button
            type="submit"
            disabled={!pairingCode || loading || success}
            className="w-full rounded-lg h-9"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Connecté
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}