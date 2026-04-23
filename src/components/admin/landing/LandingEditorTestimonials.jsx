import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Sparkles, Loader2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function LandingEditorTestimonials({ form, set }) {
  const [generating, setGenerating] = useState(false);
  const testimonials = form.lp_testimonials || [];

  const update = (idx, field, val) => {
    set("lp_testimonials", testimonials.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  };

  const add = () => set("lp_testimonials", [...testimonials, { name: "", role: "Client", text: "" }]);

  const remove = (idx) => set("lp_testimonials", testimonials.filter((_, i) => i !== idx));

  const generateAI = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère 3 témoignages clients réalistes pour une agence immobilière française.
JSON: { testimonials: [{ name: string, role: string (Acheteur / Vendeur / Locataire), text: string (max 100 chars, enthousiaste et concret) }] }`,
      response_json_schema: {
        type: "object",
        properties: { testimonials: { type: "array", items: { type: "object" } } }
      }
    });
    if (result?.testimonials) set("lp_testimonials", result.testimonials);
    setGenerating(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Témoignages clients</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1.5" onClick={generateAI} disabled={generating}>
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
            Générer avec IA
          </Button>
          <Button size="sm" className="h-7 text-xs rounded-full gap-1" onClick={add}>
            <Plus className="w-3 h-3" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {testimonials.map((t, idx) => (
          <div key={idx} className="border border-border/40 rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input value={t.name} onChange={e => update(idx, "name", e.target.value)}
                  placeholder="Nom du client" className="h-8 rounded-xl text-xs" />
                <Input value={t.role} onChange={e => update(idx, "role", e.target.value)}
                  placeholder="Rôle (Acheteur…)" className="h-8 rounded-xl text-xs" />
              </div>
              <button onClick={() => remove(idx)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <Textarea value={t.text} onChange={e => update(idx, "text", e.target.value)}
              placeholder="Témoignage du client…" className="rounded-xl resize-none min-h-[70px] text-xs" />
          </div>
        ))}
        {testimonials.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun témoignage. Ajoutez-en ou générez avec l'IA.</p>
        )}
      </div>

      {testimonials.length > 0 && (
        <div className="border-t border-border/30 pt-4">
          <p className="text-xs text-muted-foreground mb-3">Aperçu</p>
          <div className="space-y-2">
            {testimonials.slice(0, 3).map((t, i) => (
              <div key={i} className="bg-secondary/20 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, s) => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs italic text-muted-foreground">"{t.text}"</p>
                <p className="text-[11px] font-semibold mt-1">{t.name} <span className="font-normal text-muted-foreground">· {t.role}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}