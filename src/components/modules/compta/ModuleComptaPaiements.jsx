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

export default function ModuleComptaPaiements({ paiements, contactMap, bienMap, search }) {
  const filtered = paiements.filter(p => {
    const contact = contactMap[p.contact_id];
    return [contact?.nom, p.type].some(v => v?.toLowerCase().includes(search.toLowerCase()));
  });

  if (!filtered.length) return <Empty label="Aucun paiement" />;

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Montant</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Échéance</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {filtered.map(p => (
            <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
              <td className="px-4 py-3 font-medium">{contactMap[p.contact_id]?.nom || "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[p.type] || "bg-secondary text-muted-foreground"}`}>{p.type}</span>
              </td>
              <td className="px-4 py-3 font-semibold">{p.montant ? p.montant.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.date_echeance ? new Date(p.date_echeance).toLocaleDateString("fr-FR") : "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[p.statut] || "bg-secondary text-muted-foreground"}`}>{p.statut}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ label }) {
  return <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">{label}</div>;
}