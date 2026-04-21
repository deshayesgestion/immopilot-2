const STATUT_COLORS = {
  en_cours: "bg-blue-100 text-blue-700",
  signe: "bg-green-100 text-green-700",
  cloture: "bg-slate-100 text-slate-600",
  annule: "bg-red-100 text-red-600",
};

export default function ModuleVenteTransactions({ transactions, contactMap, bienMap, search }) {
  const filtered = transactions.filter(t => {
    const bien = bienMap[t.bien_id];
    const acheteur = contactMap[t.acheteur_id];
    return [bien?.titre, acheteur?.nom].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (!filtered.length) return <Empty label="Aucune transaction de vente" />;

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acheteur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vendeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prix</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Commission</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {filtered.map(t => (
            <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
              <td className="px-4 py-3 font-medium">{bienMap[t.bien_id]?.titre || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[t.acheteur_id]?.nom || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contactMap[t.vendeur_id]?.nom || "—"}</td>
              <td className="px-4 py-3 font-semibold">{t.prix ? t.prix.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.commission ? t.commission.toLocaleString("fr-FR") + " €" : "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[t.statut] || "bg-secondary text-muted-foreground"}`}>
                  {t.statut || "—"}
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
  return <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">{label}</div>;
}