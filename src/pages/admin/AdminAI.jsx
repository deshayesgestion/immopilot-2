import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Sparkles, FileText, TrendingUp, Loader2, Copy, CheckCircle, AlertTriangle } from "lucide-react";

const tools = [
  { id: "estimation", label: "Estimation IA", icon: TrendingUp, desc: "Estimez la valeur d'un bien" },
  { id: "description", label: "Génération d'annonce", icon: FileText, desc: "Rédigez une annonce automatiquement" },
  { id: "scoring", label: "Scoring de lead", icon: Brain, desc: "Évaluez la qualité d'un prospect" },
];

export default function AdminAI() {
  const [activeTool, setActiveTool] = useState("estimation");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [estForm, setEstForm] = useState({ address: "", property_type: "appartement", surface: "", rooms: "", condition: "bon_etat", year_built: "" });
  const [descForm, setDescForm] = useState({ title: "", type: "appartement", surface: "", rooms: "", city: "", features: "", price: "" });
  const [scoreForm, setScoreForm] = useState({ name: "", type: "acheteur", budget_min: "", budget_max: "", notes: "" });

  const setE = (k, v) => setEstForm((p) => ({ ...p, [k]: v }));
  const setD = (k, v) => setDescForm((p) => ({ ...p, [k]: v }));
  const setS = (k, v) => setScoreForm((p) => ({ ...p, [k]: v }));

  const formatPrice = (p) => p ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p) : "";

  const handleEstimation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert immobilier français. Estime la valeur de ce bien:
Type: ${estForm.property_type}, Surface: ${estForm.surface}m², Pièces: ${estForm.rooms}, État: ${estForm.condition}, Adresse: ${estForm.address}${estForm.year_built ? `, Construit en ${estForm.year_built}` : ""}
Donne une estimation réaliste et précise basée sur le marché immobilier français actuel.`,
      response_json_schema: {
        type: "object",
        properties: {
          estimated_min: { type: "number" },
          estimated_max: { type: "number" },
          price_per_sqm: { type: "number" },
          confidence: { type: "string", enum: ["faible", "moyenne", "haute"] },
          factors: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
        }
      }
    });
    setResult({ type: "estimation", data: r });
    setLoading(false);
  };

  const handleDescription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en rédaction immobilière. Rédige une annonce immobilière premium, séduisante et professionnelle pour ce bien:
Titre: ${descForm.title}
Type: ${descForm.type}, Surface: ${descForm.surface}m², Pièces: ${descForm.rooms}, Ville: ${descForm.city}
Prix: ${descForm.price}€, Équipements: ${descForm.features}

Rédige une description accrocheuse et détaillée de 200-300 mots. Inclus un titre accrocheur, les points forts du bien, et un appel à l'action. Style moderne et premium.`,
    });
    setResult({ type: "description", data: r });
    setLoading(false);
  };

  const handleScoring = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert CRM immobilier. Analyse et score ce prospect:
Nom: ${scoreForm.name}, Type: ${scoreForm.type}
Budget: ${scoreForm.budget_min}€ - ${scoreForm.budget_max}€
Notes: ${scoreForm.notes}

