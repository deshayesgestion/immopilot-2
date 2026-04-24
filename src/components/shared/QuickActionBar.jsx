/**
 * QuickActionBar — Barre d'actions rapides universelle (1 clic max)
 * Utilisable dans tous les modules : location, vente, compta, dashboard
 */
import { useState } from "react";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ActionModal({ action, onClose, onDone }) {
  const [values, setValues] = useState(() => {
    const init = {};
    action.fields?.forEach(f => { init[f.key] = f.default ?? ""; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setValues(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    await action.onSubmit(values);
    setSaving(false);
    onDone(action.successMsg || "Action effectuée ✓");
  };

  const isValid = !action.fields || action.fields.filter(f => f.required).every(f => values[f.key]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">{action.emoji}</span>
            <p className="text-sm font-bold">{action.label}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary/60">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Fields */}
        {action.fields && action.fields.length > 0 && (
          <div className="p-5 space-y-3">
            {action.fields.map(field => (
              <div key={field.key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  {field.label}{field.required && " *"}
                </label>
                {field.type === "select" ? (
                  <select
                    value={values[field.key]}
                    onChange={e => set(field.key, e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">— Choisir —</option>
                    {field.options?.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={values[field.key]}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    value={values[field.key]}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* No fields = confirmation directe */}
        {(!action.fields || action.fields.length === 0) && action.confirm && (
          <div className="p-5">
            <p className="text-sm text-muted-foreground">{action.confirm}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="flex-1 rounded-full h-9 text-sm gap-1.5"
            onClick={handleSubmit}
            disabled={saving || !isValid}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : action.emoji}
            {saving ? "En cours…" : action.cta || "Confirmer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function QuickActionBar({ actions, variant = "default" }) {
  const [active, setActive] = useState(null);
  const [toast, setToast] = useState(null);

  const handleDone = (msg) => {
    setActive(null);
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const activeAction = actions.find(a => a.id === active);

  // variant "compact" = icônes seules, "pill" = pills horizontales, "default" = grille
  const containerClass = {
    default: "grid grid-cols-3 sm:grid-cols-6 gap-2",
    compact: "flex flex-wrap gap-1.5",
    pill: "flex flex-wrap gap-2",
    grid4: "grid grid-cols-2 sm:grid-cols-4 gap-2",
  }[variant] || "grid grid-cols-3 sm:grid-cols-6 gap-2";

  return (
    <>
      <div className={containerClass}>
        {actions.map(action => {
          if (variant === "pill") {
            return (
              <button
                key={action.id}
                onClick={() => action.onClick ? action.onClick() : setActive(action.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border transition-all hover:shadow-sm active:scale-95 ${
                  action.color || "bg-white border-border/50 text-foreground hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <span className="text-base leading-none">{action.emoji}</span>
                {action.label}
              </button>
            );
          }

          if (variant === "compact") {
            return (
              <button
                key={action.id}
                onClick={() => action.onClick ? action.onClick() : setActive(action.id)}
                title={action.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border/50 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span>{action.emoji}</span>
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            );
          }

          return (
            <button
              key={action.id}
              onClick={() => action.onClick ? action.onClick() : setActive(action.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group active:scale-95"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{action.emoji}</span>
              <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {activeAction && (activeAction.fields || activeAction.confirm) && (
        <ActionModal
          action={activeAction}
          onClose={() => setActive(null)}
          onDone={handleDone}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-up">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}
    </>
  );
}