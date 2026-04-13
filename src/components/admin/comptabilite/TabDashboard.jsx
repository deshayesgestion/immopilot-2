import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, AlertTriangle, Euro, Home, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function TabDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Transaction.list("-date_echeance", 200),
      base44.entities.Depense.list("-date", 200),
    ]).then(([t, d]) => { setTransactions(t); setDepenses(d); setLoading(false); });
  }, []);

  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const loyers = transactions.filter(t => t.type === "loyer" && t.statut === "paye" && t.date_paiement?.startsWith(thisMonth));
    const commissions = transactions.filter(t => t.type === "commission_vente" && t.statut === "paye" && t.date_paiement?.startsWith(thisMonth));
    const impayes = transactions.filter(t => t.statut === "en_retard");
    const charges = depenses.filter(d => d.date?.startsWith(thisMonth));
    return {
      revenus: loyers.reduce((s, t) => s + (t.montant || 0), 0) + commissions.reduce((s, t) => s + (t.montant || 0), 0),
      loyers: loyers.reduce((s, t) => s + (t.montant || 0), 0),
      impayes: impayes.reduce((s, t) => s + (t.montant || 0), 0),
      nbImpayes: impayes.length,
      charges: charges.reduce((s, d) => s + (d.montant || 0), 0),
      commissions: commissions.reduce((s, t) => s + (t.montant || 0), 0),
    };
  }, [transactions, depenses]);

  const chartData = useMemo(() => {
    const months = {};
    transactions.forEach(t => {
      const m = (t.date_paiement || t.date_echeance || "").substring(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { mois: m, entrees: 0, sorties: 0 };
      if (t.statut === "paye") months[m].entrees += t.montant || 0;
    });
    depenses.forEach(d => {
      const m = (d.date || "").substring(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { mois: m, entrees: 0, sorties: 0 };
      months[m].sorties += d.montant || 0;
    });
    return Object.values(months).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-6);
  }, [transactions, depenses]);

  const alertes = transactions.filter(t => t.statut === "en_retard").slice(0, 5);

  const analyserIA = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyse ces données financières immobilières et donne 3 insights concis:
Revenus ce mois: ${fmt(kpis.revenus)}
Loyers perçus: ${fmt(kpis.loyers)}
Impayés: ${fmt(kpis.impayes)} (${kpis.nbImpayes} dossiers)
Charges: ${fmt(kpis.charges)}
Commissions vente: ${fmt(kpis.commissions)}
Cashflow net: ${fmt(kpis.revenus - kpis.charges)}
Donne des recommandations actionnables en 3 points courts.`
    });
    setAiInsight(res);
    setAiLoading(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Revenus mensuels", value: fmt(kpis.revenus), icon: TrendingUp, color: "text-green-600" },
          { label: "Loyers perçus", value: fmt(kpis.loyers), icon: Home, color: "text-primary" },
          { label: "Impayés", value: fmt(kpis.impayes), icon: AlertTriangle, color: "text-red-500", sub: `${kpis.nbImpayes} dossier${kpis.nbImpayes > 1 ? "s" : ""}` },
          { label: "Charges", value: fmt(kpis.charges), icon: TrendingDown, color: "text-amber-600" },
          { label: "Commissions vente", value: fmt(kpis.commissions), icon: Euro, color: "text-purple-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`w-4 h-4 ${k.color}`} />
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            {k.sub && <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-sm font-semibold mb-4">Entrées / Sorties (6 mois)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
              <Bar dataKey="entrees" name="Entrées" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sorties" name="Sorties" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-sm font-semibold mb-4">Évolution cashflow</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData.map(d => ({ ...d, cashflow: d.entrees - d.sorties }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Area type="monotone" dataKey="cashflow" name="Cashflow" stroke="#10B981" fill="#D1FAE5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertes + IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {alertes.length > 0 && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Alertes impayés</p>
            {alertes.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{a.tiers_nom}</p>
                  <p className="text-xs text-muted-foreground">{a.bien_titre}</p>
                </div>
                <p className="text-sm font-bold text-red-600">{fmt(a.montant)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white rounded-2xl border border-primary/15 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Analyse IA</p>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1" onClick={analyserIA} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Analyser
            </Button>
          </div>
          {aiInsight ? (
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">{aiInsight}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Cliquez sur "Analyser" pour obtenir des insights IA sur vos finances.</p>
          )}
        </div>
      </div>
    </div>
  );
}