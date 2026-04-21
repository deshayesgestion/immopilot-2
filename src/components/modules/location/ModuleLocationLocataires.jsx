import { User, Mail, Phone } from "lucide-react";

export default function ModuleLocationLocataires({ locataires, search }) {
  const filtered = locataires.filter(c =>
    [c.nom, c.email, c.telephone].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  if (!filtered.length) return <Empty label="Aucun locataire" />;

  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Locataire</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Téléphone</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {filtered.map(c => (
            <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="font-medium">{c.nom}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {c.email ? <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail className="w-3 h-3" />{c.email}</a> : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {c.telephone ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telephone}</span> : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {c.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                  )) || "—"}
                </div>
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