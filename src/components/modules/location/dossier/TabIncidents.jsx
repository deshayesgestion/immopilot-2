import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, Plus, X, Loader2, Sparkles, CheckCircle2,
  Upload, ChevronDown, ChevronRight, Wrench, Home, Euro, Users, Shield
} from "lucide-react";

const TYPE_CFG = {
  technique:  { label: "Technique",  icon: Wrench, color: "bg-blue-100 text-blue-700 border-blue-200" },
  locatif:    { label: "Locatif",    icon: Home,   color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  financier:  { label: "Financier",  icon: Euro,   color: "bg-amber-100 text-amber-700 border-amber-200" },
  voisinage:  { label: "Voisinage",  icon: Users,  color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const GRAVITE_CFG = {
  faible:   { label: "Faible",    cls: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  moyen:    { label: "Moyen",     cls: "bg-amber-100 text-amber-700",   dot: "bg-amber-500" },
  critique: { label: "Critique",  cls: "bg-red-100 text-red-700",       dot: "bg-red-500" },
};

const STATUT_CFG = {
  ouvert:     { label: "Ouvert",    cls: "bg-red-100 text-red-700" },
  en_cours:   { label: "En cours",  cls: "bg-amber-100 text-amber-700" },
  resolu:     { label: "Résolu",    cls: "bg-green-100 text-green-700" },
};

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function IncidentCard({ incident, index, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const typeCfg = TYPE_CFG[incident.type] || TYPE_CFG.technique;
  const graviteCfg = GRAVITE_CFG[incident.gravite] || GRAVITE_CFG.faible;
  const statutCfg = STATUT_CFG[incident.statut] || STATUT_CFG.ouvert;
  const Icon = typeCfg.icon;

  const analyserIA = async () => {
    setAnalysing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Expert gestion locative. Analyse cet incident immobilier.
Type: ${incident.type}
Description: ${incident.description}
Gravité déclarée: ${incident.gravite}
Statut: ${incident.statut}

Retourne JSON: { gravite_ia: "faible"|"moyen"|"critique", action_recommandee: string (max 150 chars), risques: string (max 120 chars), delai_intervention: string (max 80 chars) }`,
      response_json_schema: { type: "object", properties: { gravite_ia: { type: "string" }, action_recommandee: { type: "string" }, risques: { type: "string" }, delai_intervention: { type: "string" } } }
    });
    if (result) onUpdate(index, { ...incident, analyse_ia: result });
    setAnalysing(false);
  };

  const uploadPJ = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onUpdate(index, { ...incident, pieces_jointes: [...(incident.pieces_jointes || []), file_url] });
    setUploading(false);
  };

  const changeStatut = (statut) => onUpdate(index, { ...incident, statut });

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      incident.gravite === "critique" ? "border-red-300 shadow-sm" :
      incident.gravite === "moyen" ? "border-amber-200" : "border-border/50"
    }`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeCfg.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{incident.description?.slice(0, 60) || "Incident sans titre"}…</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${graviteCfg.cls}`}>{graviteCfg.label}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statutCfg.cls}`}>{statutCfg.label}</span>
            <span className="text-[10px] text-muted-foreground">{typeCfg.label} · {fmtDate(incident.date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onDelete(index); }}
            className="p-1 hover:bg-red-50 rounded-full">
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
          </button>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border/30">
          <p className="text-sm text-foreground">{incident.description}</p>

          {/* Changer statut */}
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground self-center">Statut :</span>
            {Object.entries(STATUT_CFG).map(([k, v]) => (
              <button key={k} onClick={() => changeStatut(k)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-all ${
                  incident.statut === k ? `${v.cls} border-current` : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary"
                }`}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Pièces jointes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer w-fit hover:underline">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? "Upload…" : "Ajouter une pièce jointe"}
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={uploadPJ} />
            </label>
            {(incident.pieces_jointes || []).length > 0 && (
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {incident.pieces_jointes.map((url, i) => {
                  const isImg = /\.(jpg|jpeg|png|gif|webp)/i.test(url.split("?")[0]);
                  return isImg
                    ? <img key={i} src={url} alt="" className="w-14 h-14 object-cover rounded-xl border border-border/50 cursor-pointer" onClick={() => window.open(url)} />
                    : <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary bg-secondary/30 rounded-lg px-2 py-1 hover:underline">📎 PJ {i+1}</a>;
                })}
              </div>
            )}
          </div>

          {/* Analyse IA */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Analyse IA</p>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-amber-300" onClick={analyserIA} disabled={analysing}>
                {analysing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Analyser
              </Button>
            </div>
            {incident.analyse_ia && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Gravité IA :</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${GRAVITE_CFG[incident.analyse_ia.gravite_ia]?.cls || ""}`}>
                    {GRAVITE_CFG[incident.analyse_ia.gravite_ia]?.label || incident.analyse_ia.gravite_ia}
                  </span>
                </div>
                {incident.analyse_ia.action_recommandee && (
                  <div className="flex items-start gap-1.5 text-xs text-green-700 bg-white rounded-lg px-2 py-1.5">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span><strong>Action :</strong> {incident.analyse_ia.action_recommandee}</span>
                  </div>
                )}
                {incident.analyse_ia.risques && (
                  <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-white rounded-lg px-2 py-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span><strong>Risques :</strong> {incident.analyse_ia.risques}</span>
                  </div>
                )}
                {incident.analyse_ia.delai_intervention && (
                  <p className="text-[10px] text-muted-foreground">⏱ Délai recommandé : {incident.analyse_ia.delai_intervention}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddIncidentModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    type: "technique", gravite: "faible", statut: "ouvert",
    description: "", date: new Date().toISOString().slice(0, 10),
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Déclarer un incident</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gravité</label>
              <select value={form.gravite} onChange={e => set("gravite", e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                {Object.entries(GRAVITE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date</label>
            <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="h-9 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Décrivez l'incident en détail…" rows={4} className="rounded-xl text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 rounded-full gap-2 bg-red-500 hover:bg-red-600" disabled={!form.description.trim()}
            onClick={() => { onAdd({ ...form, pieces_jointes: [], analyse_ia: null }); onClose(); }}>
            <AlertTriangle className="w-4 h-4" /> Déclarer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TabIncidents({ dossier, onUpdate }) {
  const [incidents, setIncidents] = useState(dossier.incidents || []);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const persist = async (newIncidents) => {
    setIncidents(newIncidents);
    setSaving(true);
    const hist = [...(dossier.historique || []), {
      date: new Date().toISOString(),
      action: `Incident mis à jour (${newIncidents.length} total)`,
      auteur: "Agent",
      type: "incident"
    }];
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: newIncidents, historique: hist });
    onUpdate({ incidents: newIncidents, historique: hist });
    setSaving(false);
  };

  const handleAdd = (incident) => {
    const newIncidents = [{ ...incident, id: Date.now() }, ...incidents];
    // Ajouter dans historique
    const hist = [...(dossier.historique || []), {
      date: new Date().toISOString(),
      action: `Incident déclaré : ${incident.type} (${incident.gravite}) — ${incident.description.slice(0, 60)}`,
      auteur: "Agent",
      type: "incident"
    }];
    setIncidents(newIncidents);
    setSaving(true);
    base44.entities.DossierLocatif.update(dossier.id, { incidents: newIncidents, historique: hist }).then(() => {
      onUpdate({ incidents: newIncidents, historique: hist });
      setSaving(false);
    });
  };

  const handleUpdate = (index, updated) => {
    const newIncidents = incidents.map((inc, i) => i === index ? updated : inc);
    persist(newIncidents);
  };

  const handleDelete = (index) => {
    persist(incidents.filter((_, i) => i !== index));
  };

  const open = incidents.filter(i => i.statut === "ouvert").length;
  const critique = incidents.filter(i => i.gravite === "critique").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Incidents ({incidents.length})</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {open > 0 && <span className="text-red-600 font-medium">{open} ouvert{open > 1 ? "s" : ""}</span>}
            {open > 0 && critique > 0 && " · "}
            {critique > 0 && <span className="text-red-700 font-bold">{critique} critique{critique > 1 ? "s" : ""} ⚠</span>}
            {open === 0 && incidents.length > 0 && <span className="text-green-600">Tous résolus ✓</span>}
            {incidents.length === 0 && "Aucun incident"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs bg-red-500 hover:bg-red-600" onClick={() => setShowAdd(true)}>
            <Plus className="w-3 h-3" /> Déclarer un incident
          </Button>
        </div>
      </div>

      {/* Alerte critiques */}
      {critique > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">{critique} incident{critique > 1 ? "s" : ""} critique{critique > 1 ? "s" : ""} non résolu{critique > 1 ? "s" : ""}</p>
            <p className="text-xs text-red-600">Intervention urgente requise</p>
          </div>
        </div>
      )}

      {incidents.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-2xl">
          <Shield className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun incident déclaré</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Les incidents ne bloquent pas le workflow</p>
        </div>
      ) : (
        <div className="space-y-2">
          {incidents.map((inc, i) => (
            <IncidentCard key={inc.id || i} incident={inc} index={i} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showAdd && <AddIncidentModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}