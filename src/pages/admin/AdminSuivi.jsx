import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, Home, User, Calendar, Euro, Search, Eye, ArrowRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const STATUT_BAIL = {
  actif: { label: "Bail actif", color: "bg-green-100 text-green-700" },
  preavis: { label: "Préavis", color: "bg-amber-100 text-amber-700" },
  termine: { label: "Terminé", color: "bg-gray-100 text-gray-500" },
};

function DossierRow({ dossier }) {
  const locataire = dossier.locataire_selectionne;
  const statut = STATUT_BAIL[dossier.statut_bail || "actif"];
  const dateEntree = dossier.date_entree
    ? new Date(dossier.date_entree).toLocaleDateString("fr-FR")
    : "—";
  const incidentsOuverts = (dossier.incidents || []).filter((i) => i.statut !== "resolu").length;

  return (
    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-secondary/20 transition-colors">
      {/* Bien */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{dossier.property_title || "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{dossier.property_address || "—"}</p>
        </div>
      </div>

      {/* Locataire */}
      <div className="flex items-center gap-2 min-w-0">
        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm truncate">{locataire?.nom || "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{locataire?.email || "—"}</p>
        </div>
      </div>

      {/* Loyer */}
      <p className="text-sm font-semibold">{formatEuro(dossier.loyer)}<span className="text-xs font-normal text-muted-foreground">/mois</span></p>

      {/* Date entrée */}
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-sm">{dateEntree}</p>
      </div>

      {/* Statut & incidents */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statut.color}`}>{statut.label}</span>
        {incidentsOuverts > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />{incidentsOuverts}
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        to={`/admin/suivi/${dossier.id}`}
        className="flex items-center gap-1 text-xs text-primary hover:underline font-medium flex-shrink-0"
      >
        Voir <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

export default function AdminSuivi() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.DossierLocatif.filter({ statut: "termine" }, "-updated_date", 200)
      .then(setDossiers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return dossiers;
    return dossiers.filter((d) =>
      [d.property_title, d.property_address, d.locataire_selectionne?.nom, d.locataire_selectionne?.email, d.reference].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [dossiers, search]);

  const totalLoyer = dossiers.reduce((s, d) => s + (d.loyer || 0), 0);
  const incidentsOuverts = dossiers.reduce((s, d) => s + (d.incidents || []).filter((i) => i.statut !== "resolu").length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suivi des locations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion des locataires en place</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-green-600">{dossiers.length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Biens occupés</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className="text-2xl font-bold text-primary">{formatEuro(totalLoyer)}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Loyers mensuels</p>
        </div>
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
          <p className={`text-2xl font-bold ${incidentsOuverts > 0 ? "text-amber-600" : "text-muted-foreground"}`}>{incidentsOuverts}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Incidents ouverts</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un locataire, bien..."
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
            <Eye className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Aucune location active</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Les dossiers finalisés via Attribution apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border/50">
            {["Bien", "Locataire", "Loyer", "Entrée", "Statut", ""].map((h, i) => (
              <p key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Aucun résultat pour "{search}"</p>
            ) : filtered.map((d) => <DossierRow key={d.id} dossier={d} />)}
          </div>
          <div className="px-5 py-3 border-t border-border/30 bg-secondary/20">
            <p className="text-xs text-muted-foreground">{filtered.length} dossier{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}