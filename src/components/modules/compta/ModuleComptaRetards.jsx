import { AlertCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";

const TYPE_COLORS = {
  loyer: "bg-blue-100 text-blue-700",
  commission: "bg-purple-100 text-purple-700",
  frais: "bg-slate-100 text-slate-600",
};
const TYPE_LABELS = {
  loyer: "Loyer",
  commission: "Commission",
  frais: "Frais",
};
const MODULE_LINK = {
  loyer: "/admin/modules/location",
  commission: "/admin/modules/vente",
};

export default function ModuleComptaRetards({ retards, contactMap, bienMap }) {
  if (!retards.length) return (
    <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-sm text-green-600 font-medium">
      ✅ Aucun retard de paiement
    </div>
  );

  const total = retards.reduce((s, p) => s + (p.montant || 0), 0);

  return (
    <div className="space-y-3">
      <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-red-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
        <span>
          <span className="font-bold">{retards.length}</span> paiement(s) en retard —
          Total dû : <span className="font-bold">{total.toLocaleString("fr-FR")} €</span>
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Échéance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Retard</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Module</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {retards.map(p => {
              const contact = contactMap[p.contact_id];
              const bien = bienMap[p.bien_id];
              const echeance = p.date_echeance ? new Date(p.date_echeance) : null;
              const joursRetard = echeance ? Math.max(0, Math.floor((new Date() - echeance) / (1000 * 60 * 60 * 24))) : null;
              const moduleLink = MODULE_LINK[p.type];
              return (
                <tr key={p.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{contact?.nom || <span className="text-muted-foreground italic">Non lié</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bien ? (
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[130px]">{bien.titre}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[p.type] || "bg-secondary text-muted-foreground"}`}>
                      {TYPE_LABELS[p.type] || p.type || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-red-600">
                    {p.montant ? p.montant.toLocaleString("fr-FR") + " €" : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {echeance ? echeance.toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {joursRetard != null && joursRetard > 0 ? (
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${joursRetard > 30 ? "bg-red-200 text-red-800" : "bg-red-100 text-red-700"}`}>
                        {joursRetard}j
                      </span>
                    ) : <span className="text-xs text-muted-foreground">Nouveau</span>}
                  </td>
                  <td className="px-4 py-3">
                    {moduleLink ? (
                      <Link to={moduleLink} className="text-xs text-primary hover:underline">
                        {p.type === "loyer" ? "Location →" : "Vente →"}
                      </Link>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}