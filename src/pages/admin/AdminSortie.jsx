import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, Home, ArrowRight, LogOut, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUT_STEPS = ["ouvert", "edl_planifie", "edl_realise", "restitution_caution", "cloture"];
const STATUT_LABELS = {
  ouvert: "Ouvert",
  edl_planifie: "EDL planifié",
  edl_realise: "EDL réalisé",
  restitution_caution: "Restitution caution",
  cloture: "Clôturé",
};
const STATUT_COLORS = {
  ouvert: "bg-amber-100 text-amber-700",
  edl_planifie: "bg-blue-100 text-blue-700",
  edl_realise: "bg-purple-100 text-purple-700",
  restitution_caution: "bg-orange-100 text-orange-700",
  cloture: "bg-gray-100 text-gray-500",
};

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function AdminSortie() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    base44.entities.DossierSortie.list("-created_date", 100)
      .then(setDossiers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dossiers de sortie</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des fins de bail et restitution de caution</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-secondary/60 transition-colors text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-amber-600">{dossiers.filter((d) => d.statut !== "cloture").length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">En cours</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-muted-foreground">{dossiers.filter((d) => d.statut === "cloture").length}</p>
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
          placeholder="Rechercher un dossier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 rounded-full bg-secondary/50 border-0"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : dossiers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-20">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <LogOut className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium">Aucun dossier de sortie</p>
          <p className="text-xs text-muted-foreground mt-1">
            Les dossiers sont créés automatiquement lors de la clôture d'un préavis.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border/50">
            {["Bien", "Réf.", "Agent", "Statut", ""].map((h, i) => (
              <p key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Aucun résultat pour "{search}"</div>
            ) : filtered.map((d) => {
              const statut = STATUT_COLORS[d.statut] || STATUT_COLORS.ouvert;
              const statutLabel = STATUT_LABELS[d.statut] || "Ouvert";
              const stepIndex = STATUT_STEPS.indexOf(d.statut);
              const progress = Math.round(((stepIndex + 1) / STATUT_STEPS.length) * 100);

              return (
                <div key={d.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.property_title || "—"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-20 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{statutLabel}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.reference || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.agent_name || d.agent_email || "—"}</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${statut}`}>
                    {statutLabel}
                  </span>
                  <Link
                    to={`/admin/sortie/${d.id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
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