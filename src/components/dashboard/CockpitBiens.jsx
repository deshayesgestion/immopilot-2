import { Link } from "react-router-dom";
import { Home, TrendingUp, KeySquare, MapPin, ArrowUpRight } from "lucide-react";

const fmt = (n) => n ? n.toLocaleString("fr-FR") + " €" : "—";

const STATUT_COLORS = {
  disponible: "bg-green-100 text-green-700",
  en_cours: "bg-amber-100 text-amber-700",
  vendu: "bg-slate-100 text-slate-600",
  loue: "bg-blue-100 text-blue-700",
};

export default function CockpitBiens({ data }) {
  const biens = data.biens || [];
  const byType = {
    vente: biens.filter(b => b.type === "vente"),
    location: biens.filter(b => b.type === "location"),
  };
  const biensInactifs = biens.filter(b => b.statut === "disponible" &&
    new Date(b.updated_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Vue Biens</p>
        </div>
        <Link to="/admin/modules/biens" className="text-xs text-primary hover:underline flex items-center gap-1">
          Gérer <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Répartition vente / location */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-xs font-semibold text-blue-700">Vente</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{byType.vente.length}</p>
          <div className="space-y-0.5 mt-1">
            {["disponible","en_cours","vendu"].map(s => (
              <div key={s} className="flex justify-between">
                <p className="text-[11px] text-blue-500 capitalize">{s.replace("_"," ")}</p>
                <p className="text-[11px] font-semibold text-blue-600">{byType.vente.filter(b => b.statut === s).length}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <KeySquare className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700">Location</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{byType.location.length}</p>
          <div className="space-y-0.5 mt-1">
            {["disponible","en_cours","loue"].map(s => (
              <div key={s} className="flex justify-between">
                <p className="text-[11px] text-emerald-500 capitalize">{s.replace("_"," ")}</p>
                <p className="text-[11px] font-semibold text-emerald-600">{byType.location.filter(b => b.statut === s).length}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Biens récents actifs */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Derniers biens actifs</p>
        <div className="space-y-1.5">
          {biens.filter(b => b.statut === "disponible").slice(0, 5).map(b => (
            <div key={b.id} className="flex items-center gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.type === "vente" ? "bg-blue-500" : "bg-emerald-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{b.titre}</p>
                {b.adresse && <p className="text-[11px] text-muted-foreground truncate">{b.adresse}</p>}
              </div>
              <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">{fmt(b.prix)}</span>
            </div>
          ))}
          {biens.filter(b => b.statut === "disponible").length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">Aucun bien disponible</p>
          )}
        </div>
      </div>

      {/* Biens inactifs */}
      {biensInactifs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">
            ⚠️ {biensInactifs.length} bien{biensInactifs.length > 1 ? "s" : ""} sans activité depuis +30j
          </p>
          <div className="space-y-1">
            {biensInactifs.slice(0, 3).map(b => (
              <p key={b.id} className="text-[11px] text-amber-600 truncate">· {b.titre}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}