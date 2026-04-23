import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Sparkles, Loader2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const EMOJI_SUGGESTIONS = ["🏡", "🔑", "📊", "🤝", "📋", "🏗️", "💼", "🌟", "🏠", "📞", "💰", "🔍"];

export default function LandingEditorServices({ form, set }) {
  const [generating, setGenerating] = useState(false);

  const services = form.lp_services || [];

  const update = (idx, field, val) => {
    const next = services.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    set("lp_services", next);
  };

  const add = () => set("lp_services", [...services, { icon: "🏡", title: "Nouveau service", description: "" }]);

  const remove = (idx) => set("lp_services", services.filter((_, i) => i !== idx));

  const generateAI = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es expert en marketing immobilier. Génère 4 services phares pour une agence immobilière.
Retourne JSON: { services: [{ icon: emoji, title: string (max 30 chars), description: string (max 80 chars) }] }`,
      response_json_schema: {
        type: "object",
        properties: {
          services: { type: "array", items: { type: "object" } }
        }
      }
    });
    if (result?.services) set("lp_services", result.services);
    setGenerating(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Services proposés</h3>
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
        {services.map((service, idx) => (
          <div key={idx} className="border border-border/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1 mb-1">
                {EMOJI_SUGGESTIONS.map(e => (
                  <button key={e} onClick={() => update(idx, "icon", e)}
                    className={`text-sm w-7 h-7 rounded-lg flex items-center justify-center transition-all ${service.icon === e ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-secondary"}`}>
                    {e}
                  </button>
                ))}
              </div>
              <button onClick={() => remove(idx)} className="ml-auto p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <Input value={service.title} onChange={e => update(idx, "title", e.target.value)}
              placeholder="Titre du service" className="h-8 rounded-xl text-xs" />
            <Textarea value={service.description} onChange={e => update(idx, "description", e.target.value)}
              placeholder="Description du service…" className="rounded-xl resize-none min-h-[60px] text-xs" />
          </div>
        ))}
        {services.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Aucun service. Ajoutez-en ou générez avec l'IA.</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {services.length > 0 && (
        <div className="border-t border-border/30 pt-4">
          <p className="text-xs text-muted-foreground mb-3">Aperçu</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {services.map((s, i) => (
              <div key={i} className="bg-secondary/30 rounded-xl p-3 text-center">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-xs font-semibold mt-1">{s.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}