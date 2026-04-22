import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Star, Loader2, ImageIcon, Sparkles, Check, Zap, Sofa, Building2 } from "lucide-react";

const AI_MODES = [
  {
    id: "amelioration",
    label: "Amélioration",
    icon: Zap,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    badgeBg: "bg-violet-600",
    resultBorder: "border-violet-200 bg-violet-50",
    resultText: "text-violet-700",
    description: "Améliore la luminosité, la netteté et les couleurs pour une photo professionnelle.",
    prompt: "Enhance this real estate photo professionally: improve brightness, sharpness, and color balance to make it look bright, clean and attractive for a property listing. Keep the exact same composition, framing and perspective.",
  },
  {
    id: "agencement",
    label: "Agencement",
    icon: Sofa,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badgeBg: "bg-emerald-600",
    resultBorder: "border-emerald-200 bg-emerald-50",
    resultText: "text-emerald-700",
    description: "Optimise la présentation du mobilier existant pour une mise en valeur maximale.",
    prompt: "Optimize the furniture arrangement and interior styling in this real estate photo to make it look more attractive and well-organized. Improve the overall visual appeal for a property listing while keeping existing furniture and structure. Make it look like a professional interior design photo.",
  },
  {
    id: "projection",
    label: "Projection",
    icon: Building2,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badgeBg: "bg-amber-600",
    resultBorder: "border-amber-200 bg-amber-50",
    resultText: "text-amber-700",
    description: "Ajoute du mobilier virtuel pour simuler la pièce meublée.",
    prompt: "Add tasteful, modern virtual furniture and decor to this empty or sparse real estate room photo. Create a realistic, welcoming and professionally staged interior that helps buyers or renters visualize living in the space. Use contemporary furniture that matches the room's style and proportions.",
  },
];

// Full-screen modal for mode selection — works great on mobile
function AIModeModal({ url, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-sm sm:mx-4 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Intelligence Artificielle</p>
              <p className="text-xs text-muted-foreground">Choisir un mode de traitement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-5 pt-4">
          <img src={url} alt="Photo originale" className="w-full aspect-video object-cover rounded-xl border border-border/50" />
        </div>

        {/* Mode buttons */}
        <div className="p-5 space-y-3">
          {AI_MODES.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => { onSelect(mode); onClose(); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <div className={`p-3 rounded-xl flex-shrink-0 ${mode.iconBg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${mode.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{mode.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mode.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BienFichePhotos({ photos = [], photoPrincipale, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [pickingUrl, setPickingUrl] = useState(null); // url currently showing modal
  // { [url]: { status: "loading"|"done", mode, result } }
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((url, i) => {
            const isPrincipale = url === photoPrincipale;
            const ai = aiState[url] || {};

            return (
              <div key={i} className="space-y-2">
                {/* Image tile */}
                <div className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${isPrincipale ? "border-primary" : "border-transparent"}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />

                  {/* Loading overlay */}
                  {ai.status === "loading" && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-7 h-7 animate-spin text-white" />
                      <div className="text-center">
                        <p className="text-white text-xs font-semibold">{ai.mode?.label}</p>
                        <p className="text-white/70 text-[10px]">Traitement en cours…</p>
                      </div>
                    </div>
                  )}

                  {/* Top-right actions: always visible */}
                  {ai.status !== "loading" && (
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                      <button type="button" onClick={() => setPrincipale(url)} title="Définir comme principale"
                        className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg transition-colors">
                        <Star className={`w-3.5 h-3.5 ${isPrincipale ? "fill-amber-400 text-amber-400" : "text-white"}`} />
                      </button>
                      <button type="button" onClick={() => removePhoto(url)} title="Supprimer"
                        className="p-1.5 bg-black/50 hover:bg-red-600/80 backdrop-blur-sm rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}

                  {/* ✨ IA button — always visible bottom-left */}
                  {!ai.status && (
                    <button
                      type="button"
                      onClick={() => setPickingUrl(url)}
                      className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-1 bg-violet-600/90 hover:bg-violet-700 backdrop-blur-sm text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" /> IA
                    </button>
                  )}

                  {/* Done badge */}
                  {ai.status === "done" && (
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-lg text-[11px] font-semibold">
                      <Check className="w-3 h-3" /> Résultat prêt
                    </div>
                  )}

                  {/* Principale badge */}
                  {isPrincipale && (
                    <div className="absolute bottom-1.5 right-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1 pointer-events-none">
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </div>
                  )}
                </div>

                {/* Result panel */}
                {ai.status === "done" && ai.result && (
                  <div className={`border-2 rounded-2xl overflow-hidden ${ai.mode?.resultBorder}`}>
                    {/* Result header */}
                    <div className={`flex items-center gap-2 px-3 py-2 ${ai.mode?.resultBorder}`}>
                      {ai.mode && (
                        <div className={`p-1 rounded-lg ${ai.mode.iconBg}`}>
                          <ai.mode.icon className={`w-3 h-3 ${ai.mode.iconColor}`} />
                        </div>
                      )}
                      <p className={`text-xs font-semibold ${ai.mode?.resultText}`}>{ai.mode?.label} IA</p>
                    </div>
                    {/* Result image */}
                    <img src={ai.result} alt="Version IA" className="w-full aspect-video object-cover" />
                    {/* Actions */}
                    <div className="p-2 space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => replaceWith(url, ai.result)}
                          className="py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          Remplacer
                        </button>
                        <button
                          type="button"
                          onClick={() => addAsCopy(url, ai.result)}
                          className="py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Ajouter copie
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearAi(url)}
                        className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Ignorer le résultat
                      </button>
                    </div>
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

      {/* AI Mode modal */}
      {pickingUrl && (
        <AIModeModal
          url={pickingUrl}
          onSelect={(mode) => runAI(pickingUrl, mode)}
          onClose={() => setPickingUrl(null)}
        />
      )}
    </div>
  );
}