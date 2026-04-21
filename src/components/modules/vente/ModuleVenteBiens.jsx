import { Badge } from "@/components/ui/badge";
import { Home, MapPin } from "lucide-react";

const STATUT_COLORS = {
  disponible: "bg-green-100 text-green-700",
  en_cours: "bg-blue-100 text-blue-700",
  vendu: "bg-slate-100 text-slate-600",
  loue: "bg-purple-100 text-purple-700",
};

export default function ModuleVenteBiens({ biens, contactMap, search }) {
  const filtered = biens.filter(b =>
    [b.titre, b.adresse].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  if (!filtered.length) return <Empty label="Aucun bien à vendre" />;

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prix</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Propriétaire</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {filtered.map(b => (
            <tr key={b.id} className="hover:bg-secondary/10 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg"><Home className="w-3.5 h-3.5 text-blue-500" /></div>
                  <div>
                    <p className="font-medium">{b.titre}</p>
                    {b.adresse && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{b.adresse}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-semibold">{b.prix ? b.prix.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[b.owner_id]?.nom || "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[b.statut] || "bg-secondary text-muted-foreground"}`}>
                  {b.statut || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">{label}</div>
  );
}