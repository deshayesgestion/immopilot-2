import { TrendingUp, KeySquare, Users, FolderOpen } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function ProgressBar({ value, max, color = "bg-primary" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatRow({ label, value, sub, color = "text-foreground" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-right">
        <p className={`text-sm font-bold ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function CockpitPerformance({ data }) {
  const tauxConversion = data.totalLeads > 0
    ? Math.round((data.leadsQualifies / data.totalLeads) * 100)
    : 0;

  const tauxVenteFinalisee = data.ventesEnCours + data.ventesCloture > 0
    ? Math.round((data.ventesCloture / (data.ventesEnCours + data.ventesCloture)) * 100)
    : 0;

  const dureeMovDossier = data.dossiersTermines > 0
    ? Math.round(data.dureeTotaleDossiers / data.dossiersTermines)
    : 0;

  const caVente = data.caVente || 0;
  const caLocation = data.caLocation || 0;
  const caTotal = caVente + caLocation || 1;

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-border/40">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Performance commerciale</p>
      </div>

      {/* Taux conversion */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <p className="text-xs font-medium">Taux conversion leads → dossier</p>
          </div>
          <span className="text-sm font-bold text-purple-600">{tauxConversion}%</span>
        </div>
        <ProgressBar value={tauxConversion} max={100} color="bg-purple-500" />
        <p className="text-[11px] text-muted-foreground">{data.leadsQualifies} leads qualifiés / {data.totalLeads} total</p>
      </div>

      {/* Taux vente finalisée */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-xs font-medium">Taux vente finalisée</p>
          </div>
          <span className="text-sm font-bold text-blue-600">{tauxVenteFinalisee}%</span>
        </div>
        <ProgressBar value={tauxVenteFinalisee} max={100} color="bg-blue-500" />
        <p className="text-[11px] text-muted-foreground">{data.ventesCloture} clôturées / {data.ventesEnCours + data.ventesCloture} totales</p>
      </div>

      {/* Durée moyenne */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-xs font-medium">Durée moyenne dossier</p>
          </div>
          <span className="text-sm font-bold text-amber-600">{dureeMovDossier}j</span>
        </div>
        <ProgressBar value={Math.min(dureeMovDossier, 90)} max={90} color="bg-amber-500" />
        <p className="text-[11px] text-muted-foreground">{data.dossiersTermines} dossiers terminés analysés</p>
      </div>

      {/* Vente vs Location */}
      <div className="space-y-2 pt-2 border-t border-border/30">
        <p className="text-xs font-semibold">Performance Vente vs Location</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <p className="text-[11px] font-semibold text-blue-700">Vente</p>
            </div>
            <p className="text-base font-bold text-blue-600">{fmt(caVente)}</p>
            <p className="text-[10px] text-blue-500 mt-0.5">{Math.round((caVente / caTotal) * 100)}% du CA</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <KeySquare className="w-3 h-3 text-emerald-600" />
              <p className="text-[11px] font-semibold text-emerald-700">Location</p>
            </div>
            <p className="text-base font-bold text-emerald-600">{fmt(caLocation)}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">{Math.round((caLocation / caTotal) * 100)}% du CA</p>
          </div>
        </div>
      </div>
    </div>
  );
}