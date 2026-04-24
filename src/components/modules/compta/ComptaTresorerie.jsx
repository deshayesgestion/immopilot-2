import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, TrendingDown, Wallet, Calendar, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmtEur = n => (n || 0).toLocaleString("fr-FR") + " €";
const MOIS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];

function buildMoisData(paiements, quittances) {
  const now = new Date();
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entrees = paiements
      .filter(p => p.statut === "paye" && p.date_paiement?.startsWith(key))
      .reduce((s, p) => s + (p.montant || 0), 0)
      + quittances
      .filter(q => q.statut === "paye" && q.date_paiement?.startsWith(key))
      .reduce((s, q) => s + (q.montant_total || 0), 0);
    data.push({ mois: MOIS[d.getMonth()], entrees: Math.round(entrees), sorties: 0 });
  }
  // Prévisionnel 3 mois
  const moyenneEntrees = data.reduce((s, d) => s + d.entrees, 0) / Math.max(1, data.filter(d => d.entrees > 0).length);
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    data.push({ mois: MOIS[d.getMonth()] + " ▸", entrees: 0, previsionnel: Math.round(moyenneEntrees), sorties: 0 });
  }
  return data;
}

export default function ComptaTresorerie({ paiements, quittances, transactions }) {
  const chartData = useMemo(() => buildMoisData(paiements, quittances), [paiements, quittances]);

  const soldeActuel = paiements.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0)
    + quittances.filter(q => q.statut === "paye").reduce((s, q) => s + (q.montant_total || 0), 0);

  const entrantsMois = chartData[5]?.entrees || 0;
  const previsionnel = chartData[6]?.previsionnel || 0;

  const attenteTotal = paiements.filter(p => p.statut === "en_attente").reduce((s, p) => s + (p.montant || 0), 0)
    + quittances.filter(q => q.statut === "en_attente").reduce((s, q) => s + (q.montant_total || 0), 0);

  return (
    <div className="space-y-4">
      {/* KPIs trésorerie */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Solde disponible", value: fmtEur(soldeActuel), icon: Wallet, bg: "bg-emerald-50", color: "text-emerald-600", border: "border-emerald-100" },
          { label: "Encaissé ce mois", value: fmtEur(entrantsMois), icon: TrendingUp, bg: "bg-blue-50", color: "text-blue-600", border: "border-blue-100" },
          { label: "Prévisionnel M+1", value: fmtEur(previsionnel), icon: Calendar, bg: "bg-violet-50", color: "text-violet-600", border: "border-violet-100" },
          { label: "En attente", value: fmtEur(attenteTotal), icon: TrendingDown, bg: "bg-amber-50", color: "text-amber-600", border: "border-amber-100" },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className={`bg-white rounded-2xl border ${k.border} p-4`}>
              <div className={`inline-flex p-1.5 rounded-lg ${k.bg} mb-2`}><Icon className={`w-4 h-4 ${k.color}`} /></div>
              <p className="text-xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Graphe flux */}
      <div className="bg-white rounded-2xl border border-border/50 p-5">
        <p className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Cash-flow — 6 mois réels + 3 mois prévisionnels
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip formatter={v => fmtEur(v)} />
            <Area type="monotone" dataKey="entrees" stroke="#4F46E5" fill="#EEF2FF" strokeWidth={2} name="Encaissé" />
            <Area type="monotone" dataKey="previsionnel" stroke="#10b981" fill="#ecfdf5" strokeWidth={2} strokeDasharray="6 3" name="Prévisionnel" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Flux entrants/sortants par source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <p className="text-sm font-semibold mb-3">Flux entrants par type</p>
          <div className="space-y-2">
            {[
              { label: "Loyers", val: paiements.filter(p => p.type === "loyer" && p.statut === "paye").reduce((s,p) => s+(p.montant||0),0), color: "bg-blue-500" },
              { label: "Commissions vente", val: paiements.filter(p => p.type === "commission" && p.statut === "paye").reduce((s,p) => s+(p.montant||0),0), color: "bg-purple-500" },
              { label: "Quittances", val: quittances.filter(q => q.statut === "paye").reduce((s,q) => s+(q.montant_total||0),0), color: "bg-emerald-500" },
              { label: "Frais", val: paiements.filter(p => p.type === "frais" && p.statut === "paye").reduce((s,p) => s+(p.montant||0),0), color: "bg-amber-500" },
            ].map(r => {
              const pct = soldeActuel > 0 ? Math.round((r.val / soldeActuel) * 100) : 0;
              return (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-semibold">{fmtEur(r.val)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-5">
          <p className="text-sm font-semibold mb-3">Prévisions loyers M+1 à M+3</p>
          {quittances.filter(q => q.statut === "en_attente").length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune quittance en attente</p>
          ) : (
            <div className="space-y-2">
              {quittances.filter(q => q.statut === "en_attente").slice(0, 6).map(q => (
                <div key={q.id} className="flex items-center justify-between px-3 py-2 bg-secondary/20 rounded-xl">
                  <div>
                    <p className="text-xs font-medium">{q.locataire_nom || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{q.bien_titre || "—"} · {q.mois_label || q.mois}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-700">{fmtEur(q.montant_total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}