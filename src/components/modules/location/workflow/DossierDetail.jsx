import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  X, Loader2, CheckCircle2, ChevronRight, ArrowRight, Sparkles,
  CalendarPlus, Calendar, MapPin, Download, ExternalLink, Star,
  Users, FileText, AlertTriangle
} from "lucide-react";
import StepEDL from "./StepEDL";
import StepCloture from "./StepCloture";

const ETAPES = [
  { id: "candidat",   label: "Candidat",      emoji: "👤", color: "bg-slate-500" },
  { id: "documents",  label: "Documents",     emoji: "📂", color: "bg-blue-500" },
  { id: "validation", label: "Validation IA", emoji: "✅", color: "bg-amber-500" },
  { id: "rdv_visite", label: "RDV Visite",    emoji: "📅", color: "bg-indigo-500" },
  { id: "visite",     label: "Visite faite",  emoji: "🏠", color: "bg-cyan-500" },
  { id: "signature",  label: "Signature",     emoji: "📝", color: "bg-purple-500" },
  { id: "edle",       label: "EDL Entrée",    emoji: "🔑", color: "bg-teal-500" },
  { id: "vie_bail",   label: "Vie du bail",   emoji: "🏡", color: "bg-emerald-500" },
  { id: "edls",       label: "EDL Sortie",    emoji: "📦", color: "bg-orange-500" },
  { id: "cloture",    label: "Clôture",       emoji: "🏁", color: "bg-gray-500" },
];
const ETAPE_IDX = Object.fromEntries(ETAPES.map((e, i) => [e.id, i]));
const fmt = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const fmtDT = iso => iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function exportICS(evs) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ImmoPilot//Dossier//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  evs.forEach(e => {
    const uid = e.ics_uid || `${e.id}@immopilot`;
    const dtstart = e.date_debut ? new Date(e.date_debut).toISOString().replace(/[-:]/g,"").replace(".000","") : "";
    lines.push("BEGIN:VEVENT", `UID:${uid}`, `SUMMARY:${e.titre}`);
    if (dtstart) lines.push(`DTSTART:${dtstart}`);
    if (e.lieu) lines.push(`LOCATION:${e.lieu}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rdv-dossier.ics"; a.click();
  URL.revokeObjectURL(a.href);
}

function PlanifierSection({ dossier, onRefresh }) {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const defDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours()+1)}:00`;
  const [form, setForm] = useState({ type: "visite", date_debut: defDate, notes: "" });
  const [visites, setVisites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
    base44.entities.Evenement.filter({ dossier_locatif_id: dossier.id }).then(setVisites);
  }, [dossier.id]);

  const creerRdv = async () => {
    if (!form.date_debut) return;
    setSaving(true);
    const end = new Date(form.date_debut); end.setHours(end.getHours() + 1);
    const pad2 = n => String(n).padStart(2, "0");
    const date_fin = `${end.getFullYear()}-${pad2(end.getMonth()+1)}-${pad2(end.getDate())}T${pad2(end.getHours())}:00`;
    const ev = await base44.entities.Evenement.create({
      titre: `${form.type === "visite" ? "Visite" : form.type === "etat_des_lieux" ? "État des lieux" : "Signature"} — ${dossier.locataire_nom} · ${dossier.bien_titre}`,
      type: form.type, module: "location",
      date_debut: form.date_debut, date_fin,
      lieu: dossier.bien_adresse || "",
      contact_nom: dossier.locataire_nom,
      contact_email: dossier.locataire_email || "",
      bien_titre: dossier.bien_titre || "",
      bien_id: dossier.bien_id,
      dossier_locatif_id: dossier.id,
      statut: "planifie", rappel_24h: true, rappel_1h: true,
      ics_uid: `${Date.now()}@immopilot`,
      agent_email: currentUser?.email || "", agent_nom: currentUser?.full_name || "",
      notes: form.notes,
    });
    setVisites(p => [ev, ...p]);
    setShowForm(false); setSaving(false);
  };

  const STATUT_CFG = {
    planifie: "bg-blue-100 text-blue-700",
    confirme: "bg-green-100 text-green-700",
    annule: "bg-red-100 text-red-700",
    realise: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-indigo-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> RDV & Visites ({visites.length})
        </p>
        <div className="flex gap-2">
          {visites.length > 0 && (
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-indigo-300" onClick={() => exportICS(visites)}>
              <Download className="w-3 h-3" /> ICS
            </Button>
          )}
          <Button size="sm" className="h-7 text-xs rounded-full gap-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowForm(s => !s)}>
            <CalendarPlus className="w-3 h-3" /> Planifier
          </Button>
        </div>
      </div>
      {visites.length > 0 && (
        <div className="space-y-1.5">
          {visites.map(v => (
            <div key={v.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-xs">
              <div className="flex-1">
                <span className="font-medium">{v.titre}</span>
                <span className="text-muted-foreground ml-2">{fmtDT(v.date_debut)}</span>
                {v.lieu && <span className="text-muted-foreground ml-2"><MapPin className="w-2.5 h-2.5 inline mr-0.5" />{v.lieu}</span>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUT_CFG[v.statut] || STATUT_CFG.planifie}`}>{v.statut}</span>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <div className="bg-white rounded-xl p-3 space-y-2 border border-indigo-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full h-8 rounded-lg border border-input bg-white px-2 text-xs">
                <option value="visite">Visite</option>
                <option value="etat_des_lieux">État des lieux</option>
                <option value="signature">Signature</option>
                <option value="appel">Appel</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date & heure *</label>
              <Input type="datetime-local" value={form.date_debut} onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))} className="h-8 rounded-lg text-xs" />
            </div>
          </div>
          <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes…" className="h-7 rounded-lg text-xs" />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs rounded-full bg-indigo-600 hover:bg-indigo-700 gap-1" onClick={creerRdv} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />}
              Créer le RDV
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
          <p className="text-[10px] text-indigo-600 flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" /> Visible dans <Link to="/admin/agenda" className="underline font-medium ml-0.5">l'Agenda global</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function CandidatsMini({ dossier }) {
  const [candidats, setCandidats] = useState([]);
  useEffect(() => {
    base44.entities.CandidatLocataire.filter({ bien_id: dossier.bien_id }).then(setCandidats);
  }, [dossier.bien_id]);

  if (!candidats.length) return null;
  const actifs = candidats.filter(c => c.statut !== "refuse");
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
      <p className="text-xs font-semibold flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Candidats ({actifs.length})</p>
      <div className="flex gap-2 flex-wrap">
        {actifs.map(c => (
          <div key={c.id} className={`text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
            c.statut === "selectionne" ? "bg-green-100 text-green-700" :
            c.statut === "converti" ? "bg-emerald-100 text-emerald-700" :
            "bg-slate-100 text-slate-600"
          }`}>
            {c.statut === "selectionne" && <Star className="w-2.5 h-2.5" />}
            {c.nom}
            {c.scoring_ia > 0 && <span className="ml-1 opacity-70">· {c.scoring_ia}/100</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DossierDetail({ dossier: initialDossier, onClose, onUpdate }) {
  const [d, setD] = useState(initialDossier);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const currentEtapeIdx = ETAPE_IDX[d.etape] ?? 0;

  const save = async (data) => {
    setSaving(true);
    const safeData = {
      locataire_nom: d.locataire_nom || "—",
      bien_id: d.bien_id || "unknown",
      loyer_mensuel: d.loyer_mensuel || 0,
      ...data,
    };
    await base44.entities.DossierLocatif.update(d.id, safeData);
    const updated = { ...d, ...safeData };
    setD(updated);
    onUpdate(updated);
    setSaving(false);
  };

  const handleSubSave = (data) => {
    const updated = { ...d, ...data };
    setD(updated);
    onUpdate(updated);
  };

  const avancer = async () => {
    const nextIdx = currentEtapeIdx + 1;
    if (nextIdx >= ETAPES.length) return;
    const nextEtape = ETAPES[nextIdx].id;
    const hist = [...(d.historique || []), { date: new Date().toISOString(), action: `→ ${ETAPES[nextIdx].label}`, auteur: "Agent" }];
    await save({ etape: nextEtape, historique: hist });
  };

  const scoringIA = async () => {
    setScoring(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert solvabilité locative. Analyse ce dossier.
Locataire: ${d.locataire_nom}
Loyer: ${d.loyer_mensuel}€/mois + charges ${d.charges_mensuelle || 0}€
Type: ${d.type_bail} — Durée: ${d.duree_mois} mois
Notes: ${d.notes || "aucune"}

Évalue: cohérence revenus, capacité paiement, stabilité.
Résultat: ACCEPTER / REFUSER / À COMPLETER

Retourne JSON: { score: number (0-100), commentaire: string (max 180 chars), recommandation: "ACCEPTER"|"REFUSER"|"À COMPLETER", risque: "faible"|"modéré"|"élevé" }`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" }, commentaire: { type: "string" },
          recommandation: { type: "string" }, risque: { type: "string" }
        }
      }
    });
    if (result?.score !== undefined) {
      await save({
        scoring_ia: result.score,
        scoring_commentaire: result.commentaire,
        scoring_recommandation: result.recommandation,
        scoring_risque: result.risque,
      });
    }
    setScoring(false);
  };

  const RECO_CFG = {
    "ACCEPTER":    { cls: "bg-green-100 text-green-700", label: "✓ ACCEPTER" },
    "REFUSER":     { cls: "bg-red-100 text-red-700", label: "✗ REFUSER" },
    "À COMPLETER": { cls: "bg-amber-100 text-amber-700", label: "⚠ À COMPLÉTER" },
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[93vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-muted-foreground">{d.reference || "Dossier locatif"}</p>
            <h2 className="text-base font-bold">{d.locataire_nom} · {d.bien_titre}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{d.loyer_mensuel?.toLocaleString("fr-FR")} €/mois · {d.type_bail}</p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        </div>

        {/* Stepper */}
        <div className="px-4 py-3 border-b border-border/30 overflow-x-auto bg-secondary/10">
          <div className="flex items-center gap-1 min-w-max">
            {ETAPES.map((e, i) => {
              const done = i < currentEtapeIdx;
              const active = i === currentEtapeIdx;
              return (
                <div key={e.id} className="flex items-center gap-0.5">
                  <button onClick={() => save({ etape: e.id })}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                      done ? "bg-emerald-100 text-emerald-700" :
                      active ? `${e.color} text-white shadow-sm` :
                      "bg-white text-muted-foreground border border-border/40 hover:border-primary/30"
                    }`}>
                    <span>{e.emoji}</span>
                    <span className="hidden sm:inline">{e.label}</span>
                    {done && <CheckCircle2 className="w-2.5 h-2.5" />}
                  </button>
                  {i < ETAPES.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/30 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Candidats mini */}
          <CandidatsMini dossier={d} />

          {/* RDV Visites */}
          <PlanifierSection dossier={d} />

          {/* Infos générales */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Loyer + Charges", value: `${(d.loyer_mensuel + (d.charges_mensuelle||0)).toLocaleString("fr-FR")} €/mois` },
              { label: "Dépôt garantie", value: d.depot_garantie_montant ? `${d.depot_garantie_montant.toLocaleString("fr-FR")} €` : "—" },
              { label: "Début du bail", value: fmt(d.date_debut_bail) },
              { label: "Type de bail", value: d.type_bail || "—" },
            ].map(item => (
              <div key={item.label} className="bg-secondary/20 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-sm font-bold mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* ETAPE: Documents */}
          {(d.etape === "candidat" || d.etape === "documents") && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800 flex items-center gap-2"><FileText className="w-4 h-4" /> Documents candidat</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: "doc_identite", label: "Pièce d'identité" },
                  { key: "doc_revenus", label: "Justificatifs revenus" },
                  { key: "doc_imposition", label: "Avis d'imposition" },
                  { key: "doc_domicile", label: "Justif. domicile" },
                ].map(doc => {
                  const checked = d.docs_obligatoires?.[doc.key] || false;
                  return (
                    <label key={doc.key} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={checked}
                        onChange={async e => {
                          const updated = { ...d.docs_obligatoires, [doc.key]: e.target.checked };
                          await save({ docs_obligatoires: updated });
                        }} className="rounded accent-primary" />
                      <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${checked ? "text-green-500" : "text-muted-foreground/30"}`} />
                      {doc.label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPE: Validation IA */}
          {(d.etape === "documents" || d.etape === "validation") && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Validation IA</p>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-amber-300" onClick={scoringIA} disabled={scoring}>
                  {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {d.scoring_ia > 0 ? "Ré-analyser" : "Analyser"}
                </Button>
              </div>
              {d.scoring_ia > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${d.scoring_ia >= 70 ? "text-green-600" : d.scoring_ia >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {d.scoring_ia}<span className="text-sm font-medium">/100</span>
                    </span>
                    <div className="flex-1 bg-white rounded-full h-2">
                      <div className={`h-2 rounded-full ${d.scoring_ia >= 70 ? "bg-green-500" : d.scoring_ia >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${d.scoring_ia}%` }} />
                    </div>
                    {d.scoring_recommandation && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${RECO_CFG[d.scoring_recommandation]?.cls || ""}`}>
                        {RECO_CFG[d.scoring_recommandation]?.label || d.scoring_recommandation}
                      </span>
                    )}
                  </div>
                  {d.scoring_risque && <p className="text-xs text-amber-700">Risque : <strong className="capitalize">{d.scoring_risque}</strong></p>}
                  {d.scoring_commentaire && <p className="text-xs text-amber-700 italic">{d.scoring_commentaire}</p>}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs rounded-full bg-green-500 hover:bg-green-600 gap-1"
                  onClick={() => save({ validation_statut: "valide" })}>
                  <CheckCircle2 className="w-3 h-3" /> Valider
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-full border-red-300 text-red-600 gap-1"
                  onClick={() => save({ validation_statut: "refuse" })}>
                  <X className="w-3 h-3" /> Refuser
                </Button>
                {d.validation_statut && d.validation_statut !== "en_attente" && (
                  <span className={`self-center text-xs px-2 py-1 rounded-full font-medium ${d.validation_statut === "valide" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {d.validation_statut === "valide" ? "✓ Validé" : "✗ Refusé"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ETAPE: Signature bail */}
          {d.etape === "signature" && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800">📝 Signature du bail</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL du bail signé</label>
                <Input value={d.bail_url || ""} onChange={e => save({ bail_url: e.target.value })}
                  placeholder="https://…" className="h-9 rounded-xl text-sm" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={d.bail_signe || false}
                  onChange={e => save({ bail_signe: e.target.checked, bail_statut: e.target.checked ? "actif" : "en_preparation" })}
                  className="rounded" />
                <CheckCircle2 className={`w-4 h-4 ${d.bail_signe ? "text-green-500" : "text-muted-foreground/30"}`} />
                Bail signé par toutes les parties
              </label>
            </div>
          )}

          {/* ETAPE: EDL Entrée */}
          {(d.etape === "edle") && (
            <StepEDL dossier={d} type="edle" onSave={handleSubSave} />
          )}

          {/* ETAPE: Vie du bail */}
          {d.etape === "vie_bail" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-emerald-800">🏡 Bail actif</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded-xl p-2"><span className="text-muted-foreground">Statut :</span> <span className="font-bold capitalize">{d.bail_statut || "actif"}</span></div>
                <div className="bg-white rounded-xl p-2"><span className="text-muted-foreground">Dépôt :</span> <span className="font-bold capitalize">{d.depot_garantie_statut?.replace(/_/g, " ") || "—"}</span></div>
              </div>
              {d.date_fin_bail && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Fin de bail prévue le {fmt(d.date_fin_bail)}
                </p>
              )}
            </div>
          )}

          {/* ETAPE: EDL Sortie */}
          {d.etape === "edls" && (
            <StepEDL dossier={d} type="edls" onSave={handleSubSave} />
          )}

          {/* ETAPE: Clôture */}
          {d.etape === "cloture" && (
            <StepCloture dossier={d} onSave={handleSubSave} />
          )}

          {/* Bouton avancer */}
          {currentEtapeIdx < ETAPES.length - 1 && d.etape !== "cloture" && (
            <Button className="w-full rounded-full gap-2" onClick={avancer} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Passer à : {ETAPES[currentEtapeIdx + 1]?.label}
            </Button>
          )}

          {/* Historique */}
          {d.historique?.length > 0 && (
            <div className="border-t border-border/30 pt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Historique</p>
              <div className="space-y-1">
                {[...(d.historique || [])].reverse().slice(0, 8).map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground/50 flex-shrink-0">{fmt(h.date)}</span>
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