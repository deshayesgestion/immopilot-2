import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronDown, ChevronRight, User, Euro, Calendar, Home, FileText, AlertTriangle, CreditCard } from "lucide-react";

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function DossierArchive({ dossier }) {
  const [open, setOpen] = useState(false);
  const loc = dossier.locataire_selectionne;
  const paiements = dossier.paiements || [];
  const docs = dossier.documents || [];
  const incidents = dossier.incidents || [];
  const totalRecu = paiements.filter((p) => p.statut === "recu").reduce((s, p) => s + Number(p.total || p.montant || 0), 0);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{dossier.property_title || "—"}</p>
          <p className="text-xs text-muted-foreground">{dossier.property_address || "—"} · Réf. {dossier.reference || "—"}</p>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Locataire</p>
            <p className="text-sm font-medium">{loc?.nom || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entrée</p>
            <p className="text-sm">{formatDate(dossier.date_entree)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sortie</p>
            <p className="text-sm">{formatDate(dossier.date_sortie)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Loyer</p>
            <p className="text-sm font-semibold text-primary">{formatEuro(dossier.loyer)}/mois</p>
          </div>
        </div>
      </button>

      {/* Detail panel */}
      {open && (
        <div className="border-t border-border/50 bg-secondary/10 px-5 py-5 space-y-6">

          {/* Infos locataire */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Locataire</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Nom", value: loc?.nom },
                { label: "Email", value: loc?.email },
                { label: "Téléphone", value: loc?.telephone },
                { label: "Revenus", value: loc?.revenus ? formatEuro(loc.revenus) : null },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-border/30">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Infos financières */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Euro className="w-3.5 h-3.5" /> Finances</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Loyer", value: formatEuro(dossier.loyer) },
                { label: "Charges", value: formatEuro(dossier.charges) },
                { label: "Caution", value: formatEuro(dossier.depot_garantie) },
                { label: "Total perçu", value: formatEuro(totalRecu), highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-border/30">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${highlight ? "text-green-600" : ""}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Paiements */}
          {paiements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Paiements ({paiements.length})</p>
              <div className="bg-white rounded-xl border border-border/30 overflow-hidden">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 px-4 py-2 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase">
                  <span>Mois</span><span>Loyer</span><span>Charges</span><span>Statut</span>
                </div>
                {[...paiements].reverse().map((p, i) => {
                  const sc = { recu: "text-green-600 bg-green-50", en_attente: "text-amber-600 bg-amber-50", retard: "text-red-600 bg-red-50", en_retard: "text-red-600 bg-red-50" }[p.statut] || "";
                  const sl = { recu: "Payé", en_attente: "En attente", retard: "En retard", en_retard: "En retard" }[p.statut] || p.statut;
                  return (
                    <div key={p.id || i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 text-sm border-t border-border/20">
                      <span>{p.mois}</span>
                      <span>{formatEuro(p.loyer)}</span>
                      <span>{formatEuro(p.charges)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${sc}`}>{sl}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          {docs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Documents ({docs.length})</p>
              <div className="flex flex-wrap gap-2">
                {docs.map((doc, i) => (
                  <div key={doc.id || i} className="bg-white border border-border/30 rounded-xl px-3 py-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{doc.nom}</span>
                    {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Voir</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incidents */}
          {incidents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Incidents ({incidents.length})</p>
              <div className="space-y-2">
                {incidents.map((inc, i) => (
                  <div key={inc.id || i} className="bg-white border border-border/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium flex-1">{inc.titre || inc.title || "Incident"}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inc.statut === "resolu" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {inc.statut === "resolu" ? "Résolu" : "Ouvert"}
                      </span>
                    </div>
                    {inc.description && <p className="text-xs text-muted-foreground mt-1">{inc.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates clés */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Dates clés</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Date d'entrée", value: formatDate(dossier.date_entree) },
                { label: "Date de sortie", value: formatDate(dossier.date_sortie) },
                { label: "Archivé le", value: formatDate(dossier.updated_date) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-border/30">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArchivesList() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.DossierLocatif.filter({ statut: "archive" }, "-updated_date", 200)
      .then(setDossiers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  if (dossiers.length === 0) return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm text-center py-20">
      <Home className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm font-medium text-muted-foreground">Aucun dossier archivé</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Les dossiers clôturés apparaîtront ici.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{dossiers.length} dossier{dossiers.length > 1 ? "s" : ""} archivé{dossiers.length > 1 ? "s" : ""}</p>
      {dossiers.map((d) => <DossierArchive key={d.id} dossier={d} />)}
    </div>
  );
}