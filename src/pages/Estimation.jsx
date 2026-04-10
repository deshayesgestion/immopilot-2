import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Brain, ArrowRight, Loader2, TrendingUp, Home, Ruler, CheckCircle } from "lucide-react";
import AnimatedSection from "../components/AnimatedSection";
import { Link } from "react-router-dom";

export default function Estimation() {
  const [form, setForm] = useState({
    address: "",
    property_type: "",
    surface: "",
    rooms: "",
    condition: "",
    year_built: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Estime le prix immobilier pour ce bien en France. Réponds UNIQUEMENT avec le JSON demandé.
      
Bien: ${form.property_type}, ${form.surface}m², ${form.rooms} pièces, état: ${form.condition}, adresse: ${form.address}${form.year_built ? `, construit en ${form.year_built}` : ""}.

Donne une fourchette réaliste basée sur le marché français actuel.`,
      response_json_schema: {
        type: "object",
        properties: {
          estimated_min: { type: "number", description: "Prix minimum estimé en euros" },
          estimated_max: { type: "number", description: "Prix maximum estimé en euros" },
          price_per_sqm: { type: "number", description: "Prix moyen au m²" },
          factors: { type: "array", items: { type: "string" }, description: "Facteurs pris en compte (max 5)" },
          summary: { type: "string", description: "Résumé court de l'estimation en français" },
        },
      },
    });

    await base44.entities.Estimation.create({
      address: form.address,
      property_type: form.property_type,
      surface: Number(form.surface),
      rooms: Number(form.rooms),
      condition: form.condition,
      year_built: form.year_built ? Number(form.year_built) : undefined,
      estimated_min: response.estimated_min,
      estimated_max: response.estimated_max,
    });

    setResult(response);
    setLoading(false);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

  const conditionLabels = { neuf: "Neuf", renove: "Rénové", bon_etat: "Bon état", a_renover: "À rénover" };
  const typeLabels = { maison: "Maison", appartement: "Appartement", terrain: "Terrain" };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full mb-6">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-accent-foreground">Estimation par IA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Estimez votre bien
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Obtenez une estimation instantanée grâce à notre intelligence artificielle.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              Cette estimation est fournie à titre indicatif grâce à un modèle automatisé. Elle ne constitue pas une estimation officielle. Une validation par un agent immobilier est nécessaire.
            </p>
          </div>
        </AnimatedSection>

        {!result ? (
          <AnimatedSection delay={200}>
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/50 p-8 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Adresse du bien</label>
                <Input
                  required
                  placeholder="12 rue de la Paix, 75002 Paris"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type de bien</label>
                  <Select required value={form.property_type} onValueChange={(v) => handleChange("property_type", v)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maison">Maison</SelectItem>
                      <SelectItem value="appartement">Appartement</SelectItem>
                      <SelectItem value="terrain">Terrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Surface (m²)</label>
                  <Input
                    required
                    type="number"
                    placeholder="80"
                    value={form.surface}
                    onChange={(e) => handleChange("surface", e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nombre de pièces</label>
                  <Input
                    required
                    type="number"
                    placeholder="4"
                    value={form.rooms}
                    onChange={(e) => handleChange("rooms", e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">État du bien</label>
                  <Select required value={form.condition} onValueChange={(v) => handleChange("condition", v)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neuf">Neuf</SelectItem>
                      <SelectItem value="renove">Rénové</SelectItem>
                      <SelectItem value="bon_etat">Bon état</SelectItem>
                      <SelectItem value="a_renover">À rénover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Année de construction <span className="text-muted-foreground font-normal">(optionnel)</span>
                </label>
                <Input
                  type="number"
                  placeholder="1990"
                  value={form.year_built}
                  onChange={(e) => handleChange("year_built", e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full h-12 text-sm font-medium gap-2"
                disabled={loading || !form.address || !form.property_type || !form.surface || !form.rooms || !form.condition}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Estimation en cours...
                  </>
                ) : (
                  <>
                    Estimer mon bien
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </AnimatedSection>
        ) : (
          <AnimatedSection>
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
                <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">Estimation pour votre bien</p>
                <div className="text-3xl sm:text-4xl font-bold text-primary">
                  {formatPrice(result.estimated_min)} — {formatPrice(result.estimated_max)}
                </div>
                {result.price_per_sqm && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Prix moyen au m² : {formatPrice(result.price_per_sqm)}
                  </p>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border/50 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Home className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Résumé de votre bien</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-muted-foreground">Type</div>
                  <div className="font-medium">{typeLabels[form.property_type]}</div>
                  <div className="text-muted-foreground">Surface</div>
                  <div className="font-medium">{form.surface} m²</div>
                  <div className="text-muted-foreground">Pièces</div>
                  <div className="font-medium">{form.rooms}</div>
                  <div className="text-muted-foreground">État</div>
                  <div className="font-medium">{conditionLabels[form.condition]}</div>
                </div>
              </div>

              {result.factors?.length > 0 && (
                <div className="bg-card rounded-2xl border border-border/50 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Ruler className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Facteurs pris en compte</h3>
                  </div>
                  <div className="space-y-2">
                    {result.factors.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.summary && (
                <div className="bg-accent/50 rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/contact" className="flex-1">
                  <Button size="lg" className="w-full rounded-full h-12 text-sm font-medium gap-2">
                    Être contacté par un agent
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full h-12 text-sm font-medium"
                  onClick={() => { setResult(null); setForm({ address: "", property_type: "", surface: "", rooms: "", condition: "", year_built: "" }); }}
                >
                  Nouvelle estimation
                </Button>
              </div>
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}