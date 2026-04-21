import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Home, MapPin, TrendingUp, KeySquare, Loader2 } from "lucide-react";

const TYPE_CONFIG = {
  vente: {
    label: "Vente",
    icon: TrendingUp,
    className: "bg-blue-100 text-blue-700",
  },
  location: {
    label: "Location",
    icon: KeySquare,
    className: "bg-emerald-100 text-emerald-700",
  },
};

const STATUT_COLORS = {
  disponible: "bg-green-100 text-green-700",
  en_cours: "bg-yellow-100 text-yellow-700",
  vendu: "bg-slate-100 text-slate-500",
  loue: "bg-purple-100 text-purple-700",
};

/**
 * BiensList — affiche tous les biens (ou un sous-ensemble) avec indicateur de type.
 * Props:
 *   filter?: "vente" | "location" | undefined  → filtre optionnel sur le type
 *   limit?: number (défaut 20)
 *   search?: string
 */
export default function BiensList({ filter, limit = 20, search = "" }) {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = filter
        ? await base44.entities.Bien.filter({ type: filter }, "-created_date", limit)
        : await base44.entities.Bien.list("-created_date", limit);
      setBiens(data);
      setLoading(false);
    };
    load();
  }, [filter, limit]);

  const filtered = search
    ? biens.filter(b =>
        [b.titre, b.adresse].some(v => v?.toLowerCase().includes(search.toLowerCase()))
      )
    : biens;

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 py-12 text-center text-sm text-muted-foreground">
        Aucun bien trouvé
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prix</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {filtered.map(b => {
            const typeConf = TYPE_CONFIG[b.type];
            const TypeIcon = typeConf?.icon;
            return (
              <tr key={b.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-secondary rounded-lg">
                      <Home className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{b.titre}</p>
                      {b.adresse && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{b.adresse}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {typeConf ? (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${typeConf.className}`}>
                      {TypeIcon && <TypeIcon className="w-3 h-3" />}
                      {typeConf.label}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{b.type || "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {b.prix ? b.prix.toLocaleString("fr-FR") + " €" : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[b.statut] || "bg-secondary text-muted-foreground"}`}>
                    {b.statut || "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}