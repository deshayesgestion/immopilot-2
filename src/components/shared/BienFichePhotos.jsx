import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Star, Loader2, ImageIcon, Sparkles, Check, Zap, Sofa, Building } from "lucide-react";

const AI_MODES = [
  {
    id: "amelioration",
    label: "Amélioration",
    icon: Zap,
    color: "bg-violet-600 hover:bg-violet-700",
    colorLight: "bg-violet-50 border-violet-200 text-violet-700",
    description: "Luminosité, netteté, couleurs",
    prompt: "Enhance this real estate photo professionally: improve brightness, sharpness, and color balance to make it look bright, clean and attractive for a property listing. Keep the exact same composition, framing and perspective.",
  },
  {
    id: "agencement",
    label: "Agencement",
    icon: Sofa,
    color: "bg-emerald-600 hover:bg-emerald-700",
    colorLight: "bg-emerald-50 border-emerald-200 text-emerald-700",
    description: "Optimise le mobilier existant",
    prompt: "Optimize the furniture arrangement and interior styling in this real estate photo to make it look more attractive and well-organized. Improve the overall visual appeal for a property listing while keeping existing furniture and structure. Make it look like a professional interior design photo.",
  },
  {
    id: "projection",
    label: "Projection",
    icon: Building,
    color: "bg-amber-600 hover:bg-amber-700",
    colorLight: "bg-amber-50 border-amber-200 text-amber-700",
    description: "Ajoute du mobilier virtuel",
    prompt: "Add tasteful, modern virtual furniture and decor to this empty or sparse real estate room photo. Create a realistic, welcoming and professionally staged interior that helps buyers or renters visualize living in the space. Use contemporary furniture that matches the room's style and proportions.",
  },
];

// Mini picker shown over the image on hover
function AIModePickerOverlay({ url, onSelect }) {
  return (
    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 p-2">
      <p className="text-white text-[10px] font-semibold uppercase tracking-wide mb-0.5">Mode IA</p>
      {AI_MODES.map(mode => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelect(mode)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white text-xs font-semibold transition-all ${mode.color}`}
          >
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span>{mode.label}</span>
            <span className="text-white/70 font-normal ml-auto hidden sm:block">{mode.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function BienFichePhotos({ photos = [], photoPrincipale, onChange }) {
  const [uploading, setUploading] = useState(false);
  // { [url]: { status: "picking"|"loading"|"done", mode: AIModes[n], result: url } }
  const [aiState, setAiState] = useState({});

  const setAi = (url, patch) =>
    setAiState(prev => ({ ...prev, [url]: { ...(prev[url] || {}), ...patch } }));

  const clearAi = (url) =>
    setAiState(prev => { const n = { ...prev }; delete n[url]; return n; });

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }
    const newPhotos = [...photos, ...uploaded];
    const newPrincipale = photoPrincipale || uploaded[0];
    onChange({ photos: newPhotos, photo_principale: newPrincipale });
    setUploading(false);
    e.target.value = "";
  };

  const removePhoto = (url) => {
    const newPhotos = photos.filter(p => p !== url);
    const newPrincipale = photoPrincipale === url ? (newPhotos[0] || "") : photoPrincipale;
    clearAi(url);
    onChange({ photos: newPhotos, photo_principale: newPrincipale });
  };

  const setPrincipale = (url) => onChange({ photo_principale: url });

  const runAI = async (url, mode) => {
    setAi(url, { status: "loading", mode, result: null });
    const result = await base44.integrations.Core.GenerateImage({
      prompt: mode.prompt,
      existing_image_urls: [url],
    });
    setAi(url, { status: "done", mode, result: result.url });
  };

  const replaceWith = (originalUrl, newUrl) => {
    const newPhotos = photos.map(p => p === originalUrl ? newUrl : p);
    const newPrincipale = photoPrincipale === originalUrl ? newUrl : photoPrincipale;
    clearAi(originalUrl);
    onChange({ photos: newPhotos, photo_principale: newPrincipale });
  };

  const addAsCopy = (originalUrl, newUrl) => {
    clearAi(originalUrl);
    onChange({ photos: [...photos, newUrl] });
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
        {uploading ? (
          <><Loader2 className="w-6 h-6 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Envoi en cours…</span></>
        ) : (
          <><Upload className="w-6 h-6 text-muted-foreground" /><span className="text-sm font-medium">Ajouter des photos</span><span className="text-xs text-muted-foreground">JPG, PNG — plusieurs à la fois</span></>
        )}
        <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((url, i) => {
            const isPrincipale = url === photoPrincipale;
            const ai = aiState[url] || {};

            return (
              <div key={i} className="space-y-1.5">
                {/* Image tile */}
                <div className={`relative rounded-xl overflow-hidden aspect-video group border-2 transition-all ${isPrincipale ? "border-primary" : "border-transparent"}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />

                  {/* Loading overlay */}
                  {ai.status === "loading" && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      <span className="text-white text-xs font-semibold">{ai.mode?.label} IA…</span>
                    </div>
                  )}

                  {/* Done badge on image */}
                  {ai.status === "done" && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold">
                        <Check className="w-3 h-3" /> Prête
                      </div>
                    </div>
                  )}

                  {/* Hover overlay: normal actions + IA picker trigger */}
                  {!ai.status && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all">
                      {/* Top actions */}
                      <div className="absolute top-1.5 right-1.5 flex gap-1">
                        <button type="button" onClick={() => setPrincipale(url)} title="Photo principale"
                          className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors">
                          <Star className={`w-3.5 h-3.5 ${isPrincipale ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                        </button>
                        <button type="button" onClick={() => removePhoto(url)} title="Supprimer"
                          className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50 transition-colors">
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>

                      {/* IA button → opens picker */}
                      <button
                        type="button"
                        onClick={() => setAi(url, { status: "picking" })}
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        <Sparkles className="w-3 h-3" /> IA
                      </button>
                    </div>
                  )}

                  {/* AI mode picker */}
                  {ai.status === "picking" && (
                    <>
                      <AIModePickerOverlay url={url} onSelect={(mode) => runAI(url, mode)} />
                      {/* Cancel */}
                      <button
                        type="button"
                        onClick={() => clearAi(url)}
                        className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-lg text-muted-foreground hover:text-foreground transition-colors z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {/* Badges */}
                  {isPrincipale && ai.status !== "picking" && (
                    <div className="absolute bottom-1.5 left-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1 pointer-events-none">
                      <Star className="w-2.5 h-2.5 fill-white" /> Principale
                    </div>
                  )}
                </div>

                {/* Result panel */}
                {ai.status === "done" && ai.result && (
                  <div className={`border rounded-xl p-2 space-y-1.5 ${ai.mode?.colorLight}`}>
                    <div className="flex items-center gap-1.5">
                      {ai.mode && <ai.mode.icon className="w-3 h-3" />}
                      <p className="text-[10px] font-semibold uppercase tracking-wide">{ai.mode?.label} — résultat</p>
                    </div>
                    <img src={ai.result} alt="Version IA" className="w-full aspect-video object-cover rounded-lg" />
                    <div className="grid grid-cols-2 gap-1">
                      <button type="button" onClick={() => replaceWith(url, ai.result)}
                        className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors">
                        Remplacer
                      </button>
                      <button type="button" onClick={() => addAsCopy(url, ai.result)}
                        className="py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors">
                        Ajouter copie
                      </button>
                    </div>
                    <button type="button" onClick={() => clearAi(url)}
                      className="w-full py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      Ignorer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <ImageIcon className="w-4 h-4" /> Aucune photo ajoutée
        </div>
      )}
    </div>
  );
}