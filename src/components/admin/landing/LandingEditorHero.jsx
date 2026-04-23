import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Sparkles, Image } from "lucide-react";

export default function LandingEditorHero({ form, set, agency }) {
  const [uploading, setUploading] = useState(null); // "hero" | "logo"
  const [generating, setGenerating] = useState(false);

  const uploadImage = async (file, field) => {
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set(field, file_url);
    setUploading(null);
  };

  const generateWithAI = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en marketing immobilier. Génère un titre accrocheur et un sous-titre pour une agence immobilière.
Nom de l'agence : ${agency?.name || "l'agence"}
Description : ${agency?.description || "agence immobilière locale"}
Expertise : ${agency?.expertise || ""}
Retourne du JSON avec : { title: string (max 60 chars, percutant), subtitle: string (max 120 chars, descriptif et rassurant) }`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
        }
      }
    });
    if (result?.title) set("lp_hero_title", result.title);
    if (result?.subtitle) set("lp_hero_subtitle", result.subtitle);
    setGenerating(false);
  };

  const ImageUploadField = ({ label, field, value }) => (
    <div>
      <label className="text-xs text-muted-foreground mb-2 block">{label}</label>
      <div className="flex gap-3 items-start">
        {value ? (
          <div className="relative flex-shrink-0">
            <img src={value} alt={label} className="w-24 h-16 object-cover rounded-xl border border-border" />
            <button onClick={() => set(field, "")} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">×</button>
          </div>
        ) : (
          <div className="w-24 h-16 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center flex-shrink-0 bg-secondary/20">
            <Image className="w-5 h-5 text-muted-foreground/40" />
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 text-xs cursor-pointer hover:bg-secondary/30 transition-colors bg-white">
            {uploading === field ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading === field ? "Upload en cours…" : "Choisir une image"}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && uploadImage(e.target.files[0], field)} />
          </label>
          <Input value={value || ""} onChange={e => set(field, e.target.value)}
            placeholder="Ou coller une URL…" className="h-8 rounded-xl text-xs" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Textes */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Textes du Hero</h3>
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1.5" onClick={generateWithAI} disabled={generating}>
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
            Générer avec IA
          </Button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Titre principal *</label>
          <Input value={form.lp_hero_title} onChange={e => set("lp_hero_title", e.target.value)}
            placeholder="Votre expert immobilier local" className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Sous-titre / accroche</label>
          <Textarea value={form.lp_hero_subtitle} onChange={e => set("lp_hero_subtitle", e.target.value)}
            placeholder="Des biens d'exception au cœur de votre région." className="rounded-xl resize-none min-h-[80px] text-sm" />
        </div>

        <div className="border-t border-border/30 pt-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">Bouton principal (CTA 1)</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Label</label>
              <Input value={form.lp_hero_cta1_label} onChange={e => set("lp_hero_cta1_label", e.target.value)}
                placeholder="Découvrir les biens" className="h-8 rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">URL</label>
              <Input value={form.lp_hero_cta1_url} onChange={e => set("lp_hero_cta1_url", e.target.value)}
                placeholder="/vente" className="h-8 rounded-xl text-xs" />
            </div>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">Bouton secondaire (CTA 2)</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Label</label>
              <Input value={form.lp_hero_cta2_label} onChange={e => set("lp_hero_cta2_label", e.target.value)}
                placeholder="Estimer mon bien" className="h-8 rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">URL</label>
              <Input value={form.lp_hero_cta2_url} onChange={e => set("lp_hero_cta2_url", e.target.value)}
                placeholder="/estimation" className="h-8 rounded-xl text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-5">
        <h3 className="text-sm font-semibold">Images</h3>
        <ImageUploadField label="Image de fond du Hero" field="hero_image_url" value={form.hero_image_url} />
        <ImageUploadField label="Logo de l'agence" field="logo_url" value={form.logo_url} />

        {/* Aperçu mini-hero */}
        <div className="rounded-xl overflow-hidden border border-border/50 aspect-video relative bg-gray-900">
          {form.hero_image_url && (
            <img src={form.hero_image_url} alt="Preview" className="w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
            {form.logo_url && <img src={form.logo_url} alt="logo" className="h-8 mb-2 object-contain" />}
            <p className="text-xs font-bold truncate max-w-full">{form.lp_hero_title || "Titre principal"}</p>
            <p className="text-[10px] opacity-70 mt-1 line-clamp-2">{form.lp_hero_subtitle || "Sous-titre…"}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-[9px] bg-white text-black px-2 py-1 rounded-full">{form.lp_hero_cta1_label || "CTA 1"}</span>
              <span className="text-[9px] border border-white/50 px-2 py-1 rounded-full">{form.lp_hero_cta2_label || "CTA 2"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}