import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Star, Loader2, ImageIcon, Sparkles, Check } from "lucide-react";

export default function BienFichePhotos({ photos = [], photoPrincipale, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState({}); // { [url]: "loading" | "done" }
  const [enhanced, setEnhanced] = useState({}); // { [originalUrl]: enhancedUrl }

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
    // Clean up enhanced state for removed photo
    setEnhanced(prev => { const n = { ...prev }; delete n[url]; return n; });
    setEnhancing(prev => { const n = { ...prev }; delete n[url]; return n; });
    onChange({ photos: newPhotos, photo_principale: newPrincipale });
  };

  const setPrincipale = (url) => {
    onChange({ photo_principale: url });
  };

  const enhancePhoto = async (url) => {
    setEnhancing(prev => ({ ...prev, [url]: "loading" }));
    const result = await base44.integrations.Core.GenerateImage({
      prompt: "Improve this real estate photo: enhance brightness, sharpness, and colors to make it look more professional and appealing. Keep the exact same composition and perspective.",
      existing_image_urls: [url],
    });
    const enhancedUrl = result.url;
    setEnhanced(prev => ({ ...prev, [url]: enhancedUrl }));
    setEnhancing(prev => ({ ...prev, [url]: "done" }));
  };

  const replaceWithEnhanced = (originalUrl) => {
    const enhancedUrl = enhanced[originalUrl];
    if (!enhancedUrl) return;
    const newPhotos = photos.map(p => p === originalUrl ? enhancedUrl : p);
    const newPrincipale = photoPrincipale === originalUrl ? enhancedUrl : photoPrincipale;
    // Move enhanced tracking to new url
    setEnhanced(prev => { const n = { ...prev }; delete n[originalUrl]; return n; });
    setEnhancing(prev => { const n = { ...prev }; delete n[originalUrl]; return n; });
    onChange({ photos: newPhotos, photo_principale: newPrincipale });
  };

  const keepEnhancedAsCopy = (originalUrl) => {
    const enhancedUrl = enhanced[originalUrl];
    if (!enhancedUrl) return;
    const newPhotos = [...photos, enhancedUrl];
    setEnhanced(prev => { const n = { ...prev }; delete n[originalUrl]; return n; });
    setEnhancing(prev => { const n = { ...prev }; delete n[originalUrl]; return n; });
    onChange({ photos: newPhotos });
  };

  const discardEnhanced = (url) => {
    setEnhanced(prev => { const n = { ...prev }; delete n[url]; return n; });
    setEnhancing(prev => { const n = { ...prev }; delete n[url]; return n; });
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
            const enhanceStatus = enhancing[url]; // "loading" | "done" | undefined
            const enhancedUrl = enhanced[url];

            return (
              <div key={i} className="space-y-1.5">
                <div className={`relative rounded-xl overflow-hidden aspect-video group border-2 transition-all ${isPrincipale ? "border-primary" : "border-transparent"}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 p-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrincipale(url)}
                        title="Photo principale"
                        className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      >
                        <Star className={`w-3.5 h-3.5 ${isPrincipale ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        title="Supprimer"
                        className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>

                    {/* AI Enhance button */}
                    {!enhanceStatus && (
                      <button
                        type="button"
                        onClick={() => enhancePhoto(url)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Sparkles className="w-3 h-3" /> Améliorer IA
                      </button>
                    )}

                    {enhanceStatus === "loading" && (
                      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600/80 text-white rounded-lg text-xs font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" /> IA en cours…
                      </div>
                    )}

                    {enhanceStatus === "done" && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-600/90 text-white rounded-lg text-xs font-semibold">
                        <Check className="w-3 h-3" /> Prête
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  {isPrincipale && (
                    <div className="absolute bottom-1.5 left-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1 pointer-events-none">
                      <Star className="w-2.5 h-2.5 fill-white" /> Principale
                    </div>
                  )}
                  {enhanceStatus === "loading" && (
                    <div className="absolute inset-0 bg-violet-900/30 flex items-center justify-center pointer-events-none">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Enhanced result actions */}
                {enhanceStatus === "done" && enhancedUrl && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-2 space-y-1.5">
                    <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wide">Version améliorée prête</p>
                    <img src={enhancedUrl} alt="Version améliorée" className="w-full aspect-video object-cover rounded-lg" />
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => replaceWithEnhanced(url)}
                        className="py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Remplacer
                      </button>
                      <button
                        type="button"
                        onClick={() => keepEnhancedAsCopy(url)}
                        className="py-1.5 bg-white hover:bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Ajouter copie
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => discardEnhanced(url)}
                      className="w-full py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
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