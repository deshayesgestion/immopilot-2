import { Home, User, CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";

const STATUT_COLORS = {
  paye: "bg-green-100 text-green-700",
  en_attente: "bg-yellow-100 text-yellow-700",
  en_retard: "bg-red-100 text-red-600",
};
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
const STATUT_LABELS = {
  paye: "Payé",
  en_attente: "En attente",
  en_retard: "En retard",
};
const MODE_LABELS = {
  virement: "Virement",
  carte: "Carte",
  especes: "Espèces",
  cheque: "Chèque",
};
const MODULE_LINK = {
  loyer: "/admin/modules/location",
  commission: "/admin/modules/vente",
  frais: null,
};

export default function ModuleComptaPaiements({ paiements, contactMap, bienMap }) {
  if (!paiements.length) return <Empty label="Aucun paiement correspondant aux critères" />;

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Montant</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Échéance</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mode</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rapprochement</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Module</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {paiements.map(p => {
            const contact = contactMap[p.contact_id];
            const bien = bienMap[p.bien_id];
            const moduleLink = MODULE_LINK[p.type];
            return (
              <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{contact?.nom || <span className="text-muted-foreground italic">Non lié</span>}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {bien ? (
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[140px]">{bien.titre}</span>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[p.type] || "bg-secondary text-muted-foreground"}`}>
                    {TYPE_LABELS[p.type] || p.type || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">
                  {p.montant ? p.montant.toLocaleString("fr-FR") + " €" : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {p.date_echeance ? new Date(p.date_echeance).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[p.statut] || "bg-secondary text-muted-foreground"}`}>
                  {STATUT_LABELS[p.statut] || p.statut || "—"}
                </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                {MODE_LABELS[p.mode_paiement] || "—"}
                </td>
                <td className="px-4 py-3">
                {p.statut_rapprochement === "matche" ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Matché
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Circle className="w-3.5 h-3.5" /> Non matché
                  </span>
                )}
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
  );
}

function Empty({ label }) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}