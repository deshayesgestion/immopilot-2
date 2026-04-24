import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SendEmailModal({ onClose, onSent, defaultTo = '' }) {
  const [form, setForm] = useState({ to: defaultTo, subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await base44.functions.invoke('sendEmailToClient', {
        to: form.to,
        subject: form.subject,
        body: form.body
      });
      
      setSent(true);
      onSent?.();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Envoyer un email</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium">Email envoyé avec succès !</p>
            <p className="text-xs text-muted-foreground">À : {form.to}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">À *</label>
              <Input
                required
                type="email"
                placeholder="client@email.com"
                value={form.to}
                onChange={(e) => setForm(p => ({ ...p, to: e.target.value }))}
                className="rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Sujet *</label>
              <Input
                required
                placeholder="Objet du message..."
                value={form.subject}
                onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                className="rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Message *</label>
              <Textarea
                required
                placeholder="Contenu du message..."
                value={form.body}
                onChange={(e) => setForm(p => ({ ...p, body: e.target.value }))}
                className="rounded-lg min-h-[150px] resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-lg">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="rounded-lg gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}