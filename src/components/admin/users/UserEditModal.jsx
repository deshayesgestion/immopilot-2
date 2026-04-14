import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { INTERNAL_ROLES, CLIENT_ROLES, ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";

/**
 * UserEditModal — Modification des données utilisateur et rôle
 */
export default function UserEditModal({ user, onClose, onUpdate, currentUser }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    role: user?.role || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allRoles = [...INTERNAL_ROLES, ...CLIENT_ROLES];
  const isAdmin = currentUser?.role === "admin";
  const canChangeRole = isAdmin && user?.id !== currentUser?.id; // Pas changer son propre rôle

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError("Le nom est requis");
      return;
    }

    setSaving(true);
    try {
      const updates = { full_name: form.full_name };
      if (canChangeRole && form.role !== user.role) {
        updates.role = form.role;
      }
      await base44.auth.updateMe(updates);
      onUpdate();
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-border/50 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-lg font-bold">Modifier l'utilisateur</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Erreur */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Email (lecture seule) */}
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">
              Email
            </label>
            <div className="px-3 py-2.5 rounded-lg bg-secondary/30 border border-input text-sm text-foreground/70">
              {user?.email}
            </div>
          </div>

          {/* Nom complet */}
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">
              Nom complet
            </label>
            <Input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="Nom complet"
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">
              Rôle {!canChangeRole && <span className="text-destructive">(non modifiable)</span>}
            </label>
            <select
              value={form.role}
              onChange={e => canChangeRole && setForm({ ...form, role: e.target.value })}
              disabled={!canChangeRole}
              className={`w-full h-9 px-3 rounded-lg border border-input text-sm ${
                canChangeRole ? "bg-white cursor-pointer" : "bg-secondary/30 cursor-not-allowed opacity-60"
              }`}
            >
              <option value="">Choisir un rôle</option>
              <optgroup label="Équipe interne">
                {INTERNAL_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </optgroup>
              <optgroup label="Clients">
                {CLIENT_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </optgroup>
            </select>
            {form.role && (
              <div className="mt-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${ROLE_COLORS[form.role]?.split(" ")[0]}`} />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[form.role]}`}>
                  {ROLE_LABELS[form.role]}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 rounded-lg gap-2" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}