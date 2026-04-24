import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, X, Loader2, Sparkles, Star, CheckCircle2, AlertTriangle,
  User, ChevronRight, ChevronDown, Phone, Mail, Briefcase,
  Euro, FileText, Trophy, Upload, ExternalLink
} from "lucide-react";

const STATUT_CFG = {
  prospect:         { label: "Prospect",         cls: "bg-slate-100 text-slate-600" },
  dossier_complet:  { label: "Dossier complet",  cls: "bg-blue-100 text-blue-700" },
  visite_planifiee: { label: "Visite planifiée", cls: "bg-indigo-100 text-indigo-700" },
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
  { key: "docs_identite",   label: "Pièce d'identité",       required: true },
  { key: "docs_revenus",    label: "Justif. revenus",         required: true },
  { key: "docs_imposition", label: "Avis d'imposition",       required: true },
  { key: "docs_domicile",   label: "Justif. domicile",        required: false },
];

// ── Modal ajout ───────────────────────────────────────────────────────────
function AddCandidatModal({ dossier, contacts, onClose, onSaved }) {
  const [form, setForm] = useState({
    contact_id: "", nom: "", email: "", telephone: "",
    situation_pro: "cdi", employeur: "", revenus_mensuels: "",
    revenus_garant: "", nom_garant: "", notes_agent: "",
  });
  const [saving, setSaving] = useState(false);
  const [scoringAuto, setScoringAuto] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleContactChange = id => {
    const c = contacts.find(c => c.id === id);
    set("contact_id", id);
    if (c) { set("nom", c.nom); set("email", c.email || ""); set("telephone", c.telephone || ""); }
  };

  const handleSave = async () => {
    if (!form.nom || !dossier?.bien_id) return;
    setSaving(true);
    const candidat = await base44.entities.CandidatLocataire.create({
      ...form,
      bien_id: dossier.bien_id,
      bien_titre: dossier.bien_titre || "",
      bien_adresse: dossier.bien_adresse || "",
      revenus_mensuels: Number(form.revenus_mensuels) || 0,
      revenus_garant: Number(form.revenus_garant) || 0,
      statut: "prospect",
      agency_id: dossier.agency_id || "",
    });
    // Scoring IA automatique si revenus renseignés
    if (candidat.revenus_mensuels > 0 && dossier.loyer_mensuel > 0) {
      setScoringAuto(true);
      const loyer = dossier.loyer_mensuel;
      const ratio = (loyer / candidat.revenus_mensuels * 100).toFixed(0);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Expert IA scoring locatif. Candidat ${candidat.nom}, ${form.situation_pro} chez ${form.employeur || "N/A"}, revenus ${candidat.revenus_mensuels}€/mois. Bien à ${loyer}€/mois. Ratio loyer/revenus: ${ratio}%. Garant: ${form.nom_garant || "aucun"}.
Retourne JSON: { score: number (0-100), solvabilite: number (0-100), risque: "faible"|"modere"|"eleve", recommandation: "fort"|"moyen"|"faible", commentaire: string }`,
        response_json_schema: { type: "object", properties: { score: { type: "number" }, solvabilite: { type: "number" }, risque: { type: "string" }, recommandation: { type: "string" }, commentaire: { type: "string" } } }
      });
      if (result?.score !== undefined) {
        await base44.entities.CandidatLocataire.update(candidat.id, {
          scoring_ia: result.score, scoring_solvabilite: result.solvabilite,
          scoring_risque: result.risque, scoring_recommandation: result.recommandation,
          scoring_commentaire: result.commentaire,
        });
        candidat.scoring_ia = result.score;
        candidat.scoring_recommandation = result.recommandation;
        candidat.scoring_commentaire = result.commentaire;
      }
      setScoringAuto(false);
    }
    // Historiser l'ajout du candidat dans le dossier
    const histEntry = { date: new Date().toISOString(), action: `Candidat ajouté : ${form.nom} (${form.situation_pro}, ${form.revenus_mensuels || "?"}€/mois)`, auteur: "Agent", type: "candidat" };
    const hist = [...(dossier.historique || []), histEntry];
    await base44.entities.DossierLocatif.update(dossier.id, { historique: hist });
    onSaved({ ...candidat, _histUpdate: hist });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold">Ajouter un candidat</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Bien : {dossier?.bien_titre} · Scoring IA automatique</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
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
              <Input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Prénom Nom" className="h-9 rounded-xl text-sm" autoFocus />
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
              <label className="text-xs text-muted-foreground mb-1 block">Revenus nets/mois (€) *</label>
              <Input type="number" value={form.revenus_mensuels} onChange={e => set("revenus_mensuels", e.target.value)} placeholder="2500" className="h-9 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Revenus garant (€)</label>
              <Input type="number" value={form.revenus_garant} onChange={e => set("revenus_garant", e.target.value)} placeholder="0" className="h-9 rounded-xl text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Nom du garant</label>
              <Input value={form.nom_garant} onChange={e => set("nom_garant", e.target.value)} placeholder="Garant (si applicable)" className="h-9 rounded-xl text-sm" />
            </div>
          </div>
          {scoringAuto && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scoring IA en cours…
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full gap-2" onClick={handleSave} disabled={saving || !form.nom}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Fiche candidat expandable ──────────────────────────────────────────────
function CandidatCard({ candidat, loyer, onUpdate, onSelect, onRefuse }) {
  const [expanded, setExpanded] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [uploading, setUploading] = useState(null);

  const ratio = loyer && candidat.revenus_mensuels ? (loyer / candidat.revenus_mensuels * 100).toFixed(0) : null;
  const statutCfg = STATUT_CFG[candidat.statut] || STATUT_CFG.prospect;
  const RECO = { fort: "bg-green-100 text-green-700", moyen: "bg-amber-100 text-amber-700", faible: "bg-red-100 text-red-700" };

  const toggleDoc = async (key) => {
    const updated = { [key]: !candidat[key] };
    await base44.entities.CandidatLocataire.update(candidat.id, updated);
    const newState = { ...candidat, ...updated };
    const docsOk = DOCS.filter(d => d.required).every(d => newState[d.key]);
    if (docsOk && candidat.statut === "prospect") {
      await base44.entities.CandidatLocataire.update(candidat.id, { statut: "dossier_complet" });
      onUpdate({ ...newState, statut: "dossier_complet" });
    } else { onUpdate(newState); }
    // Re-scorer IA si docs changent
    if (docsOk) lancerScoringIA(newState);
  };

  const uploadDoc = async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(key);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const urls = [...(candidat.docs_urls || []), file_url];
    await base44.entities.CandidatLocataire.update(candidat.id, { [key]: true, docs_urls: urls });
    const newState = { ...candidat, [key]: true, docs_urls: urls };
    const docsOk = DOCS.filter(d => d.required).every(d => newState[d.key]);
    if (docsOk && candidat.statut === "prospect") {
      await base44.entities.CandidatLocataire.update(candidat.id, { statut: "dossier_complet" });
      onUpdate({ ...newState, statut: "dossier_complet" });
    } else { onUpdate(newState); }
    if (docsOk) lancerScoringIA(newState);
    setUploading(null);
  };

  const lancerScoringIA = async (c = candidat) => {
    setScoring(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert IA scoring locatif. Candidat ${c.nom}, ${c.situation_pro} chez ${c.employeur || "N/A"}, revenus ${c.revenus_mensuels || 0}€/mois. Bien à ${loyer}€/mois. Ratio: ${ratio || "?"}%. Garant: ${c.nom_garant || "aucun"} (${c.revenus_garant || 0}€). Docs: identité=${c.docs_identite}, revenus=${c.docs_revenus}, imposition=${c.docs_imposition}.
Retourne JSON: { score: number (0-100), solvabilite: number (0-100), risque: "faible"|"modere"|"eleve", stabilite: "forte"|"moyenne"|"faible", recommandation: "fort"|"moyen"|"faible", commentaire: string (max 180 chars), detail: { coherence_revenus: string, capacite_paiement: string, stabilite_locative: string } }`,
      response_json_schema: { type: "object", properties: { score: { type: "number" }, solvabilite: { type: "number" }, risque: { type: "string" }, stabilite: { type: "string" }, recommandation: { type: "string" }, commentaire: { type: "string" }, detail: { type: "object" } } }
    });
    if (r?.score !== undefined) {
      const updates = { scoring_ia: r.score, scoring_solvabilite: r.solvabilite, scoring_risque: r.risque, scoring_stabilite: r.stabilite, scoring_recommandation: r.recommandation, scoring_commentaire: r.commentaire, scoring_detail: r.detail || {} };
      await base44.entities.CandidatLocataire.update(candidat.id, updates);
      onUpdate({ ...c, ...updates });
    }
    setScoring(false);
  };

  return (
    <div className={`rounded-2xl border transition-all ${
      candidat.statut === "selectionne" ? "border-green-400 ring-1 ring-green-200 bg-green-50/30" :
      candidat.statut === "refuse" ? "border-red-200 opacity-55 bg-white" :
      "border-border/50 bg-white hover:border-primary/30"
    }`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${
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
            {candidat.scoring_recommandation && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RECO[candidat.scoring_recommandation] || ""}`}>
                {candidat.scoring_recommandation === "fort" ? "Profil FORT" : candidat.scoring_recommandation === "moyen" ? "Profil MOYEN" : "Profil FAIBLE"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {SITUATION_PRO.find(s => s.value === candidat.situation_pro)?.label || "—"} · {candidat.revenus_mensuels ? `${candidat.revenus_mensuels.toLocaleString("fr-FR")} €/mois` : "revenus N/A"}
            {ratio && <span className={`ml-2 font-medium ${Number(ratio) <= 33 ? "text-green-600" : Number(ratio) <= 40 ? "text-amber-600" : "text-red-600"}`}>({ratio}%)</span>}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {DOCS.map(d => <div key={d.key} className={`w-2 h-2 rounded-full ${candidat[d.key] ? "bg-green-500" : d.required ? "bg-red-300" : "bg-gray-200"}`} title={d.label} />)}
            <span className="text-[10px] text-muted-foreground ml-1">{DOCS.filter(d => candidat[d.key]).length}/{DOCS.length} docs</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!["selectionne", "refuse", "converti"].includes(candidat.statut) && (
            <Button size="sm" className="h-7 text-xs rounded-full gap-1 bg-green-500 hover:bg-green-600"
              onClick={e => { e.stopPropagation(); onSelect(candidat); }}>
              <Trophy className="w-3 h-3" /> Sélectionner
            </Button>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-3">
          {/* Infos */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Phone, label: "Tél.", value: candidat.telephone || "—" },
              { icon: Mail, label: "Email", value: candidat.email || "—" },
              { icon: Briefcase, label: "Employeur", value: candidat.employeur || "—" },
              { icon: Euro, label: "Garant", value: candidat.nom_garant ? `${candidat.nom_garant} (${candidat.revenus_garant || 0}€)` : "Aucun" },
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

          {/* Documents avec upload */}
          <div>
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Documents</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DOCS.map(doc => (
                <div key={doc.key} className={`rounded-xl px-3 py-2 border ${candidat[doc.key] ? "bg-green-50 border-green-200" : "bg-secondary/10 border-border/40"}`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!candidat[doc.key]} onChange={() => toggleDoc(doc.key)} className="rounded accent-primary" />
                    <span className="text-xs flex-1 truncate">{doc.label}</span>
                    {uploading === doc.key ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> :
                      candidat[doc.key] ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> :
                      doc.required && <span className="text-[9px] text-red-500 font-medium">Req.</span>}
                  </div>
                  <label className="mt-1.5 flex items-center gap-1 text-[10px] text-primary cursor-pointer hover:underline">
                    <Upload className="w-2.5 h-2.5" /> Uploader
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => uploadDoc(e, doc.key)} />
                  </label>
                </div>
              ))}
            </div>
            {candidat.docs_urls?.length > 0 && (
              <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {candidat.docs_urls.length} fichier(s) uploadé(s)
              </p>
            )}
          </div>

          {/* Scoring IA */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Scoring IA</p>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-amber-300" onClick={() => lancerScoringIA()} disabled={scoring}>
                {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {candidat.scoring_ia > 0 ? "Ré-analyser" : "Analyser"}
              </Button>
            </div>
            {candidat.scoring_ia > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-black ${candidat.scoring_ia >= 70 ? "text-green-600" : candidat.scoring_ia >= 50 ? "text-amber-600" : "text-red-600"}`}>
                    {candidat.scoring_ia}<span className="text-sm font-medium">/100</span>
                  </span>
                  <div className="flex-1 bg-white rounded-full h-2">
                    <div className={`h-2 rounded-full ${candidat.scoring_ia >= 70 ? "bg-green-500" : candidat.scoring_ia >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${candidat.scoring_ia}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: "Solvabilité", value: `${candidat.scoring_solvabilite || "?"}%` },
                    { label: "Risque", value: candidat.scoring_risque || "—" },
                    { label: "Stabilité", value: candidat.scoring_stabilite || "—" },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg p-1.5">
                      <p className="text-[9px] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-bold capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>
                {candidat.scoring_commentaire && (
                  <p className="text-[10px] text-amber-700 bg-white rounded-lg px-2 py-1.5 italic">{candidat.scoring_commentaire}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {candidat.statut === "selectionne" && (
              <span className="text-xs font-semibold text-green-700 flex items-center gap-1 px-3 py-1.5 bg-green-100 rounded-full">
                <Trophy className="w-3.5 h-3.5" /> Candidat sélectionné
              </span>
            )}
            {!["refuse", "converti"].includes(candidat.statut) && (
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => onRefuse(candidat)}>
                <X className="w-3 h-3" /> Refuser
              </Button>
            )}
            {candidat.statut === "refuse" && (
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-full gap-1" onClick={() => onUpdate({ ...candidat, statut: "prospect" })}>
                Rétablir
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function TabCandidats({ dossier, onDossierUpdate }) {
  const [candidats, setCandidats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!dossier.bien_id) { setLoading(false); return; }
    Promise.all([
      base44.entities.CandidatLocataire.filter({ bien_id: dossier.bien_id }),
      base44.entities.Contact.list("-created_date", 200),
    ]).then(([cands, conts]) => { setCandidats(cands); setContacts(conts); setLoading(false); });
  }, [dossier.bien_id]);

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
    const histEntry = { date: new Date().toISOString(), action: `Candidat sélectionné : ${candidat.nom} (score: ${candidat.scoring_ia || "N/A"}/100)`, auteur: "Agent", type: "selection" };
    const hist = [...(dossier.historique || []), histEntry];
    await base44.entities.DossierLocatif.update(dossier.id, {
      candidat_selectionne_id: candidat.id,
      locataire_nom: candidat.nom,
      locataire_email: candidat.email || "",
      locataire_telephone: candidat.telephone || "",
      scoring_ia: candidat.scoring_ia,
      statut_dossier: "candidat_valide",
      historique: hist,
    });
    onDossierUpdate({ candidat_selectionne_id: candidat.id, locataire_nom: candidat.nom, statut_dossier: "candidat_valide", scoring_ia: candidat.scoring_ia, historique: hist });
  };

  const handleRefuse = async (candidat) => {
    await base44.entities.CandidatLocataire.update(candidat.id, { statut: "refuse" });
    setCandidats(prev => prev.map(c => c.id === candidat.id ? { ...c, statut: "refuse" } : c));
  };

  const actifs = candidats.filter(c => c.statut !== "refuse");
  const selectionne = candidats.find(c => c.statut === "selectionne");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">👤 Candidats ({candidats.length})</p>
          {selectionne && <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sélectionné : <strong>{selectionne.nom}</strong></p>}
        </div>
        <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={() => setShowAdd(true)}>
          <Plus className="w-3 h-3" /> Ajouter
        </Button>
      </div>

      {!dossier.bien_id && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Ce dossier n'a pas de bien associé. Veuillez en définir un.
        </div>
      )}

      {actifs.length > 1 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <Trophy className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-indigo-800">{actifs.length} candidats en concurrence</p>
            <div className="flex gap-2 mt-1 overflow-x-auto">
              {[...actifs].sort((a, b) => (b.scoring_ia || 0) - (a.scoring_ia || 0)).map((c, i) => (
                <span key={c.id} className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${i === 0 ? "bg-green-100 text-green-700" : i === 1 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                  #{i+1} {c.nom}{c.scoring_ia > 0 ? ` · ${c.scoring_ia}/100` : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : candidats.length === 0 ? (
        <div className="text-center py-10 bg-secondary/20 rounded-2xl">
          <User className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun candidat pour l'instant</p>
          <Button size="sm" className="rounded-full gap-1.5 mt-3 h-8 text-xs" onClick={() => setShowAdd(true)}>
            <Plus className="w-3 h-3" /> Ajouter le premier candidat
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {candidats.map(c => (
            <CandidatCard key={c.id} candidat={c} loyer={dossier.loyer_mensuel}
              onUpdate={handleUpdate} onSelect={handleSelect} onRefuse={handleRefuse} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddCandidatModal dossier={dossier} contacts={contacts}
          onClose={() => setShowAdd(false)}
          onSaved={c => {
        setCandidats(prev => [c, ...prev]);
        if (c._histUpdate) onDossierUpdate({ historique: c._histUpdate });
        setShowAdd(false);
      }}
        />
      )}
    </div>
  );
}