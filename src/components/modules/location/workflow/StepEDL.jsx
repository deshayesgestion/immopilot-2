import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Plus, Trash2, Loader2, Sparkles, AlertTriangle, Camera } from "lucide-react";

const ETATS = ["neuf", "bon", "moyen", "degrade"];
const ETAT_CFG = {
  neuf:     { label: "Neuf",     cls: "bg-green-100 text-green-700 border-green-300" },
  bon:      { label: "Bon",      cls: "bg-blue-100 text-blue-700 border-blue-300" },
  moyen:    { label: "Moyen",    cls: "bg-amber-100 text-amber-700 border-amber-300" },
  degrade:  { label: "Dégradé", cls: "bg-red-100 text-red-700 border-red-300" },
};

const PIECES_DEFAULT = ["Entrée", "Salon", "Cuisine", "Chambre 1", "Salle de bain", "Toilettes", "Balcon/Terrasse"];

export default function StepEDL({ dossier, type, onSave }) {
  // type = "edle" | "edls"
  const prefix = type; // "edle" ou "edls"
  const checklist = dossier[`${prefix}_checklist`] || {};
  const pieces = dossier[`${prefix}_pieces`] || PIECES_DEFAULT;
  const signe_loc = dossier[`${prefix}_signe_locataire`] || false;
  const signe_pro = dossier[`${prefix}_signe_proprietaire`] || false;
  const observations = dossier[`${prefix}_observations`] || "";

  const [newPiece, setNewPiece] = useState("");
  const [saving, setSaving] = useState(false);
  const [comparaison, setComparaison] = useState(null);
  const [comparing, setComparing] = useState(false);

  const isEntree = type === "edle";
  const title = isEntree ? "🔑 État des lieux d'entrée" : "📦 État des lieux de sortie";
  const colorCls = isEntree ? "border-teal-200 bg-teal-50" : "border-orange-200 bg-orange-50";
  const titleCls = isEntree ? "text-teal-800" : "text-orange-800";

  const updatePiece = async (piece, field, value) => {
    const updated = {
      ...checklist,
      [piece]: { ...(checklist[piece] || { etat: "bon", commentaire: "" }), [field]: value }
    };
    const data = { [`${prefix}_checklist`]: updated };
    await base44.entities.DossierLocatif.update(dossier.id, data);
    onSave(data);
  };

  const addPiece = async () => {
    if (!newPiece.trim()) return;
    const updatedPieces = [...pieces, newPiece.trim()];
    await base44.entities.DossierLocatif.update(dossier.id, { [`${prefix}_pieces`]: updatedPieces });
    onSave({ [`${prefix}_pieces`]: updatedPieces });
    setNewPiece("");
  };

  const removePiece = async (piece) => {
    const updatedPieces = pieces.filter(p => p !== piece);
    const updatedChecklist = { ...checklist };
    delete updatedChecklist[piece];
    await base44.entities.DossierLocatif.update(dossier.id, {
      [`${prefix}_pieces`]: updatedPieces,
      [`${prefix}_checklist`]: updatedChecklist
    });
    onSave({ [`${prefix}_pieces`]: updatedPieces, [`${prefix}_checklist`]: updatedChecklist });
  };

  const saveSign = async (field, value) => {
    setSaving(true);
    const data = { [field]: value };
    if (value && dossier[`${prefix}_signe_locataire`] && dossier[`${prefix}_signe_proprietaire`]) {
      data[`${prefix}_signe`] = true;
    }
    if (value && field === `${prefix}_signe_locataire` && signe_pro) data[`${prefix}_signe`] = true;
    if (value && field === `${prefix}_signe_proprietaire` && signe_loc) data[`${prefix}_signe`] = true;
    await base44.entities.DossierLocatif.update(dossier.id, data);
    onSave(data);
    setSaving(false);
  };

  const saveObservations = async (val) => {
    await base44.entities.DossierLocatif.update(dossier.id, { [`${prefix}_observations`]: val });
    onSave({ [`${prefix}_observations`]: val });
  };

  const comparerEDL = async () => {
    if (!dossier.edle_checklist || !dossier.edls_checklist) return;
    setComparing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es expert en immobilier locatif. Compare l'état des lieux d'ENTRÉE vs SORTIE et identifie les dégradations.

EDL ENTRÉE: ${JSON.stringify(dossier.edle_checklist)}
EDL SORTIE: ${JSON.stringify(dossier.edls_checklist)}

Pour chaque pièce, compare les états et commentaires.
Identifie: dégradations (pièce, description, montant estimé en €), anomalies, différences notables.

Retourne JSON: { resume: string (2-3 phrases), degradations: [{piece: string, description: string, montant_estime: number}], total_estime: number, avis: string }`,
      response_json_schema: {
        type: "object",
        properties: {
          resume: { type: "string" },
          degradations: { type: "array", items: { type: "object" } },
          total_estime: { type: "number" },
          avis: { type: "string" }
        }
      }
    });
    if (result) {
      setComparaison(result);
      await base44.entities.DossierLocatif.update(dossier.id, {
        comparaison_edl: result,
        edls_degradations: result.degradations || []
      });
      onSave({ comparaison_edl: result, edls_degradations: result.degradations || [] });
    }
    setComparing(false);
  };

  const piecesCompletes = pieces.filter(p => checklist[p]?.etat).length;
  const progress = pieces.length > 0 ? Math.round((piecesCompletes / pieces.length) * 100) : 0;

  return (
    <div className={`border rounded-2xl p-4 space-y-4 ${colorCls}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${titleCls}`}>{title}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{piecesCompletes}/{pieces.length} pièces</span>
          <div className="w-20 bg-white rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Date de l'EDL</label>
        <Input type="date" value={dossier[`${prefix}_date`] || ""}
          onChange={async e => {
            await base44.entities.DossierLocatif.update(dossier.id, { [`${prefix}_date`]: e.target.value });
            onSave({ [`${prefix}_date`]: e.target.value });
          }}
          className="h-8 rounded-xl text-sm bg-white max-w-xs" />
      </div>

      {/* Checklist par pièce */}
      <div className="space-y-2">
        {pieces.map(piece => {
          const pieceData = checklist[piece] || {};
          const etatCfg = ETAT_CFG[pieceData.etat] || null;
          return (
            <div key={piece} className="bg-white rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold flex-1">{piece}</p>
                <button onClick={() => removePiece(piece)} className="text-muted-foreground/40 hover:text-red-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {/* États */}
              <div className="flex gap-1.5 flex-wrap">
                {ETATS.map(etat => {
                  const cfg = ETAT_CFG[etat];
                  const selected = pieceData.etat === etat;
                  return (
                    <button key={etat} onClick={() => updatePiece(piece, "etat", etat)}
                      className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-all ${
                        selected ? cfg.cls : "border-border/40 text-muted-foreground hover:border-border"
                      }`}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              {/* Commentaire */}
              <Input value={pieceData.commentaire || ""} onChange={e => updatePiece(piece, "commentaire", e.target.value)}
                placeholder="Observations, remarques…"
                className="h-7 rounded-lg text-xs bg-secondary/10 border-0" />
              {/* Photos placeholder */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Camera className="w-3 h-3" />
                <span>{(pieceData.photos || []).length} photo(s)</span>
                <span className="text-muted-foreground/40">· Upload via Biens &gt; Photos</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ajouter pièce */}
      <div className="flex gap-2">
        <Input value={newPiece} onChange={e => setNewPiece(e.target.value)}
          placeholder="Ajouter une pièce…" className="h-8 rounded-xl text-xs flex-1 bg-white"
          onKeyDown={e => e.key === "Enter" && addPiece()} />
        <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl gap-1" onClick={addPiece}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Observations générales */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Observations générales</label>
        <textarea value={observations} onChange={e => saveObservations(e.target.value)}
          rows={2} placeholder="Notes globales sur l'état du logement…"
          className="w-full rounded-xl border border-input bg-white px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>

      {/* Signatures */}
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-xs bg-white rounded-xl px-3 py-2 flex-1">
          <input type="checkbox" checked={signe_loc} onChange={e => saveSign(`${prefix}_signe_locataire`, e.target.checked)} className="rounded accent-primary" />
          <CheckCircle2 className={`w-3.5 h-3.5 ${signe_loc ? "text-green-500" : "text-muted-foreground/40"}`} />
          Locataire a signé
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-xs bg-white rounded-xl px-3 py-2 flex-1">
          <input type="checkbox" checked={signe_pro} onChange={e => saveSign(`${prefix}_signe_proprietaire`, e.target.checked)} className="rounded accent-primary" />
          <CheckCircle2 className={`w-3.5 h-3.5 ${signe_pro ? "text-green-500" : "text-muted-foreground/40"}`} />
          Propriétaire a signé
        </label>
      </div>

      {/* Comparaison IA — uniquement sur EDL Sortie */}
      {!isEntree && (
        <div className="bg-white border border-orange-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-orange-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Comparaison IA entrée/sortie
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-orange-300"
              onClick={comparerEDL} disabled={comparing || !dossier.edle_checklist}>
              {comparing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Analyser
            </Button>
          </div>
          {!dossier.edle_checklist && (
            <p className="text-[10px] text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> EDL d'entrée requis pour comparer
            </p>
          )}
          {(comparaison || dossier.comparaison_edl) && (() => {
            const comp = comparaison || dossier.comparaison_edl;
            return (
              <div className="space-y-2">
                <p className="text-xs text-orange-700">{comp.resume}</p>
                {comp.degradations?.length > 0 && (
                  <div className="space-y-1">
                    {comp.degradations.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-red-50 rounded-lg px-2 py-1.5">
                        <span className="font-medium">{d.piece} — {d.description}</span>
                        <span className="font-bold text-red-600">{d.montant_estime ? `~${d.montant_estime} €` : ""}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1 border-t border-orange-200">
                      <span>Total estimé</span>
                      <span className="text-red-600">{comp.total_estime ? `${comp.total_estime} €` : "—"}</span>
                    </div>
                  </div>
                )}
                {comp.degradations?.length === 0 && (
                  <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1.5">✓ Aucune dégradation détectée</p>
                )}
                {comp.avis && <p className="text-[10px] text-muted-foreground italic">{comp.avis}</p>}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}