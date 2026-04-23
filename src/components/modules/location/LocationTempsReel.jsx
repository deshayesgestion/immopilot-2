import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle2, Clock, Euro, Home, TrendingUp, RefreshCw, Loader2, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function LocationTempsReel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  const load = async () => {
    setLoading(true);
    const [quittances, dossiers] = await Promise.all([
      base44.entities.Quittance.list("-created_date", 500),
      base44.entities.DossierLocatif.list("-created_date", 200),
    ]);
    const now = new Date();
    const fin30 = new Date(now.getTime() + 30 * 86400000);

    const loyersEnAttente = quittances.filter(q => q.statut === "en_attente");
    const loyersPayes = quittances.filter(q => q.statut === "paye");
    const loyersEnRetard = quittances.filter(q => q.statut === "en_retard" || q.statut === "impaye");
    const bailsEcheance = dossiers.filter(d => {
      if (!d.date_fin_bail) return false;
      const fin = new Date(d.date_fin_bail);
      return fin >= now && fin <= fin30;
    });
    const dossiersActifs = dossiers.filter(d => d.etape === "vie_bail");
    const encaisseTotal = loyersPayes.reduce((s, q) => s + (q.montant_total || 0), 0);
    const attenduTotal = [...loyersEnAttente, ...loyersEnRetard].reduce((s, q) => s + (q.montant_total || 0), 0);

    setData({ loyersEnAttente, loyersPayes, loyersEnRetard, bailsEcheance, dossiersActifs, encaisseTotal, attenduTotal, quittances, dossiers });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const analyseIA = async () => {
    if (!data) return;
    setAnalysing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es expert en gestion locative. Analyse cette situation et donne 3 recommandations prioritaires.
Dossiers actifs: ${data.dossiersActifs.length}
Loyers en attente: ${data.loyersEnAttente.length} (${data.attenduTotal.toLocaleString("fr-FR")}€)
Loyers payés ce mois: ${data.loyersPayes.length} (${data.encaisseTotal.toLocaleString("fr-FR")}€)
Retards/Impayés: ${data.loyersEnRetard.length}
Baux arrivant à échéance dans 30j: ${data.bailsEcheance.length}
Retourne JSON: { recommandations: [{ priorite: "haute"|"moyenne"|"faible", action: string (max 80 chars), detail: string (max 120 chars) }] }`,
      response_json_schema: {
        type: "object",
        properties: { recommandations: { type: "array", items: { type: "object" } } }
      }
    });
    setAiInsight(result?.recommandations || []);
    setAnalysing(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  const PRIO_COLOR = { haute: "bg-red-100 text-red-700 border-red-200", moyenne: "bg-amber-100 text-amber-700 border-amber-200", faible: "bg-blue-100 text-blue-700 border-blue-200" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Tableau de bord temps réel</h3>
          <p className="text-xs text-muted-foreground">Vue consolidée de la gestion locative</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={load}>
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={analyseIA} disabled={analysing}>
            {analysing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Analyse IA
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Dossiers actifs", value: data.dossiersActifs.length, icon: Home, color: "text-primary", bg: "bg-primary/10" },
          { label: "Encaissé (mois)", value: `${data.encaisseTotal.toLocaleString("fr-FR")} €`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "En attente", value: `${data.attenduTotal.toLocaleString("fr-FR")} €`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Retards/Impayés", value: data.loyersEnRetard.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-border/50 p-4">
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* IA Insights */}
      {aiInsight && aiInsight.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Recommandations IA</p>
          {aiInsight.map((r, i) => (
            <div key={i} className={`flex gap-3 p-3 rounded-xl border ${PRIO_COLOR[r.priorite] || PRIO_COLOR.faible}`}>
              <div className="flex-shrink-0 text-sm font-bold capitalize">{r.priorite}</div>
              <div>
                <p className="text-sm font-semibold">{r.action}</p>
                <p className="text-xs opacity-80 mt-0.5">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Impayés */}
      {data.loyersEnRetard.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-semibold">Retards & Impayés</p>
            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{data.loyersEnRetard.length}</span>
          </div>
          <div className="space-y-2">
            {data.loyersEnRetard.map(q => (
              <div key={q.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{q.locataire_nom}</p>
                  <p className="text-xs text-muted-foreground">{q.bien_titre} · Échéance : {fmt(q.date_echeance)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-red-600">{q.montant_total?.toLocaleString("fr-FR")} €</p>
                  <p className="text-[10px] text-red-500 capitalize">{q.statut?.replace("_", " ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Baux arrivant à échéance */}
      {data.bailsEcheance.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold">Baux arrivant à échéance (30j)</p>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{data.bailsEcheance.length}</span>
          </div>
          <div className="space-y-2">
            {data.bailsEcheance.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.locataire_nom}</p>
                  <p className="text-xs text-muted-foreground">{d.bien_titre}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-700">Fin le {fmt(d.date_fin_bail)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loyers en attente */}
      {data.loyersEnAttente.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold">Loyers en attente de paiement</p>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{data.loyersEnAttente.length}</span>
          </div>
          <div className="space-y-2">
            {data.loyersEnAttente.slice(0, 8).map(q => (
              <div key={q.id} className="flex items-center gap-3 p-2.5 bg-secondary/20 rounded-xl text-xs">
                <span className="flex-1 font-medium">{q.locataire_nom}</span>
                <span className="text-muted-foreground">{q.bien_titre}</span>
                <span className="font-bold">{q.montant_total?.toLocaleString("fr-FR")} €</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}