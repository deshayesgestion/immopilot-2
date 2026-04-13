import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Loader2, Home, User, Euro, Calendar, FileText,
  AlertTriangle, MessageSquare, Plus, CheckCircle2, Clock, X, Mail
} from "lucide-react";

const TABS = [
  { id: "loyer", label: "Loyer", icon: Euro },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "historique", label: "Historique", icon: MessageSquare },
];

const STATUT_BAIL = {
  actif: { label: "Bail actif", color: "bg-green-100 text-green-700" },
  preavis: { label: "Préavis", color: "bg-amber-100 text-amber-700" },
  termine: { label: "Terminé", color: "bg-gray-100 text-gray-500" },
};

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

// ── LOYER TAB ──────────────────────────────────────────────────────────────
const MOIS_OPTIONS = (() => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }));
  }
  return opts;
})();

function isRetard(p) {
  // A payment is "en_retard" if status is retard, or if en_attente and the month is past
  if (p.statut === "retard" || p.statut === "en_retard") return true;
  return false;
}

function LoyerTab({ dossier, onUpdate }) {
  const paiements = dossier.paiements || [];
  const [adding, setAdding] = useState(false);
  const now = new Date();
  const moisCourant = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const [form, setForm] = useState({
    mois: moisCourant,
    loyer: dossier.loyer || "",
    charges: dossier.charges || "",
    assurance: "",
    statut: "recu",
    note: ""
  });
  const [saving, setSaving] = useState(false);
  const [relancing, setRelancing] = useState(null);

  const addPaiement = async () => {
    setSaving(true);
    const total = Number(form.loyer || 0) + Number(form.charges || 0) + Number(form.assurance || 0);
    const entry = { ...form, id: Date.now(), total, date: new Date().toISOString() };
    const updated = [...paiements, entry];
    await base44.entities.DossierLocatif.update(dossier.id, { paiements: updated });
    setSaving(false);
    setAdding(false);
    setForm({ mois: moisCourant, loyer: dossier.loyer || "", charges: dossier.charges || "", assurance: "", statut: "recu", note: "" });
    onUpdate();
  };

  const updateStatut = async (id, statut) => {
    const updated = paiements.map((p) => p.id === id ? { ...p, statut } : p);
    await base44.entities.DossierLocatif.update(dossier.id, { paiements: updated });
    onUpdate();
  };

  const sendRelance = async (p) => {
    const locataire = dossier.locataire_selectionne;
    if (!locataire?.email) return;
    setRelancing(p.id);
    await base44.integrations.Core.SendEmail({
      to: locataire.email,
      subject: `Rappel de paiement — ${p.mois}`,
      body: `Bonjour ${locataire.nom},\n\nNous vous contactons car le paiement de votre loyer pour le mois de ${p.mois} n'a pas encore été enregistré.\n\nDétail :\n- Loyer : ${formatEuro(p.loyer)}\n- Charges : ${formatEuro(p.charges)}${p.assurance ? `\n- Assurance : ${formatEuro(p.assurance)}` : ""}\n- Total : ${formatEuro(p.total)}\n\nNous vous remercions de régulariser cette situation dans les meilleurs délais.\n\nCordialement,\n${dossier.agent_name || "L'agence"}`,
    });
    const updated = paiements.map((x) => x.id === p.id ? { ...x, relance_envoyee: true, relance_date: new Date().toISOString() } : x);
    await base44.entities.DossierLocatif.update(dossier.id, { paiements: updated });
    setRelancing(null);
    onUpdate();
  };

  const totalRecu = paiements.filter((p) => p.statut === "recu").reduce((s, p) => s + Number(p.total || p.montant || 0), 0);
  const retards = paiements.filter((p) => isRetard(p));
  const enAttente = paiements.filter((p) => p.statut === "en_attente");

  const STATUT_CONFIG = {
    recu: { label: "Payé", color: "bg-green-100 text-green-700" },
    en_attente: { label: "En attente", color: "bg-amber-100 text-amber-700" },
    retard: { label: "En retard", color: "bg-red-100 text-red-600" },
    en_retard: { label: "En retard", color: "bg-red-100 text-red-600" },
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Loyer mensuel", value: formatEuro(dossier.loyer), sub: `+ ${formatEuro(dossier.charges)} charges` },
          { label: "Total perçu", value: formatEuro(totalRecu), color: "text-green-600" },
          { label: "En attente", value: enAttente.length, color: enAttente.length > 0 ? "text-amber-600" : "text-muted-foreground" },
          { label: "En retard", value: retards.length, color: retards.length > 0 ? "text-red-600" : "text-muted-foreground" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-secondary/30 rounded-xl p-4">
            <p className={`text-lg font-bold ${color || ""}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Alerts retard */}
      {retards.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {retards.length} paiement{retards.length > 1 ? "s" : ""} en retard
          </p>
          {retards.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4">
              <p className="text-sm text-red-700">{p.mois} — {formatEuro(p.total || p.montant)}</p>
              <div className="flex items-center gap-2">
                {p.relance_envoyee && (
                  <span className="text-xs text-muted-foreground">Relance envoyée ✓</span>
                )}
                <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => sendRelance(p)} disabled={relancing === p.id}>
                  {relancing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                  Relancer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Historique des paiements</p>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3" /> Ajouter
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Mois</label>
              <select value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })}
                className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                {MOIS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Loyer (€)</label>
              <Input type="number" value={form.loyer} onChange={(e) => setForm({ ...form, loyer: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Charges (€)</label>
              <Input type="number" value={form.charges} onChange={(e) => setForm({ ...form, charges: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assurance (€)</label>
              <Input type="number" value={form.assurance} onChange={(e) => setForm({ ...form, assurance: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}
                className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="recu">Payé</option>
                <option value="en_attente">En attente</option>
                <option value="retard">En retard</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Note</label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="h-8 text-sm" placeholder="Optionnel..." />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Total : <strong>{formatEuro(Number(form.loyer||0)+Number(form.charges||0)+Number(form.assurance||0))}</strong></p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button>
              <Button size="sm" className="rounded-full h-8 text-xs" onClick={addPaiement} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payments list */}
      {paiements.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement enregistré</p>
      ) : (
        <div className="divide-y divide-border/30 border border-border/50 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-secondary/30">
            {["Mois", "Loyer", "Charges", "Assurance", "Statut", ""].map((h) => (
              <p key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>
          {[...paiements].reverse().map((p) => {
            const sc = STATUT_CONFIG[p.statut] || STATUT_CONFIG.en_attente;
            return (
              <div key={p.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center px-4 py-3 hover:bg-secondary/10">
                <div>
                  <p className="text-sm font-medium">{p.mois}</p>
                  {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                  {p.relance_envoyee && <p className="text-[11px] text-blue-500">Relance envoyée</p>}
                </div>
                <p className="text-sm">{formatEuro(p.loyer || 0)}</p>
                <p className="text-sm">{formatEuro(p.charges || 0)}</p>
                <p className="text-sm">{formatEuro(p.assurance || 0)}</p>
                <div className="flex items-center gap-1">
                  <select value={p.statut} onChange={(e) => updateStatut(p.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${sc.color}`}>
                    <option value="recu">Payé</option>
                    <option value="en_attente">En attente</option>
                    <option value="retard">En retard</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  {(p.statut === "retard" || p.statut === "en_retard") && (
                    <button onClick={() => sendRelance(p)} disabled={relancing === p.id}
                      className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors" title="Envoyer relance">
                      {relancing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── DOCUMENTS TAB ──────────────────────────────────────────────────────────
function DocumentsTab({ dossier, onUpdate }) {
  const docs = dossier.documents || [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nom: "", type: "contrat", url: "" });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);

  const addDoc = async () => {
    setSaving(true);
    const updated = [...docs, { ...form, id: Date.now(), date: new Date().toISOString() }];
    await base44.entities.DossierLocatif.update(dossier.id, { documents: updated });
    setSaving(false);
    setAdding(false);
    setForm({ nom: "", type: "contrat", url: "" });
    onUpdate();
  };

  const genererEtEnvoyer = async () => {
    setGenerating(true);
    await base44.functions.invoke("genererDocumentsLocatifs", { dossier_id: dossier.id });
    setGenerating(false);
    onUpdate();
  };

  const TYPE_LABELS = { quittance: "Quittance", avis_echeance: "Avis d'échéance", contrat: "Contrat", edl: "État des lieux", autre: "Autre" };
  const TYPE_COLORS = { quittance: "bg-green-100 text-green-700", avis_echeance: "bg-blue-100 text-blue-700", contrat: "bg-purple-100 text-purple-700", edl: "bg-amber-100 text-amber-700" };

  return (
    <div className="space-y-4">
      {/* Auto-generate banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Génération automatique</p>
          <p className="text-xs text-muted-foreground mt-0.5">Génère et envoie la quittance + avis d'échéance du mois par email au locataire.</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">⚙️ Envoi automatique activé le 1er de chaque mois.</p>
        </div>
        <Button size="sm" className="rounded-full gap-1.5 text-xs h-9 flex-shrink-0" onClick={genererEtEnvoyer} disabled={generating}>
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          Envoyer maintenant
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Documents ({docs.length})</p>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3" /> Ajouter
        </Button>
      </div>

      {adding && (
        <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nom du document</label>
              <Input placeholder="ex: Bail signé" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="contrat">Contrat</option>
                <option value="edl">État des lieux</option>
                <option value="quittance">Quittance</option>
                <option value="avis_echeance">Avis d'échéance</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button>
            <Button size="sm" className="rounded-full h-8 text-xs" onClick={addDoc} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}

      {/* View document modal */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewDoc(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <p className="text-sm font-semibold">{viewDoc.nom}</p>
              <button onClick={() => setViewDoc(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80 leading-relaxed">{viewDoc.contenu}</pre>
            </div>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucun document</p>
      ) : (
        <div className="divide-y divide-border/30 border border-border/50 rounded-xl overflow-hidden">
          {[...docs].reverse().map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{doc.nom}</p>
                  {doc.genere_auto && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Auto</span>}
                </div>
                <p className="text-xs text-muted-foreground">{new Date(doc.date).toLocaleDateString("fr-FR")}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.type] || "bg-gray-100 text-gray-500"}`}>
                {TYPE_LABELS[doc.type] || doc.type}
              </span>
              {doc.contenu && (
                <button onClick={() => setViewDoc(doc)} className="text-xs text-primary hover:underline font-medium">Voir</button>
              )}
              {doc.url && (
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Lien</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── INCIDENTS TAB ──────────────────────────────────────────────────────────
function IncidentsTab({ dossier, onUpdate }) {
  const incidents = dossier.incidents || [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", gravite: "moyen", statut: "ouvert" });
  const [saving, setSaving] = useState(false);

  const addIncident = async () => {
    setSaving(true);
    const updated = [...incidents, { ...form, id: Date.now(), date: new Date().toISOString() }];
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    setSaving(false);
    setAdding(false);
    setForm({ titre: "", description: "", gravite: "moyen", statut: "ouvert" });
    onUpdate();
  };

  const closeIncident = async (id) => {
    const updated = incidents.map((i) => i.id === id ? { ...i, statut: "resolu" } : i);
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    onUpdate();
  };

  const GRAVITE = { faible: "bg-blue-100 text-blue-700", moyen: "bg-amber-100 text-amber-700", eleve: "bg-red-100 text-red-600" };
  const open = incidents.filter((i) => i.statut !== "resolu");
  const resolved = incidents.filter((i) => i.statut === "resolu");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Incidents</p>
          <p className="text-xs text-muted-foreground">{open.length} ouvert{open.length > 1 ? "s" : ""} · {resolved.length} résolu{resolved.length > 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3" /> Signaler
        </Button>
      </div>

      {adding && (
        <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-white">
          <Input placeholder="Titre de l'incident" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="h-8 text-sm" />
          <Textarea placeholder="Description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-sm resize-none min-h-[70px]" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gravité</label>
              <select value={form.gravite} onChange={(e) => setForm({ ...form, gravite: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button>
            <Button size="sm" className="rounded-full h-8 text-xs" onClick={addIncident} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}

      {incidents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucun incident signalé</p>
      ) : (
        <div className="space-y-2">
          {[...incidents].reverse().map((inc) => (
            <div key={inc.id} className={`border rounded-xl p-4 space-y-2 ${inc.statut === "resolu" ? "opacity-50 bg-secondary/10" : "bg-white border-border/50"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{inc.titre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(inc.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${GRAVITE[inc.gravite] || GRAVITE.moyen}`}>{inc.gravite}</span>
                  {inc.statut !== "resolu" && (
                    <button onClick={() => closeIncident(inc.id)} className="text-xs text-green-600 hover:underline font-medium">Résoudre</button>
                  )}
                </div>
              </div>
              {inc.description && <p className="text-xs text-muted-foreground">{inc.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HISTORIQUE TAB ─────────────────────────────────────────────────────────
function HistoriqueTab({ dossier, onUpdate }) {
  const messages = Array.isArray(dossier.notes) ? dossier.notes : [];
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const addMessage = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const updated = [...messages, { id: Date.now(), content: text, date: new Date().toISOString() }];
    await base44.entities.DossierLocatif.update(dossier.id, { notes: updated });
    setText("");
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Historique & Notes</p>

      <div className="space-y-2">
        <Textarea
          placeholder="Ajouter une note ou un message interne..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="text-sm resize-none min-h-[80px] rounded-xl"
        />
        <Button size="sm" className="rounded-full h-8 text-xs gap-1.5" onClick={addMessage} disabled={saving || !text.trim()}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Ajouter
        </Button>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucune note</p>
      ) : (
        <div className="space-y-2">
          {[...messages].reverse().map((m) => (
            <div key={m.id} className="bg-secondary/20 border border-border/30 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{new Date(m.date).toLocaleString("fr-FR")}</p>
              <p className="text-sm">{m.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function AdminSuiviDetail() {
  const { id } = useParams();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("loyer");

  const load = () => {
    base44.entities.DossierLocatif.filter({ id })
      .then((res) => setDossier(res[0] || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!dossier) return (
    <div className="text-center py-24">
      <p className="text-sm text-muted-foreground">Dossier introuvable.</p>
      <Link to="/admin/suivi" className="text-primary text-sm hover:underline mt-2 inline-block">← Retour</Link>
    </div>
  );

  const locataire = dossier.locataire_selectionne;
  const statutBail = STATUT_BAIL[dossier.statut_bail || "actif"];
  const dateEntree = dossier.date_entree ? new Date(dossier.date_entree).toLocaleDateString("fr-FR") : "—";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/suivi" className="mt-1 p-1.5 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{dossier.property_title}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statutBail.color}`}>{statutBail.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{dossier.property_address} · Réf. {dossier.reference}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <User className="w-4 h-4 text-blue-500 mb-2" />
          <p className="text-sm font-semibold">{locataire?.nom || "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{locataire?.email || "—"}</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Euro className="w-4 h-4 text-green-500 mb-2" />
          <p className="text-sm font-semibold">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(dossier.loyer || 0)}/mois</p>
          <p className="text-xs text-muted-foreground">Loyer</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Calendar className="w-4 h-4 text-purple-500 mb-2" />
          <p className="text-sm font-semibold">{dateEntree}</p>
          <p className="text-xs text-muted-foreground">Date d'entrée</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Home className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-sm font-semibold">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(dossier.depot_garantie || 0)}</p>
          <p className="text-xs text-muted-foreground">Caution</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="flex border-b border-border/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="p-6">
          {activeTab === "loyer" && <LoyerTab dossier={dossier} onUpdate={load} />}
          {activeTab === "documents" && <DocumentsTab dossier={dossier} onUpdate={load} />}
          {activeTab === "incidents" && <IncidentsTab dossier={dossier} onUpdate={load} />}
          {activeTab === "historique" && <HistoriqueTab dossier={dossier} onUpdate={load} />}
        </div>
      </div>
    </div>
  );
}