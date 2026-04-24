import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, Loader2, Zap, AlertTriangle, Link2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmtEur = n => (n || 0).toLocaleString("fr-FR") + " €";
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const STATUT_CFG = {
  matche:    { label: "Rapproché ✓",  cls: "bg-green-100 text-green-700 border-green-200" },
  propose:   { label: "À valider",    cls: "bg-amber-100 text-amber-700 border-amber-200" },
  non_matche:{ label: "Non rapproché",cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function ComptaRapprochement({ paiements, quittances, contactMap, bienMap, onUpdate }) {
  const [matching, setMatching] = useState(false);
  const [filter, setFilter] = useState("all");

  // Construire liste unifiée paiements + quittances
  const allItems = [
    ...paiements.map(p => ({
      ...p,
      _source: "paiement",
      _label: `${contactMap[p.contact_id]?.nom || "?"} — ${p.type}`,
      _montant: p.montant,
      _date: p.date_echeance || p.created_date,
      _statut_rapproch: p.statut_rapprochement || "non_matche",
    })),
    ...quittances.map(q => ({
      ...q,
      _source: "quittance",
      _label: `${q.locataire_nom || "?"} — Loyer ${q.mois_label || q.mois}`,
      _montant: q.montant_total,
      _date: q.date_echeance || q.created_date,
      _statut_rapproch: q.statut_rapprochement || (q.statut === "paye" ? "matche" : "non_matche"),
    })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date));

  const filtered = filter === "all" ? allItems : allItems.filter(i => i._statut_rapproch === filter);

  const stats = {
    matche: allItems.filter(i => i._statut_rapproch === "matche").length,
    propose: allItems.filter(i => i._statut_rapproch === "propose").length,
    non_matche: allItems.filter(i => i._statut_rapproch === "non_matche").length,
  };

  const lancerRapprochementIA = async () => {
    setMatching(true);
    // Identifier les non-rapprochés et proposer un matching par montant/nom
    const nonMatches = paiements.filter(p => !p.statut_rapprochement || p.statut_rapprochement === "non_matche");

    for (const p of nonMatches.slice(0, 20)) {
      // Chercher quittance correspondante
      const match = quittances.find(q =>
        Math.abs((q.montant_total || 0) - (p.montant || 0)) < 10 &&
        q.statut !== "paye" &&
        (!q.statut_rapprochement || q.statut_rapprochement === "non_matche")
      );
      if (match) {
        await base44.entities.Paiement.update(p.id, { statut_rapprochement: "propose" });
      }
    }
    setMatching(false);
    onUpdate?.();
  };

  const validerRapprochement = async (item) => {
    if (item._source === "paiement") {
      await base44.entities.Paiement.update(item.id, { statut_rapprochement: "matche" });
    } else {
      await base44.entities.Quittance.update(item.id, { statut_rapprochement: "matche" });
    }
    onUpdate?.();
  };

  const tauxRapprochement = allItems.length > 0
    ? Math.round((stats.matche / allItems.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header + stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "matche",     label: "Rapprochés",     color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
          { key: "propose",    label: "À valider",      color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { key: "non_matche", label: "Non rapprochés", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={`bg-white rounded-2xl border ${s.border} p-4 text-left transition-all ${filter === s.key ? "ring-2 ring-primary/30" : "hover:shadow-sm"}`}>
            <p className={`text-2xl font-black ${s.color}`}>{stats[s.key]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Barre progression */}
      <div className="bg-white rounded-2xl border border-border/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Taux de rapprochement</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{tauxRapprochement}%</span>
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1.5" onClick={lancerRapprochementIA} disabled={matching}>
              {matching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              {matching ? "Analyse…" : "Rapprocher IA"}
            </Button>
          </div>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${tauxRapprochement}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {stats.matche} / {allItems.length} transactions rapprochées
        </p>
      </div>

      {/* Filtre */}
      <div className="flex gap-1">
        {[
          { id: "all", label: "Tous" },
          { id: "propose", label: "⚡ À valider" },
          { id: "non_matche", label: "Non rapprochés" },
          { id: "matche", label: "Rapprochés" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f.id ? "bg-primary text-white" : "bg-white border border-border/50 text-muted-foreground hover:text-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste transactions */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">Aucune transaction dans cette catégorie</div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.slice(0, 50).map((item, i) => {
              const cfg = STATUT_CFG[item._statut_rapproch] || STATUT_CFG.non_matche;
              return (
                <div key={`${item._source}-${item.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/10 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item._source === "quittance" ? "bg-blue-50" : "bg-purple-50"}`}>
                    <Link2 className={`w-3.5 h-3.5 ${item._source === "quittance" ? "text-blue-500" : "text-purple-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item._label}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDate(item._date)} · {item._source === "quittance" ? "Quittance" : `Paiement ${item.type || ""}`}</p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0">{fmtEur(item._montant)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                  {item._statut_rapproch === "propose" && (
                    <Button size="sm" className="h-6 text-[10px] rounded-full px-2 gap-1 bg-green-500 hover:bg-green-600 flex-shrink-0" onClick={() => validerRapprochement(item)}>
                      <CheckCircle2 className="w-3 h-3" /> Valider
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}