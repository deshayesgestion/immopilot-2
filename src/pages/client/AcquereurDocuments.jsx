import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcquereurDocuments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const txs = await base44.entities.TransactionVente.filter({ acquereur_email: me.email }, "-created_date", 20);
      setTransactions(txs);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const allDocs = transactions.flatMap(tx =>
    (tx.documents || []).filter(d => d.url).map(d => ({ ...d, property: tx.property_title }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Compromis, offres et actes liés à votre achat</p>
      </div>
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        {allDocs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun document disponible pour l'instant</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {allDocs.map((doc, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{doc.libelle || "Document"}</p>
                  <p className="text-xs text-muted-foreground">{doc.property}</p>
                </div>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="rounded-full h-8 text-xs gap-1">
                    <Download className="w-3 h-3" /> Télécharger
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}