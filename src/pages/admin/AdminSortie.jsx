import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, Home, User, Calendar, ArrowRight, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUT_CONFIG = {
  ouvert: { label: "Ouvert", color: "bg-amber-100 text-amber-700" },
  edl_planifie: { label: "EDL planifié", color: "bg-blue-100 text-blue-700" },
  edl_realise: { label: "EDL réalisé", color: "bg-purple-100 text-purple-700" },
  restitution_caution: { label: "Restitution caution", color: "bg-orange-100 text-orange-700" },
  cloture: { label: "Clôturé", color: "bg-gray-100 text-gray-500" },
};

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function AdminSortie() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.DossierSortie.list("-created_date", 100)
      .then(setDossiers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return dossiers;
    return dossiers.filter((d) =>
      [d.property_title, d.property_address, d.locataire?.nom, d.locataire?.email, d.reference].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [dossiers, search]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dossiers de sortie</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion des fins de bail et restitution de caution</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-amber-600">{dossiers.filter(d => d.statut !== "cloture").length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">En cours</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-muted-foreground">{dossiers.filter(d => d.statut === "cloture").length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Clôturés</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-primary">{fmt(dossiers.reduce((s, d) => s + (d.depot_garantie || 0), 0))}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Cautions gérées</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 rounded-full bg-secondary/50 border-0"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : dossiers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-20">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <LogOut className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Aucun dossier de sortie</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Les dossiers sont créés automatiquement lors de la clôture d'un préavis.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border/50">
            {["Bien", "Locataire", "Sortie prévue", "Statut", ""].map((h, i) => (
              <p key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-border/30">
            {filtered.map((d) => {
              const statut = STATUT_CONFIG[d.statut] || STATUT_CONFIG.ouvert;
              return (
                <div key={d.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.property_title || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.property_address || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm truncate">{d.locataire?.nom || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-sm">{d.date_sortie_prevue ? new Date(d.date_sortie_prevue).toLocaleDateString("fr-FR") : "—"}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statut.color}`}>{statut.label}</span>
                  <Link to={`/admin/sortie/${d.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium flex-shrink-0">
                    Voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-border/30 bg-secondary/20">
            <p className="text-xs text-muted-foreground">{filtered.length} dossier{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}