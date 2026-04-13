import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export default function TabLoyers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.DossierLocatif.filter({ statut: "en_cours" }, "-created_date", 100);
    setDossiers(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const syncLoyers = async () => {
    setSyncing(true);
    const dossiersList = await base44.entities.DossierLocatif.filter({ statut: "en_cours" }, "-created_date", 200);
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    for (const d of dossiersList) {
      if (!d.loyer) continue;
      const existing = await base44.entities.Transaction.filter({ dossier_id: d.id, type: "loyer" }, "-date_echeance", 1);
      const alreadyThisMonth = existing.some(t => t.date_echeance?.startsWith(thisMonth));
      if (!alreadyThisMonth) {
        await base44.entities.Transaction.create({
          type: "loyer",
          statut: "en_attente",
          montant: (d.loyer || 0) + (d.charges || 0),
          tiers_nom: d.locataire_selectionne?.nom || "Locataire",
          tiers_email: d.locataire_selectionne?.email || "",
          bien_titre: d.property_title,
          bien_id: d.property_id,
          dossier_id: d.id,
          dossier_type: "location",
          date_echeance: `${thisMonth}-05`,
          reference: `LOYER-${d.id}-${thisMonth}`,
        });
      }
    }
    await load();
    setSyncing(false);
  };

  const loyers = useMemo(() => {
    if (!search) return dossiers;
    const q = search.toLowerCase();
    return dossiers.filter(d =>
      [d.property_title, d.locataire_selectionne?.nom].some(v => v?.toLowerCase().includes(q))
    );
  }, [dossiers, search]);

  const stats = useMemo(() => ({
    total: dossiers.reduce((s, d) => s + (d.loyer || 0) + (d.charges || 0), 0),
    nb: dossiers.length,
  }), [dossiers]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-2xl font-bold text-primary">{stats.nb}</p>
          <p className="text-xs text-muted-foreground">Baux actifs</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-2xl font-bold text-green-600">{fmt(stats.total)}</p>
          <p className="text-xs text-muted-foreground">Loyers + charges/mois</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 flex items-center justify-center">
          <Button variant="outline" className="rounded-full gap-2 text-sm" onClick={syncLoyers} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Synchroniser
          </Button>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-full bg-secondary/50 border-0" />
      </div>

      <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {loyers.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground">Aucun bail actif</p>
        ) : (
          <div className="divide-y divide-border/30">
            {loyers.map(d => {
              const paiements = d.paiements || [];
              const now = new Date();
              const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              const payeThisMonth = paiements.some(p => p.date?.startsWith(thisMonth) && p.statut === "paye");
              const locataire = d.locataire_selectionne;
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.property_title}</p>
                    <p className="text-xs text-muted-foreground">{locataire?.nom || "Locataire non défini"} · Entrée {fmtDate(d.date_entree)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">{fmt((d.loyer || 0) + (d.charges || 0))}</p>
                    <p className="text-xs text-muted-foreground">loyer + charges</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {payeThisMonth ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Payé ce mois
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> En attente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}