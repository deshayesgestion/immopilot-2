import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import LandingEditorHero from "./LandingEditorHero";
import LandingEditorSections from "./LandingEditorSections";
import LandingEditorBiens from "./LandingEditorBiens";
import LandingEditorServices from "./LandingEditorServices";
import LandingEditorTestimonials from "./LandingEditorTestimonials";
import LandingPreview from "./LandingPreview";

const TABS = [
  { id: "hero", label: "🏠 Hero" },
  { id: "sections", label: "⚙️ Sections" },
  { id: "biens", label: "🏘️ Biens" },
  { id: "services", label: "✨ Services" },
  { id: "temoignages", label: "⭐ Témoignages" },
  { id: "preview", label: "👁️ Aperçu" },
];

export default function LandingEditor({ agency, onSave }) {
  const [tab, setTab] = useState("hero");
  const [form, setForm] = useState(null);
  const [biens, setBiens] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!agency) return;
    setForm({
      lp_hero_title: agency.lp_hero_title || agency.name || "",
      lp_hero_subtitle: agency.lp_hero_subtitle || agency.slogan || "",
      lp_hero_cta1_label: agency.lp_hero_cta1_label || "Découvrir les biens",
      lp_hero_cta1_url: agency.lp_hero_cta1_url || "/vente",
      lp_hero_cta2_label: agency.lp_hero_cta2_label || "Faire estimer mon bien",
      lp_hero_cta2_url: agency.lp_hero_cta2_url || "/estimation",
      hero_image_url: agency.hero_image_url || "",
      logo_url: agency.logo_url || "",
      lp_section_hero_enabled: agency.lp_section_hero_enabled !== false,
      lp_section_featured_enabled: agency.lp_section_featured_enabled !== false,
      lp_section_agency_enabled: agency.lp_section_agency_enabled !== false,
      lp_section_services_enabled: agency.lp_section_services_enabled !== false,
      lp_section_stats_enabled: agency.lp_section_stats_enabled !== false,
      lp_section_testimonials_enabled: agency.lp_section_testimonials_enabled !== false,
      lp_section_contact_enabled: agency.lp_section_contact_enabled !== false,
      lp_services: agency.lp_services || [
        { icon: "🏡", title: "Vente immobilière", description: "Accompagnement complet de la mise en vente à la signature." },
        { icon: "🔑", title: "Gestion locative", description: "Gestion de vos biens locatifs en toute sérénité." },
        { icon: "📊", title: "Estimation gratuite", description: "Évaluation précise de votre bien par nos experts." },
      ],
      lp_testimonials: agency.lp_testimonials || [
        { name: "Marie L.", role: "Propriétaire vendeuse", text: "Service exceptionnel, vente réalisée en 3 semaines !" },
        { name: "Pierre D.", role: "Acquéreur", text: "Équipe professionnelle et réactive. Je recommande vivement." },
      ],
      lp_stats: agency.lp_stats || [
        { label: "Biens vendus", value: "500+" },
        { label: "Clients satisfaits", value: "98%" },
        { label: "Années d'expérience", value: "15" },
        { label: "Agents experts", value: "12" },
      ],
      lp_featured_biens_ids: agency.lp_featured_biens_ids || [],
      lp_featured_filter: agency.lp_featured_filter || "all",
    });
  }, [agency]);

  useEffect(() => {
    base44.entities.Bien.list("-created_date", 100).then(setBiens);
  }, []);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Agency.update(agency.id, form);
    await onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  if (!form) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 p-1.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
              tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-secondary/50"
            }`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex-shrink-0">
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              saved ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90"
            }`}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? "✓ Enregistré" : "💾 Enregistrer"}
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === "hero" && <LandingEditorHero form={form} set={set} agency={agency} />}
      {tab === "sections" && <LandingEditorSections form={form} set={set} />}
      {tab === "biens" && <LandingEditorBiens form={form} set={set} biens={biens} />}
      {tab === "services" && <LandingEditorServices form={form} set={set} />}
      {tab === "temoignages" && <LandingEditorTestimonials form={form} set={set} />}
      {tab === "preview" && <LandingPreview form={form} agency={agency} biens={biens} />}
    </div>
  );
}