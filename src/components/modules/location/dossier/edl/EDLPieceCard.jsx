import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X, Camera, ChevronDown, ChevronRight } from "lucide-react";

const ETATS = [
  { value: "neuf",    label: "Neuf",     cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "bon",     label: "Bon",      cls: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "moyen",   label: "Moyen",    cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "degrade", label: "Dégradé",  cls: "bg-red-100 text-red-700 border-red-300" },
];

const ELEMENTS = ["Murs", "Sol", "Plafond", "Fenêtres", "Équipements", "Électricité", "Plomberie"];

export default function EDLPieceCard({ piece, data, onChange, onRemove, compareData }) {
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [uploadingEl, setUploadingEl] = useState(null);

  const etatCfg = ETATS.find(e => e.value === (data?.etat || "bon")) || ETATS[1];

  // Comparer avec l'entrée si on est en sortie
  const hasDiff = compareData && compareData.etat !== data?.etat && !!data?.etat;
  const isDegrade = hasDiff && (data?.etat === "moyen" || data?.etat === "degrade") && (compareData?.etat === "neuf" || compareData?.etat === "bon");

  const uploadPhoto = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    onChange({ ...data, photos: [...(data?.photos || []), ...urls] });
    setUploading(false);
  };

  const uploadElementPhoto = async (e, element) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingEl(element);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const elData = data?.elements || {};
    onChange({ ...data, elements: { ...elData, [element]: { ...(elData[element] || {}), photos: [...(elData[element]?.photos || []), file_url] } } });
    setUploadingEl(null);
  };

  const updateElement = (element, field, val) => {
    const elData = data?.elements || {};
    onChange({ ...data, elements: { ...elData, [element]: { ...(elData[element] || {}), [field]: val } } });
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all ${isDegrade ? "border-red-300 shadow-sm" : "border-border/50"}`}>
      {/* Header pièce */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border ${etatCfg.cls}`}>
          {piece.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{piece}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${etatCfg.cls}`}>{etatCfg.label}</span>
            {isDegrade && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">⚠ Dégradation vs entrée</span>}
          </div>
          {data?.photos?.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1"><Camera className="w-3 h-3" />{data.photos.length} photo{data.photos.length > 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRemove && (
            <button onClick={e => { e.stopPropagation(); onRemove(); }} className="p-1 hover:bg-red-50 rounded-full">
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
            </button>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground/50" /> : <ChevronRight className="w-4 h-4 text-muted-foreground/50" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border/30">
          {/* État global */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1.5">État général</label>
            <div className="flex gap-1.5 flex-wrap">
              {ETATS.map(e => (
                <button key={e.value} onClick={() => onChange({ ...data, etat: e.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    data?.etat === e.value ? `${e.cls} ring-2 ring-offset-1 ring-current/20` : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary"
                  }`}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Éléments détaillés */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1.5">Détail par élément</label>
            <div className="grid gap-1.5">
              {ELEMENTS.map(el => {
                const elD = data?.elements?.[el] || {};
                const elEtat = ETATS.find(e => e.value === elD.etat);
                return (
                  <div key={el} className="flex items-center gap-2 bg-secondary/20 rounded-xl px-3 py-2">
                    <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{el}</span>
                    <div className="flex gap-1">
                      {ETATS.map(e => (
                        <button key={e.value} onClick={() => updateElement(el, "etat", e.value)}
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all border ${
                            elD.etat === e.value ? `${e.cls}` : "bg-white/50 text-muted-foreground/60 border-transparent hover:border-border"
                          }`}>
                          {e.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={elD.note || ""}
                      onChange={e => updateElement(el, "note", e.target.value)}
                      placeholder="Note…"
                      className="flex-1 text-xs h-6 bg-white border border-input rounded-lg px-2 min-w-0"
                    />
                    <label className="flex-shrink-0 cursor-pointer text-primary/60 hover:text-primary">
                      {uploadingEl === el ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                      <input type="file" accept="image/*" className="hidden" onChange={e => uploadElementPhoto(e, el)} />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commentaire */}
          <Textarea
            value={data?.commentaire || ""}
            onChange={e => onChange({ ...data, commentaire: e.target.value })}
            placeholder={`Observations générales pour ${piece}…`}
            rows={2} className="rounded-xl text-xs resize-none"
          />

          {/* Photos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer hover:underline">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? "Téléversement…" : "Ajouter photos (plusieurs)"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={uploadPhoto} />
              </label>
              {(data?.photos || []).length > 0 && (
                <span className="text-[10px] text-muted-foreground">{data.photos.length} photo{data.photos.length > 1 ? "s" : ""}</span>
              )}
            </div>
            {(data?.photos || []).length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {data.photos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-20 h-16 object-cover rounded-xl border border-border/50 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(url, "_blank")} />
                    <button onClick={() => onChange({ ...data, photos: data.photos.filter((_, j) => j !== i) })}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comparaison entrée */}
          {compareData && (
            <div className={`rounded-xl border px-3 py-2 ${isDegrade ? "bg-red-50 border-red-200" : "bg-slate-50 border-border/30"}`}>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1">État lors de l'entrée :</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${ETATS.find(e => e.value === (compareData?.etat || "bon"))?.cls || ""}`}>
                  {ETATS.find(e => e.value === (compareData?.etat || "bon"))?.label || "—"}
                </span>
                {compareData?.commentaire && <span className="text-[10px] text-muted-foreground italic truncate">{compareData.commentaire}</span>}
              </div>
              {isDegrade && <p className="text-[10px] text-red-600 font-medium mt-1">⚠ Dégradation probable détectée</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}