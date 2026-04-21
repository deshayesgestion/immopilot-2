import { AlertCircle } from "lucide-react";

export default function ModuleComptaRetards({ retards, contactMap, bienMap, search }) {
  const filtered = retards.filter(p => {
    const contact = contactMap[p.contact_id];
    return [contact?.nom, p.type].some(v => v?.toLowerCase().includes(search.toLowerCase()));
  });

  const total = filtered.reduce((s, p) => s + (p.montant || 0), 0);

  if (!filtered.length) return (
    <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-sm text-green-600 font-medium">
      ✅ Aucun retard de paiement
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-red-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span><span className="font-bold">{filtered.length}</span> paiement(s) en retard — Total : <span className="font-bold">{total.toLocaleString("fr-FR")} €</span></span>
      </div>
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Échéance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Retard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.map(p => {
              const echeance = p.date_echeance ? new Date(p.date_echeance) : null;
              const joursRetard = echeance ? Math.floor((new Date() - echeance) / (1000 * 60 * 60 * 24)) : null;
              return (
                <tr key={p.id} className="hover:bg-red-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{contactMap[p.contact_id]?.nom || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{p.type}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">{p.montant ? p.montant.toLocaleString("fr-FR") + " €" : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{echeance ? echeance.toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="px-4 py-3">
                    {joursRetard != null && joursRetard > 0 ? (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">{joursRetard}j</span>
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