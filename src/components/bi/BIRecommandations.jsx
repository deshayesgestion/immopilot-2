import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Brain, Zap, Loader2, ArrowRight, CheckCircle2, Bell, TrendingUp, Tag, Megaphone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fmt = (n) => n ? n.toLocaleString("fr-FR") + " €" : "—";

const CATEGORY_STYLES = {
  relance: { color: "bg-orange-100 text-orange-800", icon: Bell, border: "border-orange-200", bg: "bg-orange-50/40" },
  commercial: { color: "bg-blue-100 text-blue-800", icon: TrendingUp, border: "border-blue-200", bg: "bg-blue-50/40" },
  prix: { color: "bg-purple-100 text-purple-800", icon: Tag, border: "border-purple-200", bg: "bg-purple-50/40" },
  marketing: { color: "bg-green-100 text-green-800", icon: Megaphone, border: "border-green-200", bg: "bg-green-50/40" },
};

const ACTION_ROUTES = {
  relance: "/admin/parametres/accueil-ia",
  commercial: "/admin/modules/vente",
  prix: "/admin/modules/biens",
  marketing: "/admin/communications",
};

function RecommandationCard({ rec, onExecute, executed }) {
  const style = CATEGORY_STYLES[rec.categorie] || CATEGORY_STYLES.commercial;
  const Icon = style.icon;
  const route = ACTION_ROUTES[rec.categorie] || "/admin";

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-4 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.color} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {rec.categorie}
          </div>
          {rec.priorite === "haute" && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Urgent</span>}
        </div>
        <span className={`text-[11px] font-bold ${rec.impact_estime?.includes("+") ? "text-green-700" : "text-muted-foreground"}`}>
          {rec.impact_estime}
        </span>
      </div>

      <p className="text-sm font-semibold">{rec.action}</p>
      <p className="text-xs text-muted-foreground">{rec.explication}</p>

      {rec.suggestion_prix && (
        <div className="bg-white/60 rounded-lg px-3 py-2 border border-border/40">
          <p className="text-[11px] text-muted-foreground">Prix suggéré</p>
          <p className="text-sm font-bold text-primary">{rec.suggestion_prix}</p>
        </div>
      )}

      <Link to={route}>
        <button
          onClick={() => onExecute(rec)}
          disabled={executed}
          className={`w-full flex items-center justify-center gap-2 mt-1 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            executed
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-white border border-border/50 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          }`}
        >
          {executed ? <><CheckCircle2 className="w-3.5 h-3.5" /> Exécuté</> : <><ArrowRight className="w-3.5 h-3.5" /> Exécuter</>}
        </button>
      </Link>
    </div>
  );
}

export default function BIRecommandations({ data }) {
  const { biens, dossiers, leads, paiements, contacts } = data;
  const [recommandations, setRecommandations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executed, setExecuted] = useState(new Set());
  const [filter, setFilter] = useState("all");

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setExecuted(new Set());

    const biensDisponibles = biens.filter(b => b.statut === "disponible");
    const biensVieuxSansDossier = biens.filter(b => {
      const age = Math.floor((Date.now() - new Date(b.created_date)) / 86400000);
      const hasDossier = dossiers.some(d => d.bien_id === b.id);
      return b.statut === "disponible" && age > 45 && !hasDossier;
    });
    const leadsNonContactés = leads.filter(l => l.statut === "nouveau");
    const impayés = paiements.filter(p => p.statut === "en_retard");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es l'IA Rounded, conseiller stratégique d'une agence immobilière. Génère des recommandations actionnables et précises.

CONTEXTE :
- ${biens.length} biens total | ${biensDisponibles.length} disponibles | ${biensVieuxSansDossier.length} sans dossier depuis >45j
- ${leads.length} leads | ${leadsNonContactés.length} non contactés
- ${dossiers.length} dossiers | ${dossiers.filter(d => d.statut === "en_cours").length} en cours
- ${impayés.length} impayés
- ${contacts.length} contacts

Génère exactement 8 recommandations variées couvrant : relances (2), actions commerciales (2), ajustements prix (2), actions marketing (2).

Pour chaque recommandation :
- action : phrase d'action courte et précise (< 15 mots)
- categorie : "relance" | "commercial" | "prix" | "marketing"
- explication : raison détaillée (1-2 phrases)
- priorite : "haute" | "normale"
- impact_estime : impact chiffré ou qualitatif (ex: "+15% chances de vente", "Récupère 2400€")
- suggestion_prix : uniquement pour catégorie "prix", sinon null

Format JSON strict.`,
      response_json_schema: {
        type: "object",
        properties: {
          recommandations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                categorie: { type: "string" },
                explication: { type: "string" },
                priorite: { type: "string" },
                impact_estime: { type: "string" },
                suggestion_prix: { type: "string" }
              }
            }
          },
          synthese_strategique: { type: "string" }
        }
      }
    });

    setRecommandations(res?.recommandations || []);
    setLoading(false);
  };

  const filtered = filter === "all" ? recommandations : recommandations.filter(r => r.categorie === filter);
  const categoryCounts = ["relance", "commercial", "prix", "marketing"].map(c => ({
    id: c,
    label: c.charAt(0).toUpperCase() + c.slice(1),
    count: recommandations.filter(r => r.categorie === c).length,
    style: CATEGORY_STYLES[c],
  }));

  return (
    <div className="space-y-4">
      {/* Generate button */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Recommandations IA Rounded</p>
            <p className="text-xs text-muted-foreground">Relances · Actions commerciales · Prix · Marketing</p>
          </div>
          <Button
            className="ml-auto rounded-full gap-2 h-9 text-sm"
            variant={recommandations.length > 0 ? "outline" : "default"}
            onClick={generate}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : recommandations.length > 0 ? <RefreshCw className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {recommandations.length > 0 ? "Régénérer" : "Générer les recommandations"}
          </Button>
        </div>

        {!recommandations.length && !loading && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground/15 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Cliquez pour générer 8 recommandations IA personnalisées</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Relances, ajustements prix, actions marketing, stratégie commerciale</p>
          </div>
        )}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-primary/40 mx-auto animate-spin mb-2" />
            <p className="text-xs text-muted-foreground animate-pulse">Rounded IA analyse votre portefeuille et génère des recommandations…</p>
          </div>
        )}
      </div>

      {/* Filters + Grid */}
      {recommandations.length > 0 && !loading && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === "all" ? "bg-primary text-white" : "bg-white border border-border/50 text-muted-foreground hover:text-foreground"}`}
            >
              Toutes ({recommandations.length})
            </button>
            {categoryCounts.filter(c => c.count > 0).map(c => {
              const Icon = c.style.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    filter === c.id ? `${c.style.color} border border-transparent` : "bg-white border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {c.label} ({c.count})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((rec, i) => (
              <RecommandationCard
                key={i}
                rec={rec}
                executed={executed.has(i)}
                onExecute={() => setExecuted(prev => new Set([...prev, i]))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}