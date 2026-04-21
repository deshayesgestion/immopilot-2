const STATUT_COLORS = {
  nouveau: "bg-blue-100 text-blue-700",
  contacte: "bg-yellow-100 text-yellow-700",
  qualifie: "bg-green-100 text-green-700",
  perdu: "bg-red-100 text-red-600",
};

export default function ModuleVenteLeads({ leads, contactMap, bienMap, search }) {
  const filtered = leads.filter(l => {
    const contact = contactMap[l.contact_id];
    const bien = bienMap[l.bien_id];
    return [contact?.nom, bien?.titre, l.source].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (!filtered.length) return <Empty label="Aucun lead" />;

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bien</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {filtered.map(l => {
            const contact = contactMap[l.contact_id];
            const bien = bienMap[l.bien_id];
            return (
              <tr key={l.id} className="hover:bg-secondary/10 transition-colors">
                <td className="px-4 py-3 font-medium">{contact?.nom || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{bien?.titre || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.source || "—"}</td>
                <td className="px-4 py-3">
                  {l.score != null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${l.score}%` }} />
                      </div>
                      <span className="text-xs font-medium">{l.score}</span>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[l.statut] || "bg-secondary text-muted-foreground"}`}>
                    {l.statut || "—"}
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

function Empty({ label }) {
  return <div className="bg-white rounded-2xl border border-border/50 py-16 text-center text-muted-foreground text-sm">{label}</div>;
}