const STATUT_COLORS = {
  paye: "bg-green-100 text-green-700",
  en_attente: "bg-yellow-100 text-yellow-700",
  en_retard: "bg-red-100 text-red-600",
};

export default function ModuleComptaCommissions({ commissions, contactMap, bienMap, search }) {
  const filtered = commissions.filter(p => {
    const contact = contactMap[p.contact_id];
    return [contact?.nom].some(v => v?.toLowerCase().includes(search.toLowerCase()));
  });

  const total = filtered.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0);

  if (!filtered.length) return <Empty label="Aucune commission" />;

  return (
    <div className="space-y-3">
      <div className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 text-sm text-purple-800">
        Total commissions encaissées : <span className="font-bold">{total.toLocaleString("fr-FR")} €</span>
      </div>
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date paiement</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-4 py-3 font-medium">{contactMap[p.contact_id]?.nom || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{bienMap[p.bien_id]?.titre || "—"}</td>
                <td className="px-4 py-3 font-semibold">{p.montant ? p.montant.toLocaleString("fr-FR") + " €" : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[p.statut] || "bg-secondary text-muted-foreground"}`}>{p.statut}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Empty({ label }) {
  return <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">{label}</div>;
}