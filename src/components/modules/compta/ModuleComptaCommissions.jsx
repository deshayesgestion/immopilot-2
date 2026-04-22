import { Home, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const STATUT_COLORS = {
  paye: "bg-green-100 text-green-700",
  en_attente: "bg-yellow-100 text-yellow-700",
  en_retard: "bg-red-100 text-red-600",
};
const STATUT_LABELS = {
  paye: "Payé",
  en_attente: "En attente",
  en_retard: "En retard",
};

export default function ModuleComptaCommissions({ commissions, contactMap, bienMap }) {
  if (!commissions.length) return <Empty label="Aucune commission correspondant aux critères" />;

  const totalEncaisse = commissions.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);
  const totalAttente = commissions.filter(p => p.statut === "en_attente").reduce((s, p) => s + (p.montant || 0), 0);

  return (
    <div className="space-y-3">
      {/* Résumé commissions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-purple-600 mb-1">Commissions encaissées</p>
          <p className="text-lg font-bold text-purple-800">{totalEncaisse.toLocaleString("fr-FR")} €</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-yellow-600 mb-1">Commissions en attente</p>
          <p className="text-lg font-bold text-yellow-800">{totalAttente.toLocaleString("fr-FR")} €</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Échéance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date paiement</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Module</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {commissions.map(p => {
              const contact = contactMap[p.contact_id];
              const bien = bienMap[p.bien_id];
              return (
                <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3 font-medium">{contact?.nom || <span className="text-muted-foreground italic">Non lié</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bien ? (
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{bien.titre}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.montant ? p.montant.toLocaleString("fr-FR") + " €" : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {p.date_echeance ? new Date(p.date_echeance).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[p.statut] || "bg-secondary text-muted-foreground"}`}>
                      {STATUT_LABELS[p.statut] || p.statut || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/admin/modules/vente" className="text-xs text-primary hover:underline">
                      Vente →
                    </Link>
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

function Empty({ label }) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}