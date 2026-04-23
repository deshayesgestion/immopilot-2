import { ToggleRight, ToggleLeft } from "lucide-react";

const SECTIONS = [
  { key: "lp_section_hero_enabled", label: "Hero (page d'accueil)", desc: "Bandeau principal avec titre, sous-titre et CTA.", emoji: "🏠" },
  { key: "lp_section_featured_enabled", label: "Biens en avant", desc: "Affiche les biens sélectionnés ou mis en avant.", emoji: "🏘️" },
  { key: "lp_section_agency_enabled", label: "Présentation agence", desc: "Description, photo et informations de l'agence.", emoji: "🏢" },
  { key: "lp_section_services_enabled", label: "Services proposés", desc: "Icônes et descriptions de vos services.", emoji: "✨" },
  { key: "lp_section_stats_enabled", label: "Statistiques clés", desc: "Chiffres clés de votre agence (ventes, satisfaction…).", emoji: "📊" },
  { key: "lp_section_testimonials_enabled", label: "Témoignages clients", desc: "Avis et témoignages de vos clients satisfaits.", emoji: "⭐" },
  { key: "lp_section_contact_enabled", label: "Section contact / CTA", desc: "Bouton d'appel à l'action et formulaire de contact.", emoji: "📞" },
];

export default function LandingEditorSections({ form, set }) {
  const enabledCount = SECTIONS.filter(s => form[s.key] !== false).length;

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sections de la landing page</h3>
        <span className="text-xs text-muted-foreground">{enabledCount}/{SECTIONS.length} actives</span>
      </div>
      <p className="text-xs text-muted-foreground">Activez ou désactivez chaque section. Les sections désactivées n'apparaissent pas sur le site public.</p>

      <div className="space-y-2">
        {SECTIONS.map(section => {
          const isEnabled = form[section.key] !== false;
          return (
            <div key={section.key}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isEnabled ? "border-primary/20 bg-primary/5" : "border-border/30 bg-secondary/20"
              }`}>
              <span className="text-xl flex-shrink-0">{section.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isEnabled ? "text-foreground" : "text-muted-foreground"}`}>
                  {section.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{section.desc}</p>
              </div>
              <button onClick={() => set(section.key, !isEnabled)} className="flex-shrink-0">
                {isEnabled
                  ? <ToggleRight className="w-7 h-7 text-primary" />
                  : <ToggleLeft className="w-7 h-7 text-gray-300" />
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}