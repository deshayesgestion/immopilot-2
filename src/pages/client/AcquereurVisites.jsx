import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Home, Loader2, Clock, CheckCircle2 } from "lucide-react";

const fmtDate = (d) => d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function AcquereurVisites() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const txs = await base44.entities.TransactionVente.filter({ acquereur_email: me.email }, "-created_date", 20);
      // Also check prospection
      const allTxs = await base44.entities.TransactionVente.list("-created_date", 100);
      const inPros = allTxs.filter(tx =>
        (tx.acquereurs_prospection || []).some(a => a.email === me.email)
      );
      const combined = [...txs, ...inPros.filter(t => !txs.some(x => x.id === t.id))];
      setTransactions(combined);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const allVisites = transactions.flatMap(tx => {
    const visites = [
      ...(tx.visites || []),
      ...((tx.acquereurs_prospection || []).flatMap(a => (a.visites || []).map(v => ({ ...v, property: tx.property_title }))))
    ].map(v => ({ ...v, property: v.property || tx.property_title }));
    return visites;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes visites</h1>
        <p className="text-sm text-muted-foreground mt-1">Historique et visites planifiées</p>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        {allVisites.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="font-semibold">Aucune visite planifiée</p>
            <p className="text-sm text-muted-foreground mt-1">Votre conseiller vous proposera des créneaux de visites.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {allVisites.map((v, i) => {
              const isPast = new Date(v.date) < new Date();
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isPast ? "bg-green-50" : "bg-purple-50"}`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{v.property}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(v.date)}</p>
                    {v.note && <p className="text-xs text-muted-foreground italic">{v.note}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isPast ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                    {isPast ? "Réalisée" : "Planifiée"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}