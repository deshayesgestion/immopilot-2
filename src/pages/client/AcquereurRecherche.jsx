import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Home, Loader2, MapPin, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function AcquereurRecherche() {
  const [acquereur, setAcquereur] = useState(null);
  const [matchedProps, setMatchedProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiAdvice, setAiAdvice] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const acqs = await base44.entities.Acquereur.filter({ email: me.email }, "-created_date", 1);
      const acq = acqs[0] || null;
      setAcquereur(acq);
      if (acq) {
        const props = await base44.entities.Property.filter({ transaction: "vente", status: "disponible" }, "-created_date", 50);
        const matched = props.filter(p => {
          if (acq.budget_max && p.price > acq.budget_max) return false;
          if (acq.budget_min && p.price < acq.budget_min) return false;
          if (acq.surface_min && p.surface < acq.surface_min) return false;
          if (acq.localisations?.length > 0 && !acq.localisations.some(loc => p.city?.toLowerCase().includes(loc.toLowerCase()))) return false;
          return true;
        });
        setMatchedProps(matched);
      }
      setLoading(false);
    };
    load();
  }, []);

  const getAIAdvice = async () => {
    if (!acquereur) return;
    setLoadingAI(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un conseiller immobilier. Un acquéreur cherche un bien avec ces critères : budget max ${fmt(acquereur.budget_max)}, surface min ${acquereur.surface_min}m², localisations : ${(acquereur.localisations || []).join(", ")}. Financement validé : ${acquereur.financement_valide ? "oui" : "non"}. Donne 3 conseils personnalisés en français, courts et pratiques.`
    });
    setAiAdvice(res);
    setLoadingAI(false);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ma recherche</h1>
        <p className="text-sm text-muted-foreground mt-1">Biens correspondant à vos critères</p>
      </div>

      {/* Critères */}
      {acquereur && (
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <p className="text-sm font-semibold mb-3">Mes critères de recherche</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Budget max", value: fmt(acquereur.budget_max) },
              { label: "Budget min", value: fmt(acquereur.budget_min) },
              { label: "Surface min", value: acquereur.surface_min ? `${acquereur.surface_min}m²` : "—" },
              { label: "Financement", value: acquereur.financement_valide ? "Validé ✓" : "En cours" },
            ].map((c) => (
              <div key={c.label} className="bg-secondary/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-sm font-semibold mt-0.5">{c.value}</p>
              </div>
            ))}
          </div>
          {acquereur.localisations?.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {acquereur.localisations.map((loc, i) => (
                <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{loc}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI advice */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> Conseils IA</p>
          <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={getAIAdvice} disabled={loadingAI || !acquereur}>
            {loadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Obtenir des conseils
          </Button>
        </div>
        {aiAdvice ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiAdvice}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Cliquez pour obtenir des conseils personnalisés de notre IA.</p>
        )}
      </div>

      {/* Matched properties */}
      <div>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" /> {matchedProps.length} bien{matchedProps.length > 1 ? "s" : ""} correspondant{matchedProps.length > 1 ? "s" : ""}
        </p>
        {matchedProps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
            <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun bien ne correspond à vos critères actuellement</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {matchedProps.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-border/50 overflow-hidden hover:shadow-sm transition-all">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-36 object-cover" />}
                <div className="p-4">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-lg font-bold text-purple-600">{fmt(p.price)}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{p.surface}m²</span>
                      <span>·</span>
                      <span>{p.rooms}p</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}