import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ClipboardList, Loader2, ArrowRight, Home } from "lucide-react";

const STATUT_CONFIG = {
  en_cours: { label: "En cours", color: "bg-amber-100 text-amber-700" },
  en_attente: { label: "En attente", color: "bg-gray-100 text-gray-500" },
  termine: { label: "Terminé", color: "bg-green-100 text-green-700" },
  archive: { label: "Archivé", color: "bg-gray-100 text-gray-400" },
};

export default function AdminAttribution() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.DossierLocatif.list("-created_date", 100)
      .then(setDossiers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attribution</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Dossiers d'attribution liés à vos biens en location</p>
      </div>

      {dossiers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-20">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium">Aucune attribution</p>
          <p className="text-xs text-muted-foreground mt-1">
            Créez une attribution depuis l'onglet <span className="font-medium">Biens</span> en cliquant sur un bien.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/30">
            {dossiers.map((d) => {
              const statut = STATUT_CONFIG[d.statut] || STATUT_CONFIG.en_cours;
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.property_title || "Bien sans titre"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.reference} · {d.agent_name || d.agent_email || "Aucun agent"}
                      {d.loyer ? ` · ${d.loyer}€/mois` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statut.color}`}>
                    {statut.label}
                  </span>
                  <Link
                    to={`/admin/dossier-locatif/${d.id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium flex-shrink-0"
                  >
                    Voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}