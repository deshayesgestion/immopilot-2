import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Star, Loader2, ImageIcon } from "lucide-react";

export default function BienFichePhotos({ photos = [], photoPrincipale, onChange }) {
  const [uploading, setUploading] = useState(false);

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
    onChange({ photos: newPhotos, photo_principale: newPrincipale });
  };

  const setPrincipale = (url) => {
    onChange({ photo_principale: url });
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
            return (
              <div key={i} className={`relative rounded-xl overflow-hidden aspect-video group border-2 transition-all ${isPrincipale ? "border-primary" : "border-transparent"}`}>
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
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
                {isPrincipale && (
                  <div className="absolute bottom-1.5 left-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" /> Principale
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