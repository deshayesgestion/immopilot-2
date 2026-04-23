import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Plus, FolderOpen, ChevronRight, User, Home, Euro, CheckCircle2,
  Clock, Loader2, Star, FileText, AlertTriangle, Sparkles, X, ArrowRight,
  CalendarPlus, Calendar, MapPin, ExternalLink, Download
} from "lucide-react";

const ETAPES = [
  { id: "candidature", label: "Candidature",    emoji: "📋", color: "bg-blue-500" },
  { id: "validation",  label: "Validation",     emoji: "✅", color: "bg-amber-500" },
  { id: "signature",   label: "Signature bail", emoji: "📝", color: "bg-purple-500" },
  { id: "edle",        label: "EDL Entrée",     emoji: "🔑", color: "bg-teal-500" },
  { id: "vie_bail",    label: "Vie du bail",    emoji: "🏠", color: "bg-emerald-500" },
  { id: "edls",        label: "EDL Sortie",     emoji: "📦", color: "bg-orange-500" },
  { id: "cloture",     label: "Clôture",        emoji: "🏁", color: "bg-gray-500" },
];

const ETAPE_IDX = Object.fromEntries(ETAPES.map((e, i) => [e.id, i]));

const VALIDATION_COLORS = {
  en_attente: "bg-amber-100 text-amber-700",
  valide: "bg-green-100 text-green-700",
  refuse: "bg-red-100 text-red-700",
};

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

// ── MODAL CRÉATION ────────────────────────────────────────────────────────
function NouveauDossierModal({ biens, contacts, onClose, onCreated }) {
  const [form, setForm] = useState({
    bien_id: "", contact_id: "", loyer_mensuel: "", charges_mensuelle: 0,
    depot_garantie_montant: "", type_bail: "vide", duree_mois: 12,
    date_debut_bail: "", locataire_nom: "", locataire_email: "", locataire_telephone: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectedBien = biens.find(b => b.id === form.bien_id);
  const selectedContact = contacts.find(c => c.id === form.contact_id);

  const handleBienChange = (id) => {
    const b = biens.find(b => b.id === id);
    set("bien_id", id);
    if (b?.prix) set("loyer_mensuel", b.prix);
    if (b?.prix) set("depot_garantie_montant", b.prix * 2);
  };

  const handleContactChange = (id) => {
    const c = contacts.find(c => c.id === id);
    set("contact_id", id);
    if (c) {
      set("locataire_nom", c.nom);
      set("locataire_email", c.email || "");
      set("locataire_telephone", c.telephone || "");
    }
  };

  const handleSave = async () => {
    if (!form.bien_id || !form.locataire_nom || !form.loyer_mensuel) return;
    setSaving(true);
    const ref = `LOC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;
    const bien = biens.find(b => b.id === form.bien_id);
    const dossier = await base44.entities.DossierLocatif.create({
      ...form,
      reference: ref,
      bien_titre: bien?.titre || "",
      bien_adresse: bien?.adresse || "",
      etape: "candidature",
      validation_statut: "en_attente",
      loyer_mensuel: Number(form.loyer_mensuel),
      charges_mensuelle: Number(form.charges_mensuelle) || 0,
      depot_garantie_montant: Number(form.depot_garantie_montant) || 0,
      historique: [{ date: new Date().toISOString(), action: "Dossier créé", auteur: "Agent" }],
    });
    onCreated(dossier);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="text-base font-bold">Nouveau dossier locatif</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Bien *</label>
            <select value={form.bien_id} onChange={e => handleBienChange(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="">Sélectionner un bien…</option>
              {biens.map(b => <option key={b.id} value={b.id}>{b.titre} — {b.prix?.toLocaleString("fr-FR")} €/mois</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Locataire *</label>
            <select value={form.contact_id} onChange={e => handleContactChange(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
              <option value="">Sélectionner un contact…</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.nom} {c.email ? `— ${c.email}` : ""}</option>)}
            </select>
          </div>
          {!form.contact_id && (
            <div className="space-y-2">
              <Input value={form.locataire_nom} onChange={e => set("locataire_nom", e.target.value)}
                placeholder="Nom du locataire *" className="h-9 rounded-xl text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={form.locataire_email} onChange={e => set("locataire_email", e.target.value)}
                  placeholder="Email" className="h-9 rounded-xl text-sm" />
                <Input value={form.locataire_telephone} onChange={e => set("locataire_telephone", e.target.value)}
                  placeholder="Téléphone" className="h-9 rounded-xl text-sm" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Loyer mensuel (€) *</label>
              <Input type="number" value={form.loyer_mensuel} onChange={e => set("loyer_mensuel", e.target.value)}
                placeholder="800" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Charges (€)</label>
              <Input type="number" value={form.charges_mensuelle} onChange={e => set("charges_mensuelle", e.target.value)}
                placeholder="50" className="h-9 rounded-xl text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Dépôt de garantie (€)</label>
              <Input type="number" value={form.depot_garantie_montant} onChange={e => set("depot_garantie_montant", e.target.value)}
                placeholder="1600" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type de bail</label>
              <select value={form.type_bail} onChange={e => set("type_bail", e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="vide">Vide</option>
                <option value="meuble">Meublé</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Date de début</label>
              <Input type="date" value={form.date_debut_bail} onChange={e => set("date_debut_bail", e.target.value)}
                className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Durée (mois)</label>
              <Input type="number" value={form.duree_mois} onChange={e => set("duree_mois", Number(e.target.value))}
                placeholder="12" className="h-9 rounded-xl text-sm" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full gap-2" onClick={handleSave} disabled={saving || !form.locataire_nom || !form.loyer_mensuel}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer le dossier
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── DETAIL DOSSIER ────────────────────────────────────────────────────────
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

function exportICS(evenements) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ImmoPilot//Location//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  evenements.forEach(e => {
    const uid = e.ics_uid || `${e.id}@immopilot`;
    const dtstart = e.date_debut ? new Date(e.date_debut).toISOString().replace(/[-:]/g, "").replace(".000", "") : "";
    const dtend = e.date_fin ? new Date(e.date_fin).toISOString().replace(/[-:]/g, "").replace(".000", "") : dtstart;
    lines.push("BEGIN:VEVENT", `UID:${uid}`, `SUMMARY:${e.titre}`);
    if (dtstart) lines.push(`DTSTART:${dtstart}`);
    if (dtend) lines.push(`DTEND:${dtend}`);
    if (e.lieu) lines.push(`LOCATION:${e.lieu}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "visites-location.ics"; a.click();
  URL.revokeObjectURL(a.href);
}

// ── PLANIFIER VISITE ──────────────────────────────────────────────────────
function PlanifierVisiteSection({ dossier, onVisiteCreated }) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const defaultDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours()+1)}:00`;
  const [form, setForm] = useState({ date_debut: defaultDate, date_fin: "", type: "visite", notes: "" });
  const [visites, setVisites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
    if (dossier.id) {
      base44.entities.Evenement.filter({ dossier_locatif_id: dossier.id }).then(setVisites);
    }
  }, [dossier.id]);

  // auto-end +1h
  const handleDateChange = (val) => {
    const d = new Date(val); d.setHours(d.getHours() + 1);
    setForm(p => ({ ...p, date_debut: val, date_fin: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }));
  };

  const creerVisite = async () => {
    if (!form.date_debut) return;
    setSaving(true);
    const titre = `${form.type === "visite" ? "Visite" : "EDL"} — ${dossier.bien_titre || dossier.locataire_nom}`;
    const ev = await base44.entities.Evenement.create({
      titre,
      type: form.type,
      module: "location",
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      lieu: dossier.bien_adresse || "",
      contact_nom: dossier.locataire_nom,
      contact_email: dossier.locataire_email || "",
      contact_telephone: dossier.locataire_telephone || "",
      bien_titre: dossier.bien_titre || "",
      bien_id: dossier.bien_id || "",
      dossier_locatif_id: dossier.id,
      statut: "planifie",
      rappel_24h: true,
      rappel_1h: true,
      ics_uid: `${Date.now()}@immopilot`,
      agent_email: currentUser?.email || "",
      agent_nom: currentUser?.full_name || "",
      notes: form.notes,
    });
    setVisites(p => [ev, ...p]);
    onVisiteCreated && onVisiteCreated(ev);
    setShowForm(false);
    setSaving(false);
  };

  const STATUT_CFG = {
    planifie: "bg-blue-100 text-blue-700",
    confirme: "bg-green-100 text-green-700",
    annule: "bg-red-100 text-red-700",
    realise: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> Visites & RDV planifiés ({visites.length})
        </p>
        <div className="flex gap-2">
          {visites.length > 0 && (
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-blue-300"
              onClick={() => exportICS(visites)}>
              <Download className="w-3 h-3" /> ICS
            </Button>
          )}
          <Button size="sm" className="h-7 text-xs rounded-full gap-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowForm(!showForm)}>
            <CalendarPlus className="w-3 h-3" /> Planifier
          </Button>
        </div>
      </div>

      {/* Liste visites existantes */}
      {visites.length > 0 && (
        <div className="space-y-1.5">
          {visites.map(v => (
            <div key={v.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 text-xs">
              <div className="flex-1">
                <span className="font-medium">{v.titre}</span>
                <span className="text-muted-foreground ml-2">{fmtDateTime(v.date_debut)}</span>
                {v.lieu && <span className="text-muted-foreground ml-2 flex items-center gap-0.5 inline-flex"><MapPin className="w-2.5 h-2.5" />{v.lieu}</span>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_CFG[v.statut] || STATUT_CFG.planifie}`}>{v.statut}</span>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white rounded-xl p-3 space-y-2 border border-blue-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full h-8 rounded-lg border border-input bg-white px-2 text-xs">
                <option value="visite">Visite</option>
                <option value="etat_des_lieux">État des lieux</option>
                <option value="signature">Signature</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date & heure *</label>
              <Input type="datetime-local" value={form.date_debut} onChange={e => handleDateChange(e.target.value)}
                className="h-8 rounded-lg text-xs" />
            </div>
          </div>
          <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Notes (optionnel)" className="h-8 rounded-lg text-xs" />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs rounded-full bg-blue-600 hover:bg-blue-700 gap-1"
              onClick={creerVisite} disabled={saving || !form.date_debut}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />}
              Créer le RDV
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
          <p className="text-[10px] text-blue-600 flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            Visible dans <Link to="/admin/agenda" className="underline font-medium">l'Agenda global</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function DossierDetail({ dossier, onClose, onUpdate }) {
  const [d, setD] = useState(dossier);
  const [scoring, setScoring] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentEtapeIdx = ETAPE_IDX[d.etape] || 0;

  const save = async (data) => {
    setSaving(true);
    // S'assurer que les champs requis sont toujours présents dans la mise à jour
    const safeData = {
      locataire_nom: d.locataire_nom || "—",
      bien_id: d.bien_id || "unknown",
      loyer_mensuel: d.loyer_mensuel || 0,
      ...data,
    };
    await base44.entities.DossierLocatif.update(d.id, safeData);
    setD(prev => ({ ...prev, ...safeData }));
    onUpdate({ ...d, ...safeData });
    setSaving(false);
  };

  const avancer = async () => {
    const nextIdx = currentEtapeIdx + 1;
    if (nextIdx >= ETAPES.length) return;
    const nextEtape = ETAPES[nextIdx].id;
    const histEntry = { date: new Date().toISOString(), action: `Passage à l'étape : ${ETAPES[nextIdx].label}`, auteur: "Agent" };
    await save({ etape: nextEtape, historique: [...(d.historique || []), histEntry] });
  };

  const scoringIA = async () => {
    setScoring(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en solvabilité locative. Analyse ce dossier locataire et donne un score de 0 à 100 avec commentaire.
Locataire: ${d.locataire_nom}
Loyer mensuel: ${d.loyer_mensuel}€
Charges: ${d.charges_mensuelle || 0}€
Type de bail: ${d.type_bail}
Durée: ${d.duree_mois} mois
Notes: ${d.notes || "aucune"}

Retourne JSON: { score: number, commentaire: string (max 150 chars, concis et professionnel) }`,
      response_json_schema: {
        type: "object",
        properties: { score: { type: "number" }, commentaire: { type: "string" } }
      }
    });
    if (result?.score !== undefined) {
      await save({ scoring_ia: result.score, scoring_commentaire: result.commentaire });
    }
    setScoring(false);
  };

  const etapeCfg = ETAPES[currentEtapeIdx];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-muted-foreground">{d.reference || "Dossier locatif"}</p>
            <h2 className="text-base font-bold">{d.locataire_nom} · {d.bien_titre}</h2>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        </div>

        {/* Stepper */}
        <div className="px-5 py-4 border-b border-border/30 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {ETAPES.map((e, i) => {
              const done = i < currentEtapeIdx;
              const active = i === currentEtapeIdx;
              return (
                <div key={e.id} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    done ? "bg-emerald-100 text-emerald-700" :
                    active ? `${e.color} text-white shadow-sm` :
                    "bg-secondary/40 text-muted-foreground"
                  }`}>
                    <span>{e.emoji}</span>
                    <span className="hidden sm:inline">{e.label}</span>
                    {done && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  {i < ETAPES.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-5 space-y-5">
          {/* Planifier visite — toujours visible */}
          <PlanifierVisiteSection dossier={d} />

          {/* Infos générales */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Loyer + Charges", value: `${(d.loyer_mensuel + (d.charges_mensuelle || 0)).toLocaleString("fr-FR")} €/mois` },
              { label: "Dépôt de garantie", value: d.depot_garantie_montant ? `${d.depot_garantie_montant.toLocaleString("fr-FR")} €` : "—" },
              { label: "Début du bail", value: fmt(d.date_debut_bail) },
              { label: "Type de bail", value: d.type_bail || "—" },
            ].map(item => (
              <div key={item.label} className="bg-secondary/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-bold mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* ETAPE: Validation + Scoring IA */}
          {(d.etape === "candidature" || d.etape === "validation") && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-amber-800">Scoring IA de solvabilité</p>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1.5 border-amber-300"
                  onClick={scoringIA} disabled={scoring}>
                  {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Analyser
                </Button>
              </div>
              {d.scoring_ia !== undefined && d.scoring_ia !== null ? (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`text-2xl font-bold ${d.scoring_ia >= 70 ? "text-green-600" : d.scoring_ia >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {d.scoring_ia}/100
                    </div>
                    <div className="flex-1 bg-white rounded-full h-2">
                      <div className={`h-2 rounded-full ${d.scoring_ia >= 70 ? "bg-green-500" : d.scoring_ia >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${d.scoring_ia}%` }} />
                    </div>
                  </div>
                  {d.scoring_commentaire && <p className="text-xs text-amber-700">{d.scoring_commentaire}</p>}
                </div>
              ) : (
                <p className="text-xs text-amber-600">Cliquez sur "Analyser" pour obtenir le score IA de ce locataire</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-8 text-xs rounded-full bg-green-500 hover:bg-green-600 gap-1"
                  onClick={() => save({ validation_statut: "valide" })}>
                  <CheckCircle2 className="w-3 h-3" /> Valider
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-full border-red-300 text-red-600 gap-1"
                  onClick={() => save({ validation_statut: "refuse" })}>
                  <X className="w-3 h-3" /> Refuser
                </Button>
                {d.validation_statut && (
                  <span className={`self-center text-xs px-2 py-1 rounded-full ${VALIDATION_COLORS[d.validation_statut]}`}>
                    {d.validation_statut}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Signature bail */}
          {d.etape === "signature" && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800">📝 Signature du bail</p>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">URL du contrat signé</label>
                <Input value={d.bail_url || ""} onChange={e => save({ bail_url: e.target.value })}
                  placeholder="https://…" className="h-9 rounded-xl text-sm" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={d.bail_signe || false} onChange={e => save({ bail_signe: e.target.checked, bail_statut: e.target.checked ? "actif" : "en_preparation" })}
                  className="rounded" />
                <span className="text-sm">Bail signé par toutes les parties</span>
              </label>
            </div>
          )}

          {/* EDL Entrée */}
          {d.etape === "edle" && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-teal-800">🔑 État des lieux d'entrée</p>
              <p className="text-xs text-teal-600">Date : {fmt(d.edle_date) || "Non renseignée"}</p>
              <Input type="date" value={d.edle_date || ""} onChange={e => save({ edle_date: e.target.value })}
                className="h-9 rounded-xl text-sm" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={d.edle_signe || false} onChange={e => save({ edle_signe: e.target.checked })} className="rounded" />
                <span className="text-sm">EDL signé par locataire et propriétaire</span>
              </label>
            </div>
          )}

          {/* Vie du bail */}
          {d.etape === "vie_bail" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-emerald-800">🏠 Bail actif</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Statut bail :</span> <span className="font-bold capitalize">{d.bail_statut || "actif"}</span></div>
                <div><span className="text-muted-foreground">Dépôt de garantie :</span> <span className="font-bold capitalize">{d.depot_garantie_statut?.replace("_", " ") || "—"}</span></div>
              </div>
              {d.date_fin_bail && (
                <p className="text-xs text-amber-600 font-medium">⚠️ Fin de bail prévue le {fmt(d.date_fin_bail)}</p>
              )}
            </div>
          )}

          {/* EDL Sortie */}
          {d.etape === "edls" && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-orange-800">📦 État des lieux de sortie</p>
              <Input type="date" value={d.edls_date || ""} onChange={e => save({ edls_date: e.target.value })}
                className="h-9 rounded-xl text-sm" placeholder="Date EDL sortie" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={d.edls_signe || false} onChange={e => save({ edls_signe: e.target.checked })} className="rounded" />
                <span className="text-sm">EDL sortie signé</span>
              </label>
            </div>
          )}

          {/* Clôture / Dépôt */}
          {d.etape === "cloture" && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold">🏁 Clôture du dossier</p>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Montant restitué (€)</label>
                <Input type="number" value={d.depot_garantie_restitution_montant || ""}
                  onChange={e => save({ depot_garantie_restitution_montant: Number(e.target.value), depot_garantie_statut: "restitue_partiel" })}
                  placeholder={String(d.depot_garantie_montant || 0)} className="h-9 rounded-xl text-sm" />
                <Button size="sm" className="rounded-full gap-1.5 bg-gray-600 hover:bg-gray-700 text-xs h-8"
                  onClick={() => save({ depot_garantie_statut: "restitue_total", depot_garantie_restitution_montant: d.depot_garantie_montant, bail_statut: "termine" })}>
                  <CheckCircle2 className="w-3 h-3" /> Marquer clôturé
                </Button>
              </div>
            </div>
          )}

          {/* Bouton avancer */}
          {currentEtapeIdx < ETAPES.length - 1 && (
            <Button className="w-full rounded-full gap-2" onClick={avancer}>
              Passer à l'étape suivante : {ETAPES[currentEtapeIdx + 1]?.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {/* Historique */}
          {d.historique?.length > 0 && (
            <div className="border-t border-border/30 pt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Historique</p>
              <div className="space-y-1.5">
                {d.historique.slice(-5).reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground/60">{fmt(h.date)}</span>
                    <span className="text-muted-foreground">{h.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function LocationWorkflow({ biens, contacts }) {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterEtape, setFilterEtape] = useState("all");

  useEffect(() => {
    base44.entities.DossierLocatif.list("-created_date", 200).then(data => {
      setDossiers(data);
      setLoading(false);
    });
  }, []);

  const filtered = dossiers.filter(d => filterEtape === "all" || d.etape === filterEtape);

  const stats = ETAPES.map(e => ({
    ...e, count: dossiers.filter(d => d.etape === e.id).length
  }));

  const update = (updated) => setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));

  const bienMap = Object.fromEntries(biens.map(b => [b.id, b]));

  return (
    <div className="space-y-4">
      {/* Stats étapes */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {stats.map(e => (
          <button key={e.id} onClick={() => setFilterEtape(filterEtape === e.id ? "all" : e.id)}
            className={`text-center p-2.5 rounded-xl border transition-all ${
              filterEtape === e.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-white border-border/40 hover:border-primary/30"
            }`}>
            <span className="text-lg block">{e.emoji}</span>
            <span className="text-lg font-bold block">{e.count}</span>
            <span className="text-[9px] text-muted-foreground leading-tight block">{e.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} dossier{filtered.length > 1 ? "s" : ""}</p>
        <Button className="rounded-full gap-1.5 h-9 text-sm" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5" /> Nouveau dossier
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-12 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun dossier locatif</p>
          <Button className="rounded-full gap-2 mt-4 h-9 text-sm" onClick={() => setShowNew(true)}>
            <Plus className="w-3.5 h-3.5" /> Créer un dossier
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const etapeCfg = ETAPES.find(e => e.id === d.etape) || ETAPES[0];
            const idx = ETAPE_IDX[d.etape] || 0;
            const progress = Math.round((idx / (ETAPES.length - 1)) * 100);
            return (
              <div key={d.id} onClick={() => setSelected(d)}
                className="bg-white rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{d.locataire_nom}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white ${etapeCfg.color}`}>{etapeCfg.emoji} {etapeCfg.label}</span>
                      {d.validation_statut === "refuse" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Refusé</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.bien_titre || "—"} · {d.loyer_mensuel?.toLocaleString("fr-FR")} €/mois</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-secondary/40 rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{progress}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {d.scoring_ia !== undefined && d.scoring_ia !== null && (
                      <div className={`text-xs font-bold ${d.scoring_ia >= 70 ? "text-green-600" : d.scoring_ia >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        <Star className="w-3 h-3 inline mr-0.5" />{d.scoring_ia}/100
                      </div>
                    )}
                    {d.reference && <p className="text-[10px] text-muted-foreground">{d.reference}</p>}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto mt-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini-planning visites locatives */}
      <MiniPlanningVisites />

      {showNew && <NouveauDossierModal biens={biens} contacts={contacts} onClose={() => setShowNew(false)} onCreated={d => { setDossiers(p => [d, ...p]); setSelected(d); }} />}
      {selected && <DossierDetail dossier={selected} onClose={() => setSelected(null)} onUpdate={update} />}
    </div>
  );
}

// ── MINI PLANNING VISITES LOCATIVES ───────────────────────────────────────
function MiniPlanningVisites() {
  const [visites, setVisites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Evenement.filter({ module: "location" }, "-date_debut", 50).then(data => {
      setVisites(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const STATUT_CFG = {
    planifie: { label: "Planifié",  cls: "bg-blue-100 text-blue-700" },
    confirme: { label: "Confirmé",  cls: "bg-green-100 text-green-700" },
    annule:   { label: "Annulé",    cls: "bg-red-100 text-red-700" },
    realise:  { label: "Réalisé",   cls: "bg-gray-100 text-gray-600" },
  };

  const upcoming = visites.filter(v => v.statut !== "annule" && new Date(v.date_debut) >= new Date());
  const past = visites.filter(v => v.statut !== "annule" && new Date(v.date_debut) < new Date());

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Planning des visites location
          {upcoming.length > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{upcoming.length} à venir</span>}
        </p>
        <div className="flex gap-2">
          {visites.length > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1.5"
              onClick={() => exportICS(visites)}>
              <Download className="w-3 h-3" /> Export ICS / iCal
            </Button>
          )}
          <Link to="/admin/agenda">
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1.5">
              <ExternalLink className="w-3 h-3" /> Agenda global
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-6">Aucune visite planifiée. Ouvrez un dossier pour planifier.</p>
      ) : (
        <div className="space-y-3">
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">À venir</p>
              <div className="space-y-1.5">
                {upcoming.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut)).map(v => {
                  const cfg = STATUT_CFG[v.statut] || STATUT_CFG.planifie;
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-3 py-2.5 bg-secondary/20 rounded-xl text-sm">
                      <div className="w-1.5 h-8 rounded-full bg-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{v.titre}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateTime(v.date_debut)}{v.lieu ? ` · ${v.lieu}` : ""}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                        {v.contact_nom && <p className="text-[10px] text-muted-foreground mt-0.5">{v.contact_nom}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Passées ({past.length})</p>
              <div className="space-y-1.5">
                {past.slice(0, 5).sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut)).map(v => {
                  const cfg = STATUT_CFG[v.statut] || STATUT_CFG.realise;
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-3 py-2 opacity-60 text-sm">
                      <div className="w-1.5 h-6 rounded-full bg-gray-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{v.titre}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtDateTime(v.date_debut)}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border/30 pt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Download className="w-3 h-3" />
        <span>Export ICS compatible Google Calendar, Apple Calendar et Outlook</span>
      </div>
    </div>
  );
}