import { useState } from "react";
import { Monitor, Smartphone, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const HERO_BG_FALLBACK = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";

export default function LandingPreview({ form, agency, biens }) {
  const [device, setDevice] = useState("desktop");

  const selectedBiens = biens.filter(b =>
    (form.lp_featured_biens_ids || []).includes(b.id) ||
    (form.lp_featured_biens_ids?.length === 0 && b.statut === "disponible")
  ).slice(0, 6);

  const heroBg = form.hero_image_url || HERO_BG_FALLBACK;
  const primaryColor = agency?.primary_color || "#4F46E5";

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white rounded-xl border border-border/50 p-1">
          <button onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${device === "desktop" ? "bg-primary text-white" : "text-muted-foreground"}`}>
            <Monitor className="w-3.5 h-3.5" /> Desktop
          </button>
          <button onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${device === "mobile" ? "bg-primary text-white" : "text-muted-foreground"}`}>
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
        </div>
        <Link to="/" target="_blank"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline">
          <ExternalLink className="w-3 h-3" /> Voir le site public
        </Link>
      </div>

      {/* Preview frame */}
      <div className={`mx-auto border-2 border-border rounded-2xl overflow-hidden bg-white shadow-xl transition-all duration-300 ${device === "mobile" ? "max-w-sm" : "max-w-full"}`}>
        <div className="bg-secondary/30 border-b border-border/30 px-3 py-1.5 flex items-center gap-2">
          <div className="flex gap-1">
            {["bg-red-400", "bg-amber-400", "bg-green-400"].map((c, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}
          </div>
          <div className="flex-1 text-center text-[10px] text-muted-foreground bg-white rounded-full px-3 py-0.5 mx-4">
            {agency?.domain || window.location.hostname}
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {/* HERO */}
          {form.lp_section_hero_enabled !== false && (
            <div className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: device === "mobile" ? "300px" : "400px" }}>
              <img src={heroBg} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/45" />
              <div className="relative z-10 text-white text-center px-6 py-12">
                {form.logo_url && <img src={form.logo_url} alt="logo" className="h-10 mx-auto mb-4 object-contain" />}
                <p className="text-xs opacity-70 tracking-widest uppercase mb-2">Agence Immobilière</p>
                <h1 className={`font-bold leading-tight ${device === "mobile" ? "text-xl" : "text-3xl"}`}>
                  {form.lp_hero_title || agency?.name || "Votre Agence"}
                </h1>
                <p className={`mt-3 opacity-80 max-w-md mx-auto ${device === "mobile" ? "text-xs" : "text-sm"}`}>
                  {form.lp_hero_subtitle || agency?.slogan || ""}
                </p>
                <div className={`flex gap-3 mt-6 justify-center ${device === "mobile" ? "flex-col items-center" : ""}`}>
                  <span className="px-5 py-2 rounded-full text-xs font-semibold text-black" style={{ backgroundColor: "white" }}>
                    {form.lp_hero_cta1_label || "Découvrir les biens"}
                  </span>
                  <span className="px-5 py-2 rounded-full text-xs font-medium border border-white/50">
                    {form.lp_hero_cta2_label || "Estimer mon bien"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* BIENS EN AVANT */}
          {form.lp_section_featured_enabled !== false && selectedBiens.length > 0 && (
            <div className="px-6 py-8 bg-gray-50">
              <h2 className={`font-bold text-center mb-6 ${device === "mobile" ? "text-lg" : "text-xl"}`}>Nos biens en avant</h2>
              <div className={`grid gap-3 ${device === "mobile" ? "grid-cols-1" : "grid-cols-3"}`}>
                {selectedBiens.slice(0, device === "mobile" ? 2 : 3).map(b => (
                  <div key={b.id} className="bg-white rounded-xl overflow-hidden border border-border/30 shadow-sm">
                    <div className="h-28 bg-gray-200 overflow-hidden">
                      {b.photo_principale
                        ? <img src={b.photo_principale} alt={b.titre} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Photo</div>
                      }
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate">{b.titre}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: primaryColor }}>
                        {b.prix?.toLocaleString("fr-FR")} €{b.type === "location" ? "/mois" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERVICES */}
          {form.lp_section_services_enabled !== false && form.lp_services?.length > 0 && (
            <div className="px-6 py-8">
              <h2 className={`font-bold text-center mb-6 ${device === "mobile" ? "text-lg" : "text-xl"}`}>Nos services</h2>
              <div className={`grid gap-4 ${device === "mobile" ? "grid-cols-1" : "grid-cols-3"}`}>
                {form.lp_services.map((s, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-gray-50">
                    <span className="text-3xl">{s.icon}</span>
                    <p className="text-sm font-semibold mt-2">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AGENCE */}
          {form.lp_section_agency_enabled !== false && (
            <div className="px-6 py-8 bg-gray-50">
              <div className={`flex gap-6 items-center ${device === "mobile" ? "flex-col text-center" : ""}`}>
                {form.logo_url && <img src={form.logo_url} alt="agency" className="w-20 h-20 object-contain rounded-xl flex-shrink-0" />}
                <div>
                  <h2 className={`font-bold ${device === "mobile" ? "text-lg" : "text-xl"}`}>{agency?.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{agency?.description}</p>
                  {agency?.expertise && <p className="text-xs text-muted-foreground mt-1">📍 {agency.expertise}</p>}
                </div>
              </div>
            </div>
          )}

          {/* TÉMOIGNAGES */}
          {form.lp_section_testimonials_enabled !== false && form.lp_testimonials?.length > 0 && (
            <div className="px-6 py-8">
              <h2 className={`font-bold text-center mb-6 ${device === "mobile" ? "text-lg" : "text-xl"}`}>Ce que disent nos clients</h2>
              <div className={`grid gap-4 ${device === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                {form.lp_testimonials.slice(0, 2).map((t, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_, s) => <span key={s} className="text-amber-400 text-xs">★</span>)}</div>
                    <p className="text-xs italic">"{t.text}"</p>
                    <p className="text-xs font-semibold mt-2">{t.name} <span className="font-normal text-muted-foreground">· {t.role}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA CONTACT */}
          {form.lp_section_contact_enabled !== false && (
            <div className="px-6 py-10 text-center" style={{ backgroundColor: primaryColor }}>
              <h2 className="text-white font-bold text-lg mb-2">Prêt à trouver votre bien ?</h2>
              <p className="text-white/80 text-sm mb-5">Contactez-nous dès aujourd'hui</p>
              <div className="flex gap-3 justify-center flex-wrap">
                {agency?.phone && <span className="bg-white text-xs font-semibold px-4 py-2 rounded-full" style={{ color: primaryColor }}>📞 {agency.phone}</span>}
                {agency?.email && <span className="border border-white/50 text-white text-xs px-4 py-2 rounded-full">✉️ {agency.email}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}