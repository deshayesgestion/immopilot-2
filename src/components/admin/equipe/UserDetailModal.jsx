import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2, CheckCircle2, Shield, Home, FileText, AlertTriangle } from "lucide-react";
import {
  INTERNAL_ROLES, ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS, ROLE_DESCRIPTIONS
} from "@/lib/roles";

const MODULES = [
  { key: "location", label: "Location", icon: "🏠" },
  { key: "vente", label: "Vente", icon: "📈" },
  { key: "comptabilite", label: "Comptabilité", icon: "💰" },
  { key: "equipe", label: "Équipe", icon: "👥" },
  { key: "ia", label: "IA & Accueil", icon: "🤖" },
  { key: "parametres", label: "Paramètres", icon: "⚙️" },
];

const ACTIONS = [
  { key: "voir", label: "Voir" },
  { key: "creer", label: "Créer" },
  { key: "modifier", label: "Modifier" },
  { key: "supprimer", label: "Supprimer" },
];

export default function UserDetailModal({ user, onClose, onUpdate }) {
  const [role, setRole] = useState(user.role || "agent");
  const [statut, setStatut] = useState(user.statut || "actif");
  const [phone, setPhone] = useState(user.phone || "");
  const [permissions, setPermissions] = useState(user.permissions || {});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profil");

  const basePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.agent;

  // Effective permissions (base + overrides)
  const effectivePerms = {};
  for (const mod of Object.keys(basePerms)) {
    effectivePerms[mod] = { ...basePerms[mod], ...(permissions[mod] || {}) };
  }

  const togglePerm = (module, action) => {
    const current = effectivePerms[module]?.[action];
    setPermissions(prev => ({
      ...prev,
      [module]: { ...(prev[module] || {}), [action]: !current }
    }));
  };

  const resetPerms = () => setPermissions({});

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.User.update(user.id, { role, statut, phone, permissions });
    setSaving(false);
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-border/50" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-border/50">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-base font-bold text-foreground/70 flex-shrink-0">
            {(user.full_name || user.email || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{user.full_name || "—"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-border/50">
          {[
            { id: "profil", label: "Profil & Rôle" },
            { id: "permissions", label: "Permissions" },
            { id: "attribution", label: "Attribution" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "profil" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Rôle</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERNAL_ROLES.map(r => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Statut</label>
                  <Select value={statut} onValueChange={setStatut}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Téléphone</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 00 00 00 00" className="h-9 rounded-xl" />
                </div>
              </div>

              {/* Role description card */}
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> {ROLE_LABELS[role]}
                </p>
                <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role] || "Rôle personnalisé"}</p>
              </div>

              {/* Permissions summary */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Accès modules (aperçu)</p>
                <div className="grid grid-cols-3 gap-2">
                  {MODULES.map(mod => {
                    const hasAccess = effectivePerms[mod.key]?.voir;
                    return (
                      <div key={mod.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                        hasAccess ? "bg-green-50 text-green-700" : "bg-secondary/30 text-muted-foreground line-through"
                      }`}>
                        <span>{mod.icon}</span> {mod.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "permissions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Personnalisez les permissions au-delà du rôle.</p>
                <button onClick={resetPerms} className="text-xs text-primary hover:underline">
                  Réinitialiser
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">Module</th>
                      {ACTIONS.map(a => (
                        <th key={a.key} className="text-center py-2 px-3 text-xs text-muted-foreground font-medium w-20">{a.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {MODULES.map(mod => (
                      <tr key={mod.key} className="hover:bg-secondary/10">
                        <td className="py-3 pr-4 font-medium text-sm">
                          <span className="mr-2">{mod.icon}</span>{mod.label}
                        </td>
                        {ACTIONS.map(action => {
                          const enabled = effectivePerms[mod.key]?.[action.key];
                          const isOverride = permissions[mod.key]?.[action.key] !== undefined;
                          return (
                            <td key={action.key} className="text-center py-3 px-3">
                              <button
                                onClick={() => togglePerm(mod.key, action.key)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${
                                  enabled
                                    ? isOverride
                                      ? "bg-amber-500 border-amber-500 text-white"
                                      : "bg-green-500 border-green-500 text-white"
                                    : "border-border bg-white"
                                }`}
                              >
                                {enabled && <CheckCircle2 className="w-3 h-3" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /> Par défaut du rôle</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500" /> Personnalisé</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-border" /> Interdit</div>
              </div>
            </div>
          )}

          {tab === "attribution" && (
            <AttributionTab user={user} />
          )}
        </div>

        {/* Footer */}
        {tab !== "attribution" && (
          <div className="flex gap-3 px-6 py-4 border-t border-border/50">
            <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={onClose}>Annuler</Button>
            <Button className="rounded-full flex-1 h-9 text-sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AttributionTab({ user }) {
  const [properties, setProperties] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignedBiens, setAssignedBiens] = useState(user.biens_assignes || []);
  const [assignedDossiers, setAssignedDossiers] = useState(user.dossiers_assignes || []);

  useEffect(() => {
    Promise.all([
      base44.entities.Property.list("-created_date", 100),
      base44.entities.DossierLocatif.list("-created_date", 100),
      base44.entities.TransactionVente.list("-created_date", 100),
    ]).then(([p, d, t]) => {
      setProperties(p);
      setDossiers(d);
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const toggleBien = (id) => {
    setAssignedBiens(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleDossier = (id) => {
    setAssignedDossiers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.User.update(user.id, {
      biens_assignes: assignedBiens,
      dossiers_assignes: assignedDossiers,
    });
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Biens */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold flex items-center gap-2"><Home className="w-4 h-4 text-primary" /> Biens assignés</p>
          <span className="text-xs text-muted-foreground">{assignedBiens.length} / {properties.length}</span>
        </div>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun bien disponible</p>
          ) : properties.map(p => (
            <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary/20 cursor-pointer">
              <input type="checkbox" checked={assignedBiens.includes(p.id)} onChange={() => toggleBien(p.id)}
                className="w-4 h-4 rounded accent-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.city} · {p.transaction}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Dossiers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Dossiers locatifs assignés</p>
          <span className="text-xs text-muted-foreground">{assignedDossiers.length} / {dossiers.length}</span>
        </div>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {dossiers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun dossier disponible</p>
          ) : dossiers.map(d => (
            <label key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary/20 cursor-pointer">
              <input type="checkbox" checked={assignedDossiers.includes(d.id)} onChange={() => toggleDossier(d.id)}
                className="w-4 h-4 rounded accent-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.property_title}</p>
                <p className="text-xs text-muted-foreground">Réf. {d.reference || d.id.slice(0, 8)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <p className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-primary" /> Transactions assignées (agent)
        </p>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {transactions.filter(t => t.agent_email === user.email).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune transaction avec cet email agent</p>
          ) : transactions.filter(t => t.agent_email === user.email).map(t => (
            <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/20">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.property_title}</p>
                <p className="text-xs text-muted-foreground">{t.acquereur_nom} · {t.statut}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full rounded-full h-9 text-sm" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enregistrer les attributions"}
      </Button>
    </div>
  );
}