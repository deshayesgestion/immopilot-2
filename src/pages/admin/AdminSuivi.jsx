import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, Home, User, Calendar, Euro, ExternalLink, Eye } from "lucide-react";

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function DossierSuiviCard({ dossier }) {
  const locataire = dossier.locataire_selectionne;
  const dateEntree = dossier.date_entree
    ? new Date(dossier.date_entree).toLocaleDateString("fr-FR")
    : "—";

  return (
    <div className="bg-white border border-border/50 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-sm font-semibold truncate">{dossier.property_title}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">{dossier.property_address}</p>
        </div>
        <Link
          to={`/admin/attribution/${dossier.id}`}
          className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{locataire?.nom || "—"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{locataire?.email || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <Euro className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium">{formatEuro(dossier.loyer)}<span className="text-muted-foreground font-normal">/mois</span></p>
            <p className="text-[11px] text-muted-foreground">{formatEuro(dossier.charges)} charges</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium">Entrée le {dateEntree}</p>
            <p className="text-[11px] text-muted-foreground">Réf. {dossier.reference || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Home className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-medium">Caution</p>
            <p className="text-[11px] text-muted-foreground">{formatEuro(dossier.depot_garantie)}</p>
          </div>
        </div>
      </div>

      {dossier.agent_name && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground">Agent : <span className="font-medium text-foreground">{dossier.agent_name}</span></p>
        </div>
      )}
    </div>
  );
}

export default function AdminSuivi() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.DossierLocatif.filter({ statut: "termine" }, "-updated_date", 100)
      .then(setDossiers)
      .finally(() => setLoading(false));
  }, []);

  const totalLoyer = dossiers.reduce((s, d) => s + (d.loyer || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suivi des locations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Biens occupés et locataires en place</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Biens occupés", value: dossiers.length, color: "text-green-600" },
          { label: "Loyers mensuels", value: formatEuro(totalLoyer), color: "text-primary" },
          { label: "Cautions perçues", value: formatEuro(dossiers.reduce((s, d) => s + (d.depot_garantie || 0), 0)), color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
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
          <p className="text-sm font-medium text-muted-foreground">Aucun dossier finalisé</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Les locations finalisées apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dossiers.map((d) => <DossierSuiviCard key={d.id} dossier={d} />)}
        </div>
      )}
    </div>
  );
}