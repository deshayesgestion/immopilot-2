import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Sparkles, Loader2, RotateCcw, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const AI_TYPES = [
  {
    id: "furnishing",
    icon: "🛋️",
    label: "Ameublement IA",
    desc: "Ajoute virtuellement des meubles dans un espace vide",
    styles: [
      { id: "moderne", label: "Moderne", emoji: "🏙️" },
      { id: "classique", label: "Classique", emoji: "🏛️" },
      { id: "luxe", label: "Luxe", emoji: "✨" },
      { id: "scandinave", label: "Scandinave", emoji: "🌿" },
    ],
  },
  {
    id: "rearrangement",
    icon: "🔄",
    label: "Réagencement",
    desc: "Optimise la disposition pour un espace plus fonctionnel",
    styles: null,
  },
  {
    id: "enhancement",
    icon: "🌟",
    label: "Amélioration visuelle",
    desc: "Luminosité, netteté, couleurs et suppression d'objets",
    styles: null,
  },
  {
    id: "declutter",
    icon: "🧹",
    label: "Désencombrement",
    desc: "Retire les objets personnels et le désordre",
    styles: null,
  },
];

const PROMPTS = {
  furnishing_moderne: "Professional real estate photo with modern minimalist furniture, clean lines, neutral tones, contemporary design, bright and airy interior, high-end staging",
  furnishing_classique: "Professional real estate photo with classic elegant furniture, warm tones, traditional decor, sophisticated interior staging, quality furnishings",
  furnishing_luxe: "Professional real estate photo with luxury high-end furniture, premium materials, designer pieces, opulent interior staging, marble and gold accents",
  furnishing_scandinave: "Professional real estate photo with Scandinavian minimalist furniture, natural wood tones, cozy textiles, clean white walls, hygge interior staging",
  rearrangement: "Professional real estate photo with optimally rearranged furniture for maximum space efficiency, open flow, functional layout, well-lit staged interior",
  enhancement: "Professional real estate photo, enhanced brightness and clarity, color corrected, clean and inviting atmosphere, high-quality photography lighting",
  declutter: "Professional real estate photo, decluttered and clean, no personal items, minimalist and neutral, staged for sale, bright and welcoming",
};

export default function AIImageModal({ imageUrl, onClose, onApply }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const typeConfig = AI_TYPES.find((t) => t.id === selectedType);
  const canGenerate = selectedType && (typeConfig?.styles ? selectedStyle : true) && !result;

  const promptKey = selectedType && selectedStyle
    ? `${selectedType}_${selectedStyle}`
    : selectedType;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    const prompt = PROMPTS[promptKey] || PROMPTS.enhancement;
    const res = await base44.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: [imageUrl],
    });
    setResult(res.url);
    setLoading(false);
  };

  const handleApply = () => {
    onApply({ original: imageUrl, enhanced: result, type: selectedType, style: selectedStyle });
    onClose();
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-border/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-base">Home Staging IA</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Before / After preview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original</p>
              <div className="aspect-video rounded-xl overflow-hidden bg-secondary/40">
                <img src={imageUrl} alt="Original" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Résultat IA</p>
              <div className="aspect-video rounded-xl overflow-hidden bg-secondary/40 flex items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs">Génération en cours...</span>
                  </div>
                ) : result ? (
                  <img src={result} alt="IA améliorée" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground/40">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-xs">Choisissez un traitement</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!result && (
            <>
              {/* Type selection */}
              <div>
                <p className="text-sm font-medium mb-2.5">Type d'amélioration</p>
                <div className="grid grid-cols-2 gap-2">
                  {AI_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setSelectedType(t.id); setSelectedStyle(null); }}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        selectedType === t.id
                          ? "border-primary/60 bg-accent/30"
                          : "border-border/50 hover:bg-secondary/20"
                      }`}
                    >
                      <div className="text-lg mb-1">{t.icon}</div>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style selection (only for furnishing) */}
              {typeConfig?.styles && (
                <div>
                  <p className="text-sm font-medium mb-2.5">Style d'ameublement</p>
                  <div className="grid grid-cols-4 gap-2">
                    {typeConfig.styles.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStyle(s.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedStyle === s.id
                            ? "border-primary/60 bg-accent/30"
                            : "border-border/50 hover:bg-secondary/20"
                        }`}
                      >
                        <div className="text-xl mb-1">{s.emoji}</div>
                        <p className="text-xs font-medium">{s.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {result ? (
              <>
                <Button type="button" variant="outline" onClick={handleReset} className="gap-2 rounded-full flex-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Recommencer
                </Button>
                <Button type="button" onClick={handleApply} className="gap-2 rounded-full flex-1">
                  <Check className="w-4 h-4" />
                  Appliquer cette version
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose} className="rounded-full flex-1">
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  className="gap-2 rounded-full flex-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Générer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}