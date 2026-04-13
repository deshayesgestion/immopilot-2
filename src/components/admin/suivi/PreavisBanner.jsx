import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, Globe, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";

export default function PreavisBanner({ dossier, onUpdate }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cloturing, setCloturing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dateSortie, setDateSortie] = useState(dossier.preavis_date_sortie || "");
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const isActif = !dossier.statut_bail || dossier.statut_bail === "actif";
  const isPreavis = dossier.statut_bail === "preavis";

  const recevoirPreavis = async () => {
    setLoading(true);
    await base44.entities.DossierLocatif.update(dossier.id, {
      statut_bail: "preavis",
      preavis_date_reception: new Date().toISOString(),
      preavis_date_sortie: dateSortie || null,
    });
    // Notify locataire par email (best-effort)
    const loc = dossier.locataire_selectionne;
    if (loc?.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: loc.email,
          subject: "Accusé de réception de votre préavis",
          body: `Bonjour ${loc.nom},\n\nNous accusons réception de votre préavis de départ concernant le bien : ${dossier.property_title}.\n\n${dateSortie ? `Date de sortie prévue : ${new Date(dateSortie).toLocaleDateString("fr-FR")}\n\n` : ""}L'état des lieux de sortie sera planifié prochainement.\n\nCordialement,\n${dossier.agent_name || "L'agence"}`,
        });
      } catch (e) {
        // Email optionnel, on continue même si erreur
      }
    }
    setLoading(false);
    setConfirming(false);
    onUpdate();
  };

  const cloturerPreavis = async () => {
    setCloturing(true);
    try {
      // Archiver le dossier suivi
      await base44.entities.DossierLocatif.update(dossier.id, {
        statut_bail: "termine",
        statut: "archive",
        date_sortie: dateSortie || new Date().toISOString(),
      });
      // Créer dossier de sortie
      const ds = await base44.entities.DossierSortie.create({
        dossier_suivi_id: dossier.id,
        property_id: dossier.property_id,
        property_title: dossier.property_title,
        property_address: dossier.property_address,
        locataire: dossier.locataire_selectionne,
        agent_email: dossier.agent_email,
        agent_name: dossier.agent_name,
        loyer: dossier.loyer,
        charges: dossier.charges,
        depot_garantie: dossier.depot_garantie,
        date_entree: dossier.date_entree,
        date_sortie_prevue: dateSortie || dossier.preavis_date_sortie || null,
        statut: "ouvert",
        reference: `SORTIE-${Date.now()}`,
        historique: [{ id: Date.now(), content: "Dossier créé automatiquement depuis le suivi locataire.", date: new Date().toISOString() }],
      });
      setCloturing(false);
      navigate(`/admin/sortie/${ds.id}`);
    } catch (err) {
      console.error("Erreur clôture préavis:", err);
      setCloturing(false);
    }
  };

  const remettreEnLocation = async () => {
    setPublishing(true);
    // Mettre à jour le bien : publish_site = true, status = "disponible"
    if (dossier.property_id) {
      await base44.entities.Property.update(dossier.property_id, {
        status: "disponible",
        publish_site: true,
        available_date: dateSortie || undefined,
      });
    }
    // Archiver le dossier locatif
    await base44.entities.DossierLocatif.update(dossier.id, {
      statut_bail: "termine",
      statut: "archive",
      date_sortie: dateSortie || new Date().toISOString(),
    });
    setPublishing(false);
    setConfirmPublish(false);
    onUpdate();
  };

  if (!isActif && !isPreavis) return null;

  return (
    <div className={`rounded-2xl border px-5 py-4 space-y-4 ${isPreavis ? "bg-amber-50 border-amber-200" : "bg-white border-border/50"}`}>
      {/* ACTIF → bouton recevoir préavis */}
      {isActif && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Préavis locataire</p>
              <p className="text-xs text-muted-foreground">Le locataire a signalé son intention de quitter le logement.</p>
            </div>
          </div>
          {confirming ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Input
                type="date"
                value={dateSortie}
                onChange={(e) => setDateSortie(e.target.value)}
                className="h-8 text-sm w-40"
                placeholder="Date de sortie"
              />
              <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setConfirming(false)}>
                Annuler
              </Button>
              <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600" onClick={recevoirPreavis} disabled={loading}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Confirmer
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5 flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => setConfirming(true)}>
              <LogOut className="w-3 h-3" /> Recevoir préavis
            </Button>
          )}
        </div>
      )}

      {/* PRÉAVIS EN COURS */}
      {isPreavis && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Préavis en cours</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {dossier.preavis_date_reception && (
                    <p className="text-xs text-amber-700">
                      Reçu le {new Date(dossier.preavis_date_reception).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  {dossier.preavis_date_sortie && (
                    <p className="text-xs text-amber-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Sortie prévue : {new Date(dossier.preavis_date_sortie).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Clôturer préavis */}
          <div className="flex items-center gap-3">
            <Button size="sm" className="rounded-full h-9 text-xs gap-1.5 bg-gray-700 hover:bg-gray-800" onClick={cloturerPreavis} disabled={cloturing}>
              {cloturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Clôturer le préavis
            </Button>
            <span className="text-xs text-muted-foreground">Crée automatiquement un dossier de sortie</span>
          </div>

          {/* Section remise en location */}
          <div className="border-t border-amber-200 pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Remise en location</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Date de disponibilité</label>
                <Input
                  type="date"
                  value={dateSortie}
                  onChange={(e) => setDateSortie(e.target.value)}
                  className="h-8 text-sm max-w-xs"
                />
              </div>
            </div>

            {confirmPublish ? (
              <div className="mt-3 p-4 bg-white rounded-xl border border-amber-300 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">Confirmer la remise en location ?</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <li>✓ Le bien sera publié sur le site vitrine</li>
                      <li>✓ Le statut passera à "Disponible"</li>
                      <li>✓ Le dossier locatif sera archivé</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setConfirmPublish(false)}>
                    Annuler
                  </Button>
                  <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700" onClick={remettreEnLocation} disabled={publishing}>
                    {publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                    Valider et publier
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" className="mt-3 rounded-full h-9 text-xs gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => setConfirmPublish(true)}>
                <Globe className="w-3.5 h-3.5" /> Remettre en location
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}