import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StepProgress, { STEPS } from "../../components/admin/dossier/StepProgress";
import {
  ArrowLeft, Plus, Trash2, Check, Sparkles, Loader2,
  Users, Calendar, FileText, Brain, CheckCircle,
  FileSignature, Banknote, Home, RefreshCw, DoorOpen, Archive,
  AlertCircle, Clock, X
} from "lucide-react";

const STEP_ICONS = [null, Users, Calendar, FileText, Brain, CheckCircle, FileSignature, Banknote, Home, RefreshCw, DoorOpen, Archive];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, children, action }) => (
  <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Badge = ({ children, color = "bg-secondary text-muted-foreground" }) => (
  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>{children}</span>
);

const EmptyState = ({ text }) => (
  <div className="text-center py-8">
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

// ─── Step Components ──────────────────────────────────────────────────────────

function StepCandidatures({ dossier, onUpdate }) {
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", telephone: "" });
  const [adding, setAdding] = useState(false);

  const candidatures = dossier.candidatures || [];

  const add = async () => {
    if (!form.nom) return;
    const updated = [...candidatures, { ...form, id: Date.now(), statut: "en_attente", created_at: new Date().toISOString() }];
    await base44.entities.DossierLocatif.update(dossier.id, { candidatures: updated });
    setForm({ nom: "", prenom: "", email: "", telephone: "" });
    setAdding(false);
    onUpdate();
  };

  const updateStatus = async (id, statut) => {
    const updated = candidatures.map((c) => (c.id === id ? { ...c, statut } : c));
    await base44.entities.DossierLocatif.update(dossier.id, { candidatures: updated });
    onUpdate();
  };

  const statusColors = { en_attente: "bg-amber-100 text-amber-700", selectionne: "bg-green-100 text-green-700", refuse: "bg-red-100 text-red-600" };
  const statusLabels = { en_attente: "En attente", selectionne: "Sélectionné", refuse: "Refusé" };

  return (
    <SectionCard title={`Candidatures (${candidatures.length})`} icon={Users}
      action={<Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1" onClick={() => setAdding(!adding)}><Plus className="w-3 h-3" />Ajouter</Button>}>
      {adding && (
        <div className="bg-secondary/30 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="h-9 rounded-xl" />
            <Input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="h-9 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 rounded-xl" />
            <Input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="h-9 rounded-xl" />
          </div>
          <div className="flex gap-2"><Button size="sm" className="rounded-full h-8 text-xs" onClick={add}>Confirmer</Button><Button size="sm" variant="ghost" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button></div>
        </div>
      )}
      {candidatures.length === 0 ? <EmptyState text="Aucun candidat ajouté" /> : (
        <div className="space-y-2">
          {candidatures.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">{c.nom?.[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.nom} {c.prenom}</p>
                <p className="text-xs text-muted-foreground">{c.email} · {c.telephone}</p>
              </div>
              <div className="flex gap-1.5">
                {["selectionne", "refuse"].map((s) => (
                  <button key={s} onClick={() => updateStatus(c.id, c.statut === s ? "en_attente" : s)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${c.statut === s ? statusColors[s] + " border-transparent" : "border-border/50 text-muted-foreground hover:bg-secondary"}`}>
                    {s === "selectionne" ? "✓" : "✗"}
                  </button>
                ))}
                <Badge color={statusColors[c.statut]}>{statusLabels[c.statut]}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function StepVisites({ dossier, onUpdate }) {
  const [form, setForm] = useState({ date: "", heure: "", notes: "" });
  const [adding, setAdding] = useState(false);
  const visites = dossier.visites || [];

  const add = async () => {
    if (!form.date) return;
    const updated = [...visites, { ...form, id: Date.now(), statut: "planifie" }];
    await base44.entities.DossierLocatif.update(dossier.id, { visites: updated });
    setForm({ date: "", heure: "", notes: "" });
    setAdding(false);
    onUpdate();
  };

  return (
    <SectionCard title={`Visites (${visites.length})`} icon={Calendar}
      action={<Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1" onClick={() => setAdding(!adding)}><Plus className="w-3 h-3" />Planifier</Button>}>
      {adding && (
        <div className="bg-secondary/30 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 rounded-xl" />
            <Input type="time" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })} className="h-9 rounded-xl" />
          </div>
          <Textarea placeholder="Notes de visite..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl resize-none min-h-[60px]" />
          <div className="flex gap-2"><Button size="sm" className="rounded-full h-8 text-xs" onClick={add}>Confirmer</Button><Button size="sm" variant="ghost" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button></div>
        </div>
      )}
      {visites.length === 0 ? <EmptyState text="Aucune visite planifiée" /> : (
        <div className="space-y-2">
          {visites.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{v.date} à {v.heure}</p>
                {v.notes && <p className="text-xs text-muted-foreground mt-0.5">{v.notes}</p>}
              </div>
              <Badge color="bg-blue-100 text-blue-700">Planifiée</Badge>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function StepDocuments({ dossier, onUpdate }) {
  const REQUIRED_DOCS = [
    { key: "cni", label: "Pièce d'identité" },
    { key: "revenus", label: "Justificatif de revenus (3 derniers bulletins)" },
    { key: "avis_impot", label: "Avis d'imposition" },
    { key: "garant", label: "Garant (optionnel)" },
    { key: "autres", label: "Autres documents" },
  ];
  const docs = dossier.documents || [];
  const getDoc = (key) => docs.find((d) => d.key === key);

  const toggle = async (key, statut) => {
    const existing = docs.find((d) => d.key === key);
    let updated;
    if (existing) updated = docs.map((d) => (d.key === key ? { ...d, statut } : d));
    else updated = [...docs, { key, statut }];
    await base44.entities.DossierLocatif.update(dossier.id, { documents: updated });
    onUpdate();
  };

  const statusConfig = { manquant: { color: "bg-red-100 text-red-600", label: "Manquant" }, en_attente: { color: "bg-amber-100 text-amber-700", label: "En attente" }, valide: { color: "bg-green-100 text-green-700", label: "Validé" } };

  return (
    <SectionCard title="Dossier administratif" icon={FileText}>
      <div className="space-y-2">
        {REQUIRED_DOCS.map((docDef) => {
          const doc = getDoc(docDef.key);
          const statut = doc?.statut || "manquant";
          const cfg = statusConfig[statut];
          return (
            <div key={docDef.key} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/20 transition-colors">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm flex-1">{docDef.label}</p>
              <div className="flex gap-1.5">
                {["manquant", "en_attente", "valide"].map((s) => (
                  <button key={s} onClick={() => toggle(docDef.key, s)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${statut === s ? statusConfig[s].color : "bg-secondary text-muted-foreground/60 hover:bg-secondary/80"}`}>
                    {statusConfig[s].label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function StepSelectionIA({ dossier, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const candidatures = dossier.candidatures || [];

  const runIA = async () => {
    setLoading(true);
    const list = candidatures.map((c) => `${c.nom} ${c.prenom} (${c.email})`).join(", ");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en gestion locative. Analyse ces candidats pour un logement à ${dossier.property_title || "ce bien"} avec un loyer de ${dossier.loyer || "N/A"}€/mois.
Candidats : ${list || "aucun candidat renseigné"}.
Génère un scoring JSON avec pour chaque candidat : score (0-100), analyse_solvabilite, risque_locatif (faible/moyen/élevé), recommandation.
Finalise avec une recommandation_globale du meilleur profil.`,
      response_json_schema: {
        type: "object",
        properties: {
          candidats_scores: { type: "array", items: { type: "object" } },
          recommandation_globale: { type: "string" },
          resume: { type: "string" }
        }
      }
    });
    await base44.entities.DossierLocatif.update(dossier.id, { ia_scoring: result });
    setLoading(false);
    onUpdate();
  };

  const scoring = dossier.ia_scoring;

  return (
    <SectionCard title="Sélection IA" icon={Brain} action={
      <Button size="sm" className="rounded-full h-7 text-xs gap-1.5" onClick={runIA} disabled={loading || candidatures.length === 0}>
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Analyser
      </Button>
    }>
      {!scoring ? (
        <EmptyState text={candidatures.length === 0 ? "Ajoutez des candidats à l'étape 1 d'abord" : "Cliquez sur Analyser pour lancer l'analyse IA"} />
      ) : (
        <div className="space-y-4">
          {scoring.resume && <div className="bg-primary/5 rounded-xl p-3.5"><p className="text-sm text-foreground/80">{scoring.resume}</p></div>}
          {(scoring.candidats_scores || []).map((c, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">{c.nom || `Candidat ${i + 1}`}</p>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${c.score || 0}%` }} />
                  </div>
                  <span className="text-sm font-bold">{c.score}/100</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {c.risque_locatif && <Badge color={c.risque_locatif === "faible" ? "bg-green-100 text-green-700" : c.risque_locatif === "moyen" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}>Risque {c.risque_locatif}</Badge>}
                {c.recommandation && <p className="text-xs text-muted-foreground">{c.recommandation}</p>}
              </div>
            </div>
          ))}
          {scoring.recommandation_globale && (
            <div className="bg-green-50 rounded-xl p-3.5 border border-green-100">
              <p className="text-xs font-semibold text-green-700 mb-1">Recommandation IA</p>
              <p className="text-sm text-green-800">{scoring.recommandation_globale}</p>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function StepValidation({ dossier, onUpdate }) {
  const [locataire, setLocataire] = useState(dossier.locataire_selectionne?.nom || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.DossierLocatif.update(dossier.id, { locataire_selectionne: { nom: locataire, validated_at: new Date().toISOString() } });
    setSaving(false);
    onUpdate();
  };

  return (
    <SectionCard title="Validation finale" icon={CheckCircle}>
      <div className="space-y-4">
        {dossier.locataire_selectionne?.nom ? (
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">{dossier.locataire_selectionne.nom}</p>
              <p className="text-xs text-green-600">Locataire validé et attribué à ce logement</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Saisissez le nom du locataire retenu pour valider et verrouiller le dossier.</p>
            <Input placeholder="Nom complet du locataire retenu" value={locataire} onChange={(e) => setLocataire(e.target.value)} className="h-10 rounded-xl" />
            <Button className="rounded-full gap-2 h-9 text-sm" onClick={save} disabled={!locataire || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" />Valider le locataire</>}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function StepContrat({ dossier, onUpdate }) {
  const [url, setUrl] = useState(dossier.contrat_url || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.DossierLocatif.update(dossier.id, { contrat_url: url });
    setSaving(false);
    onUpdate();
  };

  return (
    <SectionCard title="Signature du contrat" icon={FileSignature}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3.5 rounded-xl bg-secondary/30"><p className="text-xs text-muted-foreground mb-1">Loyer mensuel</p><p className="font-semibold">{dossier.loyer ? `${dossier.loyer} €` : "—"}</p></div>
          <div className="p-3.5 rounded-xl bg-secondary/30"><p className="text-xs text-muted-foreground mb-1">Charges</p><p className="font-semibold">{dossier.charges ? `${dossier.charges} €` : "—"}</p></div>
          <div className="p-3.5 rounded-xl bg-secondary/30"><p className="text-xs text-muted-foreground mb-1">Dépôt de garantie</p><p className="font-semibold">{dossier.depot_garantie ? `${dossier.depot_garantie} €` : "—"}</p></div>
          <div className="p-3.5 rounded-xl bg-secondary/30"><p className="text-xs text-muted-foreground mb-1">Locataire</p><p className="font-semibold">{dossier.locataire_selectionne?.nom || "—"}</p></div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Lien contrat / document signé</label>
          <div className="flex gap-2">
            <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="h-10 rounded-xl" />
            <Button onClick={save} disabled={saving} className="rounded-xl h-10 px-4">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}</Button>
          </div>
        </div>
        {dossier.contrat_url && <Badge color="bg-green-100 text-green-700">✓ Contrat archivé</Badge>}
      </div>
    </SectionCard>
  );
}

function StepLoyer({ dossier, onUpdate }) {
  const [form, setForm] = useState({ mois: "", montant: "", statut: "paye" });
  const [adding, setAdding] = useState(false);
  const paiements = dossier.paiements || [];

  const add = async () => {
    if (!form.mois) return;
    const updated = [...paiements, { ...form, id: Date.now() }];
    await base44.entities.DossierLocatif.update(dossier.id, { paiements: updated });
    setForm({ mois: "", montant: "", statut: "paye" });
    setAdding(false);
    onUpdate();
  };

  const statusColors = { paye: "bg-green-100 text-green-700", en_retard: "bg-red-100 text-red-600", partiel: "bg-amber-100 text-amber-700" };
  const statusLabels = { paye: "Payé", en_retard: "En retard", partiel: "Partiel" };

  return (
    <SectionCard title={`Loyer & Paiements (${paiements.length})`} icon={Banknote}
      action={<Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1" onClick={() => setAdding(!adding)}><Plus className="w-3 h-3" />Paiement</Button>}>
      {adding && (
        <div className="bg-secondary/30 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Mois (ex: Avril 2025)" value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })} className="h-9 rounded-xl col-span-2" />
            <Input type="number" placeholder="Montant €" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className="h-9 rounded-xl" />
          </div>
          <div className="flex gap-2">
            {["paye", "en_retard", "partiel"].map((s) => (
              <button key={s} onClick={() => setForm({ ...form, statut: s })}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${form.statut === s ? statusColors[s] : "bg-secondary text-muted-foreground"}`}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex gap-2"><Button size="sm" className="rounded-full h-8 text-xs" onClick={add}>Ajouter</Button><Button size="sm" variant="ghost" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button></div>
        </div>
      )}
      {paiements.length === 0 ? <EmptyState text="Aucun paiement enregistré" /> : (
        <div className="space-y-2">
          {paiements.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20">
              <Banknote className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm flex-1">{p.mois}</p>
              {p.montant && <p className="text-sm font-semibold">{p.montant} €</p>}
              <Badge color={statusColors[p.statut]}>{statusLabels[p.statut]}</Badge>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function StepEDL({ type, dossier, onUpdate }) {
  const key = type === "entree" ? "edl_entree" : "edl_sortie";
  const edl = dossier[key] || {};
  const [notes, setNotes] = useState(edl.notes || "");
  const [saving, setSaving] = useState(false);

  const ITEMS = ["Murs & plafonds", "Sols", "Fenêtres & portes", "Cuisine équipée", "Sanitaires", "Chauffage", "Clés remises", "Compteurs relevés"];
  const checks = edl.checks || {};

  const toggle = async (item) => {
    const updated = { ...edl, checks: { ...checks, [item]: !checks[item] } };
    await base44.entities.DossierLocatif.update(dossier.id, { [key]: updated });
    onUpdate();
  };

  const save = async () => {
    setSaving(true);
    await base44.entities.DossierLocatif.update(dossier.id, { [key]: { ...edl, notes, validated: true, validated_at: new Date().toISOString() } });
    setSaving(false);
    onUpdate();
  };

  return (
    <SectionCard title={`État des lieux ${type === "entree" ? "d'entrée" : "de sortie"}`} icon={type === "entree" ? Home : DoorOpen}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {ITEMS.map((item) => (
            <label key={item} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-secondary/30 cursor-pointer transition-colors">
              <div onClick={() => toggle(item)} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${checks[item] ? "bg-foreground border-foreground" : "border-border"}`}>
                {checks[item] && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm">{item}</span>
            </label>
          ))}
        </div>
        <Textarea placeholder="Notes et observations..." value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl resize-none min-h-[80px]" />
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving} className="rounded-full h-9 text-sm gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" />Valider l'EDL</>}
          </Button>
          {edl.validated && <Badge color="bg-green-100 text-green-700">✓ Validé</Badge>}
        </div>
      </div>
    </SectionCard>
  );
}

function StepSuivi({ dossier, onUpdate }) {
  const [form, setForm] = useState({ type: "incident", description: "" });
  const [adding, setAdding] = useState(false);
  const incidents = dossier.incidents || [];

  const add = async () => {
    if (!form.description) return;
    const updated = [...incidents, { ...form, id: Date.now(), date: new Date().toISOString().split("T")[0] }];
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    setForm({ type: "incident", description: "" });
    setAdding(false);
    onUpdate();
  };

  const typeConfig = { incident: { color: "bg-red-100 text-red-600", label: "Incident" }, demande: { color: "bg-blue-100 text-blue-700", label: "Demande" }, intervention: { color: "bg-amber-100 text-amber-700", label: "Intervention" } };

  return (
    <SectionCard title={`Suivi location (${incidents.length})`} icon={RefreshCw}
      action={<Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1" onClick={() => setAdding(!adding)}><Plus className="w-3 h-3" />Ajouter</Button>}>
      {adding && (
        <div className="bg-secondary/30 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex gap-2">
            {Object.entries(typeConfig).map(([k, v]) => (
              <button key={k} onClick={() => setForm({ ...form, type: k })}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${form.type === k ? v.color : "bg-secondary text-muted-foreground"}`}>{v.label}</button>
            ))}
          </div>
          <Textarea placeholder="Description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl resize-none min-h-[70px]" />
          <div className="flex gap-2"><Button size="sm" className="rounded-full h-8 text-xs" onClick={add}>Ajouter</Button><Button size="sm" variant="ghost" className="rounded-full h-8 text-xs" onClick={() => setAdding(false)}>Annuler</Button></div>
        </div>
      )}
      {incidents.length === 0 ? <EmptyState text="Aucun incident ou demande enregistré" /> : (
        <div className="space-y-2">
          {incidents.map((inc) => (
            <div key={inc.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20">
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">{inc.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{inc.date}</p>
              </div>
              <Badge color={typeConfig[inc.type]?.color}>{typeConfig[inc.type]?.label}</Badge>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function StepCloture({ dossier, onUpdate }) {
  const [saving, setSaving] = useState(false);

  const cloture = async () => {
    setSaving(true);
    await base44.entities.DossierLocatif.update(dossier.id, {
      statut: "termine",
      date_sortie: new Date().toISOString().split("T")[0],
      steps_completed: Array.from({ length: 11 }, (_, i) => i + 1),
      current_step: 11,
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <SectionCard title="Clôture du dossier" icon={Archive}>
      <div className="space-y-4">
        {dossier.statut === "termine" ? (
          <div className="bg-green-50 rounded-xl p-5 border border-green-100 text-center">
            <Archive className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">Dossier clôturé</p>
            <p className="text-xs text-green-600 mt-1">Le cycle locatif est terminé. Le dossier est archivé.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              {[
                { label: "Locataire validé", done: !!dossier.locataire_selectionne?.nom },
                { label: "Contrat archivé", done: !!dossier.contrat_url },
                { label: "EDL entrée réalisé", done: !!dossier.edl_entree?.validated },
                { label: "EDL sortie réalisé", done: !!dossier.edl_sortie?.validated },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/20">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-500" : "bg-border"}`}>
                    {item.done && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>
            <Button className="rounded-full h-9 text-sm gap-2 w-full" onClick={cloture} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Archive className="w-4 h-4" />Clôturer le dossier</>}
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Main Detail Component ────────────────────────────────────────────────────

const STEP_COMPONENTS = [null, StepCandidatures, StepVisites, StepDocuments, StepSelectionIA, StepValidation, StepContrat, StepLoyer,
  (p) => <StepEDL type="entree" {...p} />,
  StepSuivi,
  (p) => <StepEDL type="sortie" {...p} />,
  StepCloture,
];

export default function DossierLocatifDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  const load = async () => {
    const data = await base44.entities.DossierLocatif.filter({ id });
    const d = Array.isArray(data) ? data[0] : data;
    if (d) { setDossier(d); setActiveStep(d.current_step || 1); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const completeStep = async () => {
    const completed = [...new Set([...(dossier.steps_completed || []), activeStep])];
    const nextStep = Math.min(activeStep + 1, 11);
    await base44.entities.DossierLocatif.update(dossier.id, { steps_completed: completed, current_step: nextStep });
    setActiveStep(nextStep);
    load();
  };

  const isCompleted = (step) => (dossier?.steps_completed || []).includes(step);
  const progress = dossier ? Math.round(((dossier.steps_completed || []).length / 11) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center min-h-96"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!dossier) return <div className="text-center py-16 text-sm text-muted-foreground">Dossier introuvable</div>;

  const StepComp = STEP_COMPONENTS[activeStep];
  const stepInfo = STEPS[activeStep - 1];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate("/admin/dossier-locatif")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">{dossier.property_title}</h1>
              {dossier.reference && <span className="text-xs text-muted-foreground/50">{dossier.reference}</span>}
            </div>
            <p className="text-sm text-muted-foreground">{dossier.property_address || "Adresse non renseignée"}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Agent : <span className="font-medium text-foreground">{dossier.agent_email}</span></span>
              {dossier.owner_name && <span>Propriétaire : <span className="font-medium text-foreground">{dossier.owner_name}</span></span>}
              {dossier.locataire_selectionne?.nom && <span>Locataire : <span className="font-medium text-foreground">{dossier.locataire_selectionne.nom}</span></span>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{progress}%</p>
              <p className="text-xs text-muted-foreground">avancement</p>
            </div>
            <div className="w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
                  strokeDasharray={`${progress} ${100 - progress}`} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
        <StepProgress currentStep={activeStep} completedSteps={dossier.steps_completed || []} onStepClick={setActiveStep} />
      </div>

      {/* Active step */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted(activeStep) ? "bg-foreground text-white" : "bg-primary text-white"}`}>
              {isCompleted(activeStep) ? <Check className="w-3.5 h-3.5" /> : activeStep}
            </div>
            <h2 className="text-base font-semibold">{stepInfo?.label}</h2>
          </div>
          {!isCompleted(activeStep) && (
            <Button size="sm" onClick={completeStep} className="rounded-full gap-1.5 h-8 text-xs">
              <Check className="w-3.5 h-3.5" /> Valider l'étape
            </Button>
          )}
        </div>
        {StepComp && <StepComp dossier={dossier} onUpdate={load} />}
      </div>

      {/* Step navigation */}
      <div className="flex justify-between gap-3 pb-6">
        <Button variant="outline" onClick={() => setActiveStep((s) => Math.max(1, s - 1))} disabled={activeStep === 1} className="rounded-full h-9 text-sm">← Précédent</Button>
        <Button onClick={() => setActiveStep((s) => Math.min(11, s + 1))} disabled={activeStep === 11} className="rounded-full h-9 text-sm">Suivant →</Button>
      </div>
    </div>
  );
}