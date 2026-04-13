import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, CheckCircle2, ChevronRight, Calendar, FileText, Sparkles, Plus, Euro, X } from "lucide-react";
import HistoriquePaiements from "../../components/admin/comptabilite/HistoriquePaiements";

const STEPS = [
  { id: 1, key: "prospection", label: "Prospection" },
  { id: 2, key: "visites", label: "Visites" },
  { id: 3, key: "offre", label: "Offre" },
  { id: 4, key: "verification", label: "Vérification" },
  { id: 5, key: "compromis", label: "Compromis" },
  { id: 6, key: "notaire", label: "Notaire" },
  { id: 7, key: "vendu", label: "Vente finale" },
];

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function getStepIndex(statut) {
  const idx = STEPS.findIndex((s) => s.key === statut);
  return idx >= 0 ? idx : 0;
}

function AcquereurProspectionCard({ acq, onUpdate, tx }) {
  const [showVisites, setShowVisites] = useState(false);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const ajouterVisite = async () => {
    if (!date) return;
    setSaving(true);
    const updated = (tx.acquereurs_prospection || []).map((a) =>
      a.id === acq.id
        ? { ...a, visites: [...(a.visites || []), { id: Date.now(), date, note, statut: "planifiee" }] }
        : a
    );
    await base44.entities.TransactionVente.update(tx.id, { acquereurs_prospection: updated });
    setDate(""); setNote(""); setSaving(false);
    onUpdate();
  };

  const supprimerVisite = async (vid) => {
    const updated = (tx.acquereurs_prospection || []).map((a) =>
      a.id === acq.id ? { ...a, visites: (a.visites || []).filter((v) => v.id !== vid) } : a
    );
    await base44.entities.TransactionVente.update(tx.id, { acquereurs_prospection: updated });
    onUpdate();
  };

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-secondary/20">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {acq.nom?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{acq.nom}</p>
          <p className="text-xs text-muted-foreground">{acq.email} {acq.telephone ? `· ${acq.telephone}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs bg-white border border-border/50 rounded-full px-2.5 py-1">
            {(acq.visites || []).length} visite{(acq.visites || []).length > 1 ? "s" : ""}
          </span>
          <button onClick={() => setShowVisites(!showVisites)}
            className="text-xs text-primary hover:underline">
            {showVisites ? "Masquer" : "Voir visites"}
          </button>
        </div>
      </div>
      {showVisites && (
        <div className="p-4 space-y-3 bg-white">
          <div className="flex gap-2">
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs flex-1" />
            <Input placeholder="Note..." value={note} onChange={(e) => setNote(e.target.value)} className="h-8 text-xs flex-1" />
            <Button size="sm" className="rounded-full h-8 text-xs gap-1" onClick={ajouterVisite} disabled={saving || !date}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            </Button>
          </div>
          {(acq.visites || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune visite planifiée.</p>
          ) : (
            <div className="space-y-1.5">
              {(acq.visites || []).map((v) => (
                <div key={v.id} className="flex items-center gap-2 bg-secondary/20 rounded-lg px-3 py-2">
                  <Calendar className="w-3 h-3 text-primary flex-shrink-0" />
                  <p className="text-xs flex-1">{new Date(v.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                  {v.note && <p className="text-xs text-muted-foreground truncate max-w-[120px]">{v.note}</p>}
                  <button onClick={() => supprimerVisite(v.id)} className="text-muted-foreground/40 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepProspection({ tx, onUpdate }) {
  const [acquereurs, setAcquereurs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [adding, setAdding] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newAcq, setNewAcq] = useState({ nom: "", email: "", telephone: "", budget_max: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    base44.entities.Acquereur.list("-created_date", 100).then(setAcquereurs);
  }, []);

  const prospection = tx.acquereurs_prospection || [];

  const ajouterAcquereur = async () => {
    if (!selectedId) return;
    const found = acquereurs.find((a) => a.id === selectedId);
    if (!found) return;
    if (prospection.some((p) => p.id === selectedId)) return;
    setAdding(true);
    const updated = [...prospection, { id: found.id, nom: found.nom, email: found.email, telephone: found.telephone || "", visites: [], added_at: new Date().toISOString() }];
    await base44.entities.TransactionVente.update(tx.id, { acquereurs_prospection: updated });
    setAdding(false); setShowAdd(false); setSelectedId("");
    onUpdate();
  };

  const retirerAcquereur = async (id) => {
    const updated = prospection.filter((a) => a.id !== id);
    await base44.entities.TransactionVente.update(tx.id, { acquereurs_prospection: updated });
    onUpdate();
  };

  const creerEtAjouter = async () => {
    if (!newAcq.nom) return;
    setCreating(true);
    const created = await base44.entities.Acquereur.create({
      nom: newAcq.nom,
      email: newAcq.email,
      telephone: newAcq.telephone,
      budget_max: Number(newAcq.budget_max) || undefined,
      statut: "actif",
    });
    const updated = [...prospection, { id: created.id, nom: created.nom, email: created.email, telephone: created.telephone || "", visites: [], added_at: new Date().toISOString() }];
    await base44.entities.TransactionVente.update(tx.id, { acquereurs_prospection: updated });
    setAcquereurs((prev) => [...prev, created]);
    setNewAcq({ nom: "", email: "", telephone: "", budget_max: "" });
    setShowCreate(false); setCreating(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Infos bien */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-border/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Bien</p>
          <p className="text-sm font-semibold mt-0.5">{tx.property_title}</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Prix affiché</p>
          <p className="text-sm font-semibold mt-0.5">{fmt(tx.prix_affiche)}</p>
        </div>
      </div>

      {/* Acquéreurs en prospection */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Acquéreurs en prospection</p>
            <p className="text-xs text-muted-foreground mt-0.5">{prospection.length} acquéreur{prospection.length > 1 ? "s" : ""} · gérez les visites par acquéreur</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={() => { setShowAdd(!showAdd); setShowCreate(false); }}>
              <Plus className="w-3 h-3" /> Existant
            </Button>
            <Button size="sm" className="rounded-full h-8 text-xs gap-1" onClick={() => { setShowCreate(!showCreate); setShowAdd(false); }}>
              <Plus className="w-3 h-3" /> Nouveau
            </Button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-primary">Créer un nouvel acquéreur</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Nom *</label>
                <Input value={newAcq.nom} onChange={(e) => setNewAcq((p) => ({ ...p, nom: e.target.value }))} className="h-8 text-sm" placeholder="Nom complet" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input value={newAcq.email} onChange={(e) => setNewAcq((p) => ({ ...p, email: e.target.value }))} className="h-8 text-sm" placeholder="email@exemple.fr" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Téléphone</label>
                <Input value={newAcq.telephone} onChange={(e) => setNewAcq((p) => ({ ...p, telephone: e.target.value }))} className="h-8 text-sm" placeholder="06..."/>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Budget max (€)</label>
                <Input type="number" value={newAcq.budget_max} onChange={(e) => setNewAcq((p) => ({ ...p, budget_max: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-full h-8 text-xs" onClick={creerEtAjouter} disabled={creating || !newAcq.nom}>
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Créer & ajouter"}
              </Button>
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setShowCreate(false)}>Annuler</Button>
            </div>
          </div>
        )}

        {showAdd && (
          <div className="flex gap-2 items-center bg-secondary/30 rounded-xl p-3">
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 h-9 rounded-md border border-input bg-white px-3 text-sm">
              <option value="">Sélectionner un acquéreur...</option>
              {acquereurs.filter((a) => !prospection.some((p) => p.id === a.id)).map((a) => (
                <option key={a.id} value={a.id}>{a.nom} — {a.email}</option>
              ))}
            </select>
            <Button size="sm" className="rounded-full h-9 text-xs" onClick={ajouterAcquereur} disabled={adding || !selectedId}>
              {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ajouter"}
            </Button>
            <Button size="sm" variant="outline" className="rounded-full h-9 text-xs" onClick={() => setShowAdd(false)}>Annuler</Button>
          </div>
        )}

        {prospection.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">Aucun acquéreur ajouté. Cliquez sur "Ajouter" pour commencer.</div>
        ) : (
          <div className="space-y-2">
            {prospection.map((acq) => (
              <div key={acq.id} className="relative">
                <AcquereurProspectionCard acq={acq} tx={tx} onUpdate={onUpdate} />
                <button onClick={() => retirerAcquereur(acq.id)}
                  className="absolute top-3 right-3 text-muted-foreground/30 hover:text-red-500 transition-colors z-10">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepVisites({ tx, onUpdate }) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const visites = tx.visites || [];

  const ajouterVisite = async () => {
    if (!date) return;
    setSaving(true);
    const nouvelles = [...visites, { id: Date.now(), date, note, statut: "planifiee" }];
    await base44.entities.TransactionVente.update(tx.id, { visites: nouvelles });
    setSaving(false);
    setDate(""); setNote("");
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold">Planifier une visite</p>
        <div className="flex gap-3">
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 h-9 text-sm" />
          <Input placeholder="Note..." value={note} onChange={(e) => setNote(e.target.value)} className="flex-1 h-9 text-sm" />
          <Button size="sm" className="rounded-full h-9 gap-1 text-xs" onClick={ajouterVisite} disabled={saving || !date}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Ajouter
          </Button>
        </div>
        {visites.length > 0 && (
          <div className="space-y-2">
            {visites.map((v) => (
              <div key={v.id} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-4 py-2.5">
                <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <p className="text-sm flex-1">{fmtDate(v.date)} {v.date?.includes("T") ? new Date(v.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                {v.note && <p className="text-xs text-muted-foreground">{v.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepOffre({ tx, onUpdate }) {
  const [montant, setMontant] = useState("");
  const [conditions, setConditions] = useState("");
  const [saving, setSaving] = useState(false);
  const offres = tx.offres || [];

  const creerOffre = async () => {
    if (!montant) return;
    setSaving(true);
    const nouvelles = [...offres, { id: Date.now(), montant: Number(montant), conditions, statut: "en_attente", date: new Date().toISOString() }];
    await base44.entities.TransactionVente.update(tx.id, {
      offres: nouvelles,
      prix_offre: Number(montant),
      date_offre: new Date().toISOString(),
      historique: [...(tx.historique || []), { id: Date.now(), content: `Offre créée : ${fmt(montant)}`, date: new Date().toISOString() }],
    });
    setSaving(false);
    setMontant(""); setConditions("");
    onUpdate();
  };

  const updateStatutOffre = async (id, statut) => {
    const updated = offres.map((o) => o.id === id ? { ...o, statut } : o);
    await base44.entities.TransactionVente.update(tx.id, { offres: updated });
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold">Créer une offre d'achat</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Montant de l'offre (€)</label>
            <Input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Conditions suspensives</label>
            <Input value={conditions} onChange={(e) => setConditions(e.target.value)} className="h-9 text-sm" placeholder="Ex: prêt immobilier..." />
          </div>
        </div>
        <Button size="sm" className="rounded-full h-9 text-xs" onClick={creerOffre} disabled={saving || !montant}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Enregistrer l'offre
        </Button>
      </div>

      {offres.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold">Offres enregistrées</p>
          {offres.map((o) => (
            <div key={o.id} className="flex items-center gap-3 bg-secondary/20 rounded-xl px-4 py-3">
              <Euro className="w-3.5 h-3.5 text-primary" />
              <p className="text-sm font-bold flex-1">{fmt(o.montant)}</p>
              {o.conditions && <p className="text-xs text-muted-foreground">{o.conditions}</p>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                o.statut === "acceptee" ? "bg-green-100 text-green-700" :
                o.statut === "refusee" ? "bg-red-100 text-red-700" :
                "bg-amber-100 text-amber-700"
              }`}>{o.statut}</span>
              {o.statut === "en_attente" && (
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 text-xs rounded-full bg-green-600 hover:bg-green-700" onClick={() => updateStatutOffre(o.id, "acceptee")}>Accepter</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" onClick={() => updateStatutOffre(o.id, "refusee")}>Refuser</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepVerification({ tx, onUpdate }) {
  const docs = tx.documents || [];
  const [libelle, setLibelle] = useState("");
  const [saving, setSaving] = useState(false);

  const ajouterDoc = async () => {
    if (!libelle) return;
    setSaving(true);
    const updated = [...docs, { id: Date.now(), libelle, statut: "en_attente", date: new Date().toISOString() }];
    await base44.entities.TransactionVente.update(tx.id, { documents: updated });
    setSaving(false); setLibelle("");
    onUpdate();
  };

  const toggleDoc = async (id) => {
    const updated = docs.map((d) => d.id === id ? { ...d, statut: d.statut === "recu" ? "en_attente" : "recu" } : d);
    await base44.entities.TransactionVente.update(tx.id, { documents: updated });
    onUpdate();
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
      <p className="text-sm font-semibold">Documents acquéreur</p>
      <div className="flex gap-2">
        <Input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Nom du document..." className="h-9 text-sm" />
        <Button size="sm" className="rounded-full h-9 text-xs gap-1" onClick={ajouterDoc} disabled={saving || !libelle}>
          <Plus className="w-3 h-3" /> Ajouter
        </Button>
      </div>
      {docs.length > 0 ? docs.map((d) => (
        <div key={d.id} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleDoc(d.id)}>
          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${d.statut === "recu" ? "text-green-500" : "text-muted-foreground/30"}`} />
          <p className={`text-sm flex-1 ${d.statut === "recu" ? "line-through text-muted-foreground" : ""}`}>{d.libelle}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${d.statut === "recu" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {d.statut === "recu" ? "Reçu" : "En attente"}
          </span>
        </div>
      )) : (
        <p className="text-sm text-muted-foreground">Aucun document enregistré.</p>
      )}
    </div>
  );
}

function StepCompromis({ tx, onUpdate }) {
  const [date, setDate] = useState(tx.date_compromis?.substring(0, 10) || "");
  const [saving, setSaving] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const sauvegarder = async () => {
    setSaving(true);
    await base44.entities.TransactionVente.update(tx.id, { date_compromis: date });
    setSaving(false); onUpdate();
  };

  const generer = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère un résumé de compromis de vente immobilière:\nBien: ${tx.property_title}\nAcquéreur: ${tx.acquereur_nom}\nPrix: ${fmt(tx.prix_offre || tx.prix_affiche)}\nDate compromis: ${fmtDate(date)}\nRédige un texte concis et professionnel mentionnant les parties, le bien, le prix et les conditions.`
    });
    setAiContent(res);
    setAiLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold">Date de signature du compromis</p>
        <div className="flex gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm max-w-xs" />
          <Button size="sm" className="rounded-full h-9 text-xs" onClick={sauvegarder} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Génération IA</p>
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={generer} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Générer
          </Button>
        </div>
        {aiContent && <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap">{aiContent}</div>}
      </div>
    </div>
  );
}

function StepNotaire({ tx, onUpdate }) {
  const [form, setForm] = useState({ notaire_nom: tx.notaire_nom || "", notaire_email: tx.notaire_email || "", date_acte_prevue: tx.date_acte_prevue?.substring(0, 10) || "" });
  const [saving, setSaving] = useState(false);

  const sauvegarder = async () => {
    setSaving(true);
    await base44.entities.TransactionVente.update(tx.id, form);
    setSaving(false); onUpdate();
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
      <p className="text-sm font-semibold">Suivi notaire</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nom du notaire</label>
          <Input value={form.notaire_nom} onChange={(e) => setForm((p) => ({ ...p, notaire_nom: e.target.value }))} className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Email notaire</label>
          <Input value={form.notaire_email} onChange={(e) => setForm((p) => ({ ...p, notaire_email: e.target.value }))} className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Date de l'acte prévue</label>
          <Input type="date" value={form.date_acte_prevue} onChange={(e) => setForm((p) => ({ ...p, date_acte_prevue: e.target.value }))} className="h-9 text-sm" />
        </div>
      </div>
      <Button size="sm" className="rounded-full h-9 text-xs" onClick={sauvegarder} disabled={saving}>
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enregistrer"}
      </Button>
    </div>
  );
}

function StepVenteFinal({ tx, onUpdate }) {
  const [prix, setPrix] = useState(tx.prix_vente_final || "");
  const [commission, setCommission] = useState(tx.commission_agence || "");
  const [date, setDate] = useState(tx.date_acte_signe?.substring(0, 10) || "");
  const [saving, setSaving] = useState(false);
  const [cloturing, setCloturing] = useState(false);

  const sauvegarder = async () => {
    setSaving(true);
    await base44.entities.TransactionVente.update(tx.id, { prix_vente_final: Number(prix), commission_agence: Number(commission), date_acte_signe: date });
    setSaving(false); onUpdate();
  };

  const cloturer = async () => {
    setCloturing(true);
    await base44.entities.TransactionVente.update(tx.id, {
      statut: "vendu",
      prix_vente_final: Number(prix),
      commission_agence: Number(commission),
      date_acte_signe: date,
      historique: [...(tx.historique || []), { id: Date.now(), content: `Vente finalisée. Prix : ${fmt(prix)}. Commission : ${fmt(commission)}.`, date: new Date().toISOString() }],
    });
    if (tx.property_id) {
      await base44.entities.Property.update(tx.property_id, { status: "vendu", publish_site: false });
    }
    setCloturing(false); onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold">Signature acte final</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prix de vente final (€)</label>
            <Input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Commission agence (€)</label>
            <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date de signature</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full h-9 text-xs" onClick={sauvegarder} disabled={saving}>Enregistrer</Button>
          {tx.statut !== "vendu" && (
            <Button size="sm" className="rounded-full h-9 text-xs bg-green-600 hover:bg-green-700 gap-1" onClick={cloturer} disabled={cloturing}>
              {cloturing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Finaliser la vente
            </Button>
          )}
        </div>
      </div>
      {tx.statut === "vendu" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-base font-bold text-green-800">Vente finalisée !</p>
          <p className="text-sm text-green-700 mt-1">Prix final : {fmt(tx.prix_vente_final)} · Commission : {fmt(tx.commission_agence)}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminTransactionDetail() {
  const { id } = useParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = async () => {
    const res = await base44.entities.TransactionVente.filter({ id });
    const d = res[0] || null;
    setTx(d);
    if (d) setActiveStep(getStepIndex(d.statut));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const avancerEtape = async () => {
    const nextIdx = getStepIndex(tx.statut) + 1;
    if (nextIdx >= STEPS.length) return;
    const nextStatut = STEPS[nextIdx].key;
    await base44.entities.TransactionVente.update(tx.id, {
      statut: nextStatut,
      current_step: nextIdx + 1,
      historique: [...(tx.historique || []), { id: Date.now(), content: `Étape avancée : ${STEPS[nextIdx].label}`, date: new Date().toISOString() }],
    });
    load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    await base44.entities.TransactionVente.update(tx.id, {
      historique: [...(tx.historique || []), { id: Date.now(), content: note, date: new Date().toISOString() }],
    });
    setNote(""); setSavingNote(false); load();
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!tx) return <div className="text-center py-24 text-sm text-muted-foreground">Transaction introuvable. <Link to="/admin/vente/transactions" className="text-primary hover:underline">← Retour</Link></div>;

  const currentIdx = getStepIndex(tx.statut);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/vente/transactions" className="mt-1 p-1.5 rounded-xl hover:bg-secondary/60 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{tx.property_title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{tx.acquereur_nom} · Réf. {tx.reference}</p>
        </div>
        {tx.statut !== "vendu" && currentIdx < STEPS.length - 1 && (
          <Button size="sm" className="rounded-full h-9 text-xs gap-1" onClick={avancerEtape}>
            Étape suivante <ChevronRight className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map((step, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => i <= currentIdx && setActiveStep(i)}
                  disabled={i > currentIdx}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeStep === i ? "bg-primary text-white shadow-sm" :
                    isDone ? "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer" :
                    isCurrent ? "bg-primary/10 text-primary cursor-pointer" :
                    "bg-secondary/30 text-muted-foreground opacity-50 cursor-default"
                  }`}>
                  {isDone ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : (
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      activeStep === i ? "border-white" : isCurrent ? "border-primary" : "border-muted-foreground/30"
                    }`}>{step.id}</span>
                  )}
                  <span className="hidden sm:block">{step.label}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      {activeStep === 0 && <StepProspection tx={tx} onUpdate={load} />}
      {activeStep === 1 && <StepVisites tx={tx} onUpdate={load} />}
      {activeStep === 2 && <StepOffre tx={tx} onUpdate={load} />}
      {activeStep === 3 && <StepVerification tx={tx} onUpdate={load} />}
      {activeStep === 4 && <StepCompromis tx={tx} onUpdate={load} />}
      {activeStep === 5 && <StepNotaire tx={tx} onUpdate={load} />}
      {activeStep === 6 && <StepVenteFinal tx={tx} onUpdate={load} />}

      {/* Suivi financier comptabilité */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2"><Euro className="w-4 h-4 text-primary" /> Suivi financier (Comptabilité)</p>
        <HistoriquePaiements dossierId={tx.id} dossierType="vente" />
      </div>

      {/* Historique & notes */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold">Historique & notes</p>
        <div className="flex gap-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note..." className="h-9 text-sm flex-1" />
          <Button size="sm" className="rounded-full h-9 text-xs" onClick={addNote} disabled={savingNote || !note.trim()}>
            {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          </Button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {[...(tx.historique || [])].reverse().map((h) => (
            <div key={h.id} className="flex gap-3 text-xs">
              <span className="text-muted-foreground flex-shrink-0">{new Date(h.date).toLocaleDateString("fr-FR")}</span>
              <p className="text-foreground/80">{h.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}