Évalue la qualité de ce lead pour une agence immobilière française.`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number", description: "Score de 0 à 100" },
          niveau: { type: "string", enum: ["faible", "moyen", "bon", "excellent"] },
          points_forts: { type: "array", items: { type: "string" } },
          points_faibles: { type: "array", items: { type: "string" } },
          recommandation: { type: "string" },
          priorite: { type: "string", enum: ["basse", "normale", "haute", "urgente"] },
        }
      }
    });
    setResult({ type: "scoring", data: r });
    setLoading(false);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prioriteColors = { basse: "text-gray-600", normale: "text-blue-600", haute: "text-orange-600", urgente: "text-red-600" };
  const scoreColor = (s) => s >= 75 ? "text-green-600" : s >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Module IA
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Intelligence artificielle au service de votre agence</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id); setResult(null); }}
            className={`p-4 rounded-2xl border text-left transition-all ${activeTool === tool.id ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-border/50 hover:border-primary/30"}`}
          >
            <tool.icon className={`w-5 h-5 mb-2 ${activeTool === tool.id ? "text-white" : "text-primary"}`} />
            <p className="text-sm font-semibold">{tool.label}</p>
            <p className={`text-xs mt-0.5 ${activeTool === tool.id ? "text-white/70" : "text-muted-foreground"}`}>{tool.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border/50 p-6">
          {activeTool === "estimation" && (
            <form onSubmit={handleEstimation} className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Paramètres d'estimation</h2>
              <Input required placeholder="Adresse du bien" value={estForm.address} onChange={(e) => setE("address", e.target.value)} className="rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={estForm.property_type} onValueChange={(v) => setE("property_type", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appartement">Appartement</SelectItem>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={estForm.condition} onValueChange={(v) => setE("condition", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neuf">Neuf</SelectItem>
                    <SelectItem value="renove">Rénové</SelectItem>
                    <SelectItem value="bon_etat">Bon état</SelectItem>
                    <SelectItem value="a_renover">À rénover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input required type="number" placeholder="Surface (m²)" value={estForm.surface} onChange={(e) => setE("surface", e.target.value)} className="rounded-xl" />
                <Input required type="number" placeholder="Pièces" value={estForm.rooms} onChange={(e) => setE("rooms", e.target.value)} className="rounded-xl" />
                <Input type="number" placeholder="Année" value={estForm.year_built} onChange={(e) => setE("year_built", e.target.value)} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                Estimer avec l'IA
              </Button>
            </form>
          )}

          {activeTool === "description" && (
            <form onSubmit={handleDescription} className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Générer une annonce</h2>
              <Input required placeholder="Titre du bien" value={descForm.title} onChange={(e) => setD("title", e.target.value)} className="rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={descForm.type} onValueChange={(v) => setD("type", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appartement">Appartement</SelectItem>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
                <Input required placeholder="Ville" value={descForm.city} onChange={(e) => setD("city", e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input required type="number" placeholder="Surface" value={descForm.surface} onChange={(e) => setD("surface", e.target.value)} className="rounded-xl" />
                <Input required type="number" placeholder="Pièces" value={descForm.rooms} onChange={(e) => setD("rooms", e.target.value)} className="rounded-xl" />
                <Input type="number" placeholder="Prix (€)" value={descForm.price} onChange={(e) => setD("price", e.target.value)} className="rounded-xl" />
              </div>
              <Textarea placeholder="Équipements (parking, jardin, terrasse...)" value={descForm.features} onChange={(e) => setD("features", e.target.value)} className="rounded-xl resize-none" />
              <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Générer l'annonce
              </Button>
            </form>
          )}

          {activeTool === "scoring" && (
            <form onSubmit={handleScoring} className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Scorer un lead</h2>
              <Input required placeholder="Nom du prospect" value={scoreForm.name} onChange={(e) => setS("name", e.target.value)} className="rounded-xl" />
              <Select value={scoreForm.type} onValueChange={(v) => setS("type", v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["acheteur","vendeur","locataire","bailleur"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Budget min (€)" value={scoreForm.budget_min} onChange={(e) => setS("budget_min", e.target.value)} className="rounded-xl" />
                <Input type="number" placeholder="Budget max (€)" value={scoreForm.budget_max} onChange={(e) => setS("budget_max", e.target.value)} className="rounded-xl" />
              </div>
              <Textarea required placeholder="Notes sur le prospect, ses besoins, son comportement..." value={scoreForm.notes} onChange={(e) => setS("notes", e.target.value)} className="rounded-xl resize-none min-h-[100px]" />
              <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                Analyser le lead
              </Button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-6">
          <h2 className="font-semibold mb-4">Résultat IA</h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">L'IA analyse...</p>
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Brain className="w-10 h-10 opacity-20" />
              <p className="text-sm">Lancez une analyse pour voir les résultats ici</p>
            </div>
          ) : result.type === "estimation" ? (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Fourchette estimée</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(result.data.estimated_min)} — {formatPrice(result.data.estimated_max)}
                </p>
                {result.data.price_per_sqm && <p className="text-xs text-muted-foreground mt-1">{formatPrice(result.data.price_per_sqm)}/m²</p>}
                <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-medium ${result.data.confidence === "haute" ? "bg-green-100 text-green-700" : result.data.confidence === "moyenne" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  Confiance : {result.data.confidence}
                </span>
              </div>
              {result.data.factors && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Facteurs</p>
                  {result.data.factors.map((f, i) => <p key={i} className="text-sm flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />{f}</p>)}
                </div>
              )}
              {result.data.recommendation && <p className="text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3">{result.data.recommendation}</p>}
            </div>
          ) : result.type === "description" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Annonce générée</p>
                <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => copyText(result.data)}>
                  {copied ? <><CheckCircle className="w-3.5 h-3.5 text-green-600" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">{result.data}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Score du lead</p>
                <p className={`text-5xl font-bold ${scoreColor(result.data.score)}`}>{result.data.score}<span className="text-2xl">/100</span></p>
                <p className="text-sm font-medium mt-1">{result.data.niveau} · Priorité <span className={prioriteColors[result.data.priorite]}>{result.data.priorite}</span></p>
              </div>
              {result.data.points_forts?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Points forts</p>
                  {result.data.points_forts.map((p, i) => <p key={i} className="text-sm text-muted-foreground flex gap-2 items-start"><CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />{p}</p>)}
                </div>
              )}
              {result.data.points_faibles?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Points faibles</p>
                  {result.data.points_faibles.map((p, i) => <p key={i} className="text-sm text-muted-foreground flex gap-2 items-start"><AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />{p}</p>)}
                </div>
              )}
              {result.data.recommandation && <p className="text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3">{result.data.recommandation}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}