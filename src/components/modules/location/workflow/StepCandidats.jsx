import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Plus, X, Loader2, Sparkles, Star, CheckCircle2, AlertTriangle,
  User, ChevronRight, ChevronDown, Calendar, CalendarPlus,
  Phone, Mail, Briefcase, Euro, FileText, ThumbsUp, ThumbsDown,
  AlertCircle, Trophy, ExternalLink, Download
} from "lucide-react";

const STATUT_CFG = {
  prospect:         { label: "Prospect",         cls: "bg-slate-100 text-slate-600" },
  dossier_complet:  { label: "Dossier complet",  cls: "bg-blue-100 text-blue-700" },
  visite_planifiee: { label: "Visite planifiée", cls: "bg-indigo-100 text-indigo-700" },
  visite_faite:     { label: "Visite faite",     cls: "bg-cyan-100 text-cyan-700" },
  selectionne:      { label: "Sélectionné ✓",    cls: "bg-green-100 text-green-700" },
  refuse:           { label: "Refusé",            cls: "bg-red-100 text-red-700" },
  converti:         { label: "Locataire",         cls: "bg-emerald-100 text-emerald-700" },
};

const SITUATION_PRO = [
  { value: "cdi", label: "CDI" }, { value: "cdd", label: "CDD" },
  { value: "independant", label: "Indépendant" }, { value: "retraite", label: "Retraité" },
  { value: "etudiant", label: "Étudiant" }, { value: "sans_emploi", label: "Sans emploi" },
  { value: "autre", label: "Autre" },
];

const DOCS = [
  { key: "docs_identite",   label: "Pièce d'identité",        required: true },
  { key: "docs_revenus",    label: "Justificatif de revenus",  required: true },
  { key: "docs_imposition", label: "Avis d'imposition",        required: true },
  { key: "docs_domicile",   label: "Justificatif de domicile", required: false },
];

const RECOMMANDATION_CFG = {
  fort:   { label: "Profil FORT",   cls: "bg-green-100 text-green-700 border-green-300" },
  moyen:  { label: "Profil MOYEN",  cls: "bg-amber-100 text-amber-700 border-amber-300" },
  faible: { label: "Profil FAIBLE", cls: "bg-red-100 text-red-700 border-red-300" },
};

const fmtDT = iso => iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function exportICS(evenements) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ImmoPilot//Candidats//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  evenements.forEach(e => {
    const uid = e.ics_uid || `${e.id}@immopilot`;
    const dtstart = e.date_debut ? new Date(e.date_debut).toISOString().replace(/[-:]/g, "").replace(".000", "") : "";
    lines.push("BEGIN:VEVENT", `UID:${uid}`, `SUMMARY:${e.titre}`);
    if (dtstart) lines.push(`DTSTART:${dtstart}`);
    if (e.lieu) lines.push(`LOCATION:${e.lieu}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rdv-candidats.ics"; a.click();
  URL.revokeObjectURL(a.href);
}

// ── Modal ajout candidat ──────────────────────────────────────────────────
function AddCandidatModal({ bien, contacts, onClose, onSaved }) {
  const [form, setForm] = useState({
    contact_id: "", nom: "", email: "", telephone: "",
    situation_pro: "cdi", employeur: "", revenus_mensuels: "",
    revenus_garant: "", nom_garant: "", notes_agent: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleContactChange = id => {
    const c = contacts.find(c => c.id === id);
    set("contact_id", id);
    if (c) { set("nom", c.nom); set("email", c.email || ""); set("telephone", c.telephone || ""); }
  };

  const handleSave = async () => {
    if (!form.nom) return;
    setSaving(true);
    const candidat = await base44.entities.CandidatLocataire.create({
      ...form,
      bien_id: bien.id,
      bien_titre: bien.titre || "",
      bien_adresse: bien.adresse || "",
      revenus_mensuels: Number(form.revenus_mensuels) || 0,
      revenus_garant: Number(form.revenus_garant) || 0,
      statut: "prospect",
    });
    onSaved(candidat);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div>
            <h2 className="text-base font-bold">Ajouter un candidat</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Bien : {bien?.titre}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {contacts.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Contact existant (optionnel)</label>
              <select value={form.contact_id} onChange={e => handleContactChange(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="">— Nouveau prospect —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.nom}{c.email ? ` — ${c.email}` : ""}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nom complet *</label>
              <Input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Prénom Nom" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Téléphone</label>
              <Input value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="06…" className="h-9 rounded-xl text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@…" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Situation pro.</label>
              <select value={form.situation_pro} onChange={e => set("situation_pro", e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                {SITUATION_PRO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Employeur</label>
              <Input value={form.employeur} onChange={e => set("employeur", e.target.value)} placeholder="Société…" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Revenus nets/mois (€)</label>
              <Input type="number" value={form.revenus_mensuels} onChange={e => set("revenus_mensuels", e.target.value)} placeholder="2500" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Revenus garant (€)</label>
              <Input type="number" value={form.revenus_garant} onChange={e => set("revenus_garant", e.target.value)} placeholder="0" className="h-9 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nom du garant</label>
            <Input value={form.nom_garant} onChange={e => set("nom_garant", e.target.value)} placeholder="Garant (si applicable)" className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes agent</label>
            <Input value={form.notes_agent} onChange={e => set("notes_agent", e.target.value)} placeholder="Observations…" className="h-9 rounded-xl text-sm" />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full gap-2" onClick={handleSave} disabled={saving || !form.nom}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter candidat
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal RDV ─────────────────────────────────────────────────────────────
function RdvModal({ candidat, onClose, onSaved }) {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const defDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours()+1)}:00`;
  const [form, setForm] = useState({ type: "visite", date_debut: defDate, agent_nom: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setForm(p => ({ ...p, agent_nom: u?.full_name || "", agent_email: u?.email || "" })));
  }, []);

  const handleSave = async () => {
    if (!form.date_debut) return;
    setSaving(true);
    const end = new Date(form.date_debut); end.setHours(end.getHours() + 1);
    const date_fin = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}T${pad(end.getHours())}:00`;
    const typeLabel = form.type === "visite" ? "Visite" : form.type === "etat_des_lieux" ? "EDL" : "Signature";
    const ev = await base44.entities.Evenement.create({
      titre: `${typeLabel} — ${candidat.nom} · ${candidat.bien_titre}`,
      type: form.type, module: "location",
      date_debut: form.date_debut, date_fin,
      lieu: candidat.bien_adresse || "",
      contact_nom: candidat.nom, contact_email: candidat.email || "",
      contact_telephone: candidat.telephone || "",
      bien_titre: candidat.bien_titre || "", bien_id: candidat.bien_id,
      statut: "planifie", rappel_24h: true, rappel_1h: true,
      ics_uid: `${Date.now()}@immopilot`,
      agent_nom: form.agent_nom, agent_email: form.agent_email || "",
      notes: form.notes,
    });
    const updatedIds = [...(candidat.evenement_ids || []), ev.id];
    await base44.entities.CandidatLocataire.update(candidat.id, {
      evenement_ids: updatedIds,
      statut: ["prospect", "dossier_complet"].includes(candidat.statut) ? "visite_planifiee" : candidat.statut,
    });
    onSaved(ev);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-bold flex items-center gap-2"><CalendarPlus className="w-4 h-4 text-indigo-600" /> Planifier un RDV</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="px-5 pt-4 space-y-2">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Candidat : <strong className="ml-1">{candidat.nom}</strong>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bien : <strong className="ml-1">{candidat.bien_titre || "—"}</strong>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                <option value="visite">Visite</option>
                <option value="etat_des_lieux">État des lieux</option>
                <option value="signature">Signature</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date & heure *</label>
              <Input type="datetime-local" value={form.date_debut} onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))} className="h-9 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Agent</label>
            <Input value={form.agent_nom} onChange={e => setForm(p => ({ ...p, agent_nom: e.target.value }))} placeholder="Nom de l'agent" className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Instructions…" className="h-9 rounded-xl text-sm" />
          </div>
          <p className="text-[10px] text-indigo-600 flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" /> Visible dans <Link to="/admin/agenda" className="underline font-medium ml-0.5">l'Agenda global</Link>
          </p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={saving || !form.date_debut}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            Créer le RDV
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Fiche candidat ────────────────────────────────────────────────────────
function CandidatCard({ candidat, loyer, onUpdate, onRdv, onSelect, onRefuse, onConvertir }) {
  const [expanded, setExpanded] = useState(false);
  const [scoring, setScoring] = useState(false);

  const allDocsMandatory = DOCS.filter(d => d.required).every(d => candidat[d.key]);
  const recommCfg = RECOMMANDATION_CFG[candidat.scoring_recommandation] || null;
  const ratio = loyer && candidat.revenus_mensuels ? (loyer / candidat.revenus_mensuels * 100).toFixed(0) : null;

  const toggleDoc = async (key) => {
    const updated = { [key]: !candidat[key] };
    await base44.entities.CandidatLocataire.update(candidat.id, updated);
    const newState = { ...candidat, ...updated };
    const docsOk = DOCS.filter(d => d.required).every(d => newState[d.key]);
    if (docsOk && candidat.statut === "prospect") {
      await base44.entities.CandidatLocataire.update(candidat.id, { statut: "dossier_complet" });
      onUpdate({ ...newState, statut: "dossier_complet" });
    } else {
      onUpdate(newState);
    }
  };

  const lancerScoringIA = async () => {
    setScoring(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert IA scoring locatif. Analyse ce candidat pour un bien à ${loyer}€/mois.
Candidat: ${candidat.nom}
Situation: ${candidat.situation_pro} chez ${candidat.employeur || "N/A"}
Revenus nets: ${candidat.revenus_mensuels || 0}€/mois
Garant: ${candidat.nom_garant || "aucun"} (revenus: ${candidat.revenus_garant || 0}€)
Ratio loyer/revenus: ${ratio || "?"}%
Documents: identité=${candidat.docs_identite}, revenus=${candidat.docs_revenus}, imposition=${candidat.docs_imposition}, domicile=${candidat.docs_domicile}
Notes: ${candidat.notes_agent || "aucune"}

Retourne JSON: { score: number (0-100), solvabilite: number (0-100), risque: "faible"|"modere"|"eleve", stabilite: "forte"|"moyenne"|"faible", recommandation: "fort"|"moyen"|"faible", commentaire: string (max 180 chars), detail: { coherence_revenus: string, capacite_paiement: string, stabilite_locative: string } }`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" }, solvabilite: { type: "number" },
          risque: { type: "string" }, stabilite: { type: "string" },
          recommandation: { type: "string" }, commentaire: { type: "string" },
          detail: { type: "object" }
        }
      }
    });
    if (result?.score !== undefined) {
      const updates = {
        scoring_ia: result.score, scoring_solvabilite: result.solvabilite,
        scoring_risque: result.risque, scoring_stabilite: result.stabilite,
        scoring_recommandation: result.recommandation, scoring_commentaire: result.commentaire,
        scoring_detail: result.detail || {},
      };
      await base44.entities.CandidatLocataire.update(candidat.id, updates);
      onUpdate({ ...candidat, ...updates });
    }
    setScoring(false);
  };

  const statutCfg = STATUT_CFG[candidat.statut] || STATUT_CFG.prospect;

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      candidat.statut === "selectionne" ? "border-green-400 shadow-md ring-1 ring-green-300" :
      candidat.statut === "refuse" ? "border-red-200 opacity-60" :
      "border-border/50 hover:border-primary/30"
    }`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${
          candidat.scoring_ia >= 70 ? "bg-green-100 text-green-700" :
          candidat.scoring_ia >= 50 ? "bg-amber-100 text-amber-700" :
          candidat.scoring_ia > 0 ? "bg-red-100 text-red-700" : "bg-secondary text-muted-foreground"
        }`}>
          {candidat.scoring_ia > 0 ? candidat.scoring_ia : <Star className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{candidat.nom}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statutCfg.cls}`}>{statutCfg.label}</span>
            {recommCfg && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${recommCfg.cls}`}>{recommCfg.label}</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {SITUATION_PRO.find(s => s.value === candidat.situation_pro)?.label || "—"} · {candidat.revenus_mensuels ? `${candidat.revenus_mensuels.toLocaleString("fr-FR")} €/mois` : "revenus N/A"}
            {ratio && <span className={`ml-2 font-medium ${Number(ratio) <= 33 ? "text-green-600" : Number(ratio) <= 40 ? "text-amber-600" : "text-red-600"}`}>({ratio}% du loyer)</span>}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {DOCS.map(d => (
              <div key={d.key} className={`w-2 h-2 rounded-full ${candidat[d.key] ? "bg-green-500" : d.required ? "bg-red-300" : "bg-gray-200"}`} title={d.label} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">{DOCS.filter(d => candidat[d.key]).length}/{DOCS.length} docs</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-indigo-200 text-indigo-600"
            onClick={e => { e.stopPropagation(); onRdv(candidat); }}>
            <CalendarPlus className="w-3 h-3" /> RDV
          </Button>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Phone, label: "Téléphone", value: candidat.telephone || "—" },
              { icon: Mail, label: "Email", value: candidat.email || "—" },
              { icon: Briefcase, label: "Employeur", value: candidat.employeur || "—" },
              { icon: Euro, label: "Garant", value: candidat.nom_garant ? `${candidat.nom_garant} (${candidat.revenus_garant || 0} €)` : "Aucun" },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2 bg-secondary/20 rounded-xl px-3 py-2">
                <item.icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-medium truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Documents</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DOCS.map(doc => (
                <label key={doc.key} className="flex items-center gap-2 bg-secondary/10 rounded-xl px-3 py-2 cursor-pointer hover:bg-secondary/30">
                  <input type="checkbox" checked={!!candidat[doc.key]} onChange={() => toggleDoc(doc.key)} className="rounded accent-primary" />
                  <span className="text-xs flex-1">{doc.label}</span>
                  {doc.required && !candidat[doc.key] && <span className="text-[9px] text-red-500 font-medium">Req.</span>}
                  {candidat[doc.key] && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                </label>
              ))}
            </div>
          </div>

          {/* Scoring IA */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Scoring IA</p>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-amber-300" onClick={lancerScoringIA} disabled={scoring}>
                {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {candidat.scoring_ia > 0 ? "Ré-analyser" : "Analyser"}
              </Button>
            </div>
            {!allDocsMandatory && (
              <p className="text-[10px] text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Docs obligatoires manquants — analyse approximative.</p>
            )}
            {candidat.scoring_ia > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-black ${candidat.scoring_ia >= 70 ? "text-green-600" : candidat.scoring_ia >= 50 ? "text-amber-600" : "text-red-600"}`}>
                    {candidat.scoring_ia}<span className="text-sm font-medium">/100</span>
                  </span>
                  <div className="flex-1 bg-white rounded-full h-2">
                    <div className={`h-2 rounded-full ${candidat.scoring_ia >= 70 ? "bg-green-500" : candidat.scoring_ia >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${candidat.scoring_ia}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: "Solvabilité", value: candidat.scoring_solvabilite, green: v => v >= 70 },
                    { label: "Risque", value: candidat.scoring_risque, green: v => v === "faible" },
                    { label: "Stabilité", value: candidat.scoring_stabilite, green: v => v === "forte" },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg p-1.5">
                      <p className="text-[9px] text-muted-foreground">{item.label}</p>
                      <p className={`text-xs font-bold capitalize ${item.green(item.value) ? "text-green-600" : "text-amber-600"}`}>{item.value || "—"}</p>
                    </div>
                  ))}
                </div>
                {candidat.scoring_detail && Object.entries(candidat.scoring_detail).map(([k, v]) => (
                  <div key={k} className="flex gap-1.5 text-[10px]">
                    <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")} :</span>
                    <span className="text-amber-800">{v}</span>
                  </div>
                ))}
                {candidat.scoring_commentaire && (
                  <p className="text-[10px] text-amber-700 bg-white rounded-lg px-2 py-1.5 italic">{candidat.scoring_commentaire}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {!["selectionne", "refuse", "converti"].includes(candidat.statut) && (
              <Button size="sm" className="h-8 text-xs rounded-full gap-1 bg-green-500 hover:bg-green-600" onClick={() => onSelect(candidat)}>
                <Trophy className="w-3 h-3" /> Sélectionner
              </Button>
            )}
            {candidat.statut === "selectionne" && (
              <Button size="sm" className="h-8 text-xs rounded-full gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => onConvertir(candidat)}>
                <CheckCircle2 className="w-3 h-3" /> Convertir en locataire
              </Button>
            )}
            {!["refuse", "converti"].includes(candidat.statut) && (
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1 border-red-200 text-red-600" onClick={() => onRefuse(candidat)}>
                <X className="w-3 h-3" /> Refuser
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────
// Utilisé dans DossierDetail à l'étape "candidat"
export default function StepCandidats({ dossier, onDossierUpdate }) {
  const [candidats, setCandidats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [rdvCandidat, setRdvCandidat] = useState(null);
  const [rdvs, setRdvs] = useState([]);

  const bien = { id: dossier.bien_id, titre: dossier.bien_titre, adresse: dossier.bien_adresse, prix: dossier.loyer_mensuel };

  useEffect(() => {
    Promise.all([
      base44.entities.CandidatLocataire.filter({ bien_id: dossier.bien_id }),
      base44.entities.Contact.list("-created_date", 200),
      base44.entities.Evenement.filter({ bien_id: dossier.bien_id, module: "location" }, "-date_debut", 20),
    ]).then(([cands, conts, evs]) => {
      setCandidats(cands);
      setContacts(conts);
      setRdvs(evs);
      setLoading(false);
    });
  }, [dossier.bien_id]);

  const actifs = candidats.filter(c => c.statut !== "refuse" && c.statut !== "converti");
  const selectionne = candidats.find(c => c.statut === "selectionne");

  const handleUpdate = updated => setCandidats(prev => prev.map(c => c.id === updated.id ? updated : c));

  const handleSelect = async (candidat) => {
    for (const c of candidats.filter(c => c.statut === "selectionne" && c.id !== candidat.id)) {
      await base44.entities.CandidatLocataire.update(c.id, { statut: "dossier_complet" });
    }
    await base44.entities.CandidatLocataire.update(candidat.id, { statut: "selectionne" });
    setCandidats(prev => prev.map(c => {
      if (c.id === candidat.id) return { ...c, statut: "selectionne" };
      if (c.statut === "selectionne") return { ...c, statut: "dossier_complet" };
      return c;
    }));
    // Mettre à jour le dossier avec le candidat sélectionné
    await base44.entities.DossierLocatif.update(dossier.id, {
      candidat_selectionne_id: candidat.id,
      locataire_nom: candidat.nom,
      locataire_email: candidat.email || dossier.locataire_email,
      locataire_telephone: candidat.telephone || dossier.locataire_telephone,
      scoring_ia: candidat.scoring_ia,
      scoring_commentaire: candidat.scoring_commentaire,
    });
    onDossierUpdate({
      candidat_selectionne_id: candidat.id,
      locataire_nom: candidat.nom,
      scoring_ia: candidat.scoring_ia,
    });
  };

  const handleRefuse = async (candidat) => {
    await base44.entities.CandidatLocataire.update(candidat.id, { statut: "refuse" });
    setCandidats(prev => prev.map(c => c.id === candidat.id ? { ...c, statut: "refuse" } : c));
  };

  const handleConvertir = async (candidat) => {
    await base44.entities.CandidatLocataire.update(candidat.id, { statut: "converti", dossier_locatif_id: dossier.id });
    setCandidats(prev => prev.map(c => c.id === candidat.id ? { ...c, statut: "converti", dossier_locatif_id: dossier.id } : c));
    // Mettre à jour le dossier et passer à l'étape suivante
    await base44.entities.DossierLocatif.update(dossier.id, {
      etape: "documents",
      locataire_nom: candidat.nom,
      locataire_email: candidat.email || "",
      locataire_telephone: candidat.telephone || "",
      candidat_selectionne_id: candidat.id,
      scoring_ia: candidat.scoring_ia,
      scoring_recommandation: "ACCEPTER",
      historique: [...(dossier.historique || []), { date: new Date().toISOString(), action: `Candidat sélectionné : ${candidat.nom} → passage aux Documents`, auteur: "Agent" }],
    });
    onDossierUpdate({
      etape: "documents",
      locataire_nom: candidat.nom,
      candidat_selectionne_id: candidat.id,
    });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">👤 Candidats ({candidats.length})</p>
          {selectionne && (
            <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Sélectionné : <strong>{selectionne.nom}</strong>
            </p>
          )}
        </div>
        <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={() => setShowAdd(true)}>
          <Plus className="w-3 h-3" /> Ajouter un candidat
        </Button>
      </div>

      {/* Comparaison si plusieurs */}
      {actifs.length > 1 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <Trophy className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-indigo-800">Comparaison — {actifs.length} candidats en concurrence</p>
            <div className="flex gap-2 mt-1 overflow-x-auto">
              {[...actifs].sort((a, b) => (b.scoring_ia || 0) - (a.scoring_ia || 0)).map((c, i) => (
                <div key={c.id} className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-medium ${
                  i === 0 ? "bg-green-100 text-green-700" : i === 1 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                }`}>
                  #{i+1} {c.nom} {c.scoring_ia > 0 ? `· ${c.scoring_ia}/100` : "· non scoré"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste candidats */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : candidats.length === 0 ? (
        <div className="text-center py-8 bg-secondary/20 rounded-2xl">
          <User className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun candidat — ajoutez le premier</p>
          <Button size="sm" className="rounded-full gap-1.5 mt-3 h-8 text-xs" onClick={() => setShowAdd(true)}>
            <Plus className="w-3 h-3" /> Premier candidat
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {candidats.map(c => (
            <CandidatCard key={c.id} candidat={c} loyer={dossier.loyer_mensuel}
              onUpdate={handleUpdate}
              onRdv={setRdvCandidat}
              onSelect={handleSelect}
              onRefuse={handleRefuse}
              onConvertir={handleConvertir}
            />
          ))}
        </div>
      )}

      {/* RDVs de ce bien */}
      {rdvs.length > 0 && (
        <div className="bg-secondary/20 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> RDV planifiés ({rdvs.length})</p>
            <Button size="sm" variant="outline" className="h-6 text-[10px] rounded-full gap-1" onClick={() => exportICS(rdvs)}>
              <Download className="w-2.5 h-2.5" /> ICS
            </Button>
          </div>
          {rdvs.map(r => (
            <div key={r.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.titre}</p>
                <p className="text-muted-foreground">{fmtDT(r.date_debut)}{r.contact_nom ? ` · ${r.contact_nom}` : ""}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                r.statut === "confirme" ? "bg-green-100 text-green-700" :
                r.statut === "realise" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"
              }`}>{r.statut}</span>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCandidatModal bien={bien} contacts={contacts}
          onClose={() => setShowAdd(false)}
          onSaved={c => { setCandidats(prev => [c, ...prev]); setShowAdd(false); }}
        />
      )}
      {rdvCandidat && (
        <RdvModal candidat={rdvCandidat}
          onClose={() => setRdvCandidat(null)}
          onSaved={ev => {
            setRdvs(prev => [ev, ...prev]);
            setRdvCandidat(null);
          }}
        />
      )}
    </div>
  );
}