import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, User, Home, Clock, ChevronRight, CheckCircle2, Edit2 } from "lucide-react";

function addMonths(dateStr, months) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().substring(0, 10);
}

function addDays(dateStr, days) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

const fmt = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("fr-FR") : "—";
const fmt2 = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function Step1Preavis({ dossier, onUpdate, onNext }) {
  const isPreavisConfirmed = dossier.statut !== "ouvert";

  const debutPreavis = dossier.date_sortie_prevue
    ? new Date(dossier.date_sortie_prevue).toISOString().substring(0, 10)
    : dossier.date_entree
    ? new Date().toISOString().substring(0, 10)
    : "";

  const [duree, setDuree] = useState(dossier.duree_preavis_mois || 1);
  const [debut, setDebut] = useState(debutPreavis);
  const [editMode, setEditMode] = useState(!isPreavisConfirmed);
  const [saving, setSaving] = useState(false);

  const fin = duree === "custom"
    ? dossier.date_sortie_effective?.substring(0, 10) || addDays(debut, 30)
    : addMonths(debut, Number(duree));

  const confirmerPreavis = async () => {
    setSaving(true);
    // Publier le bien en "bientôt disponible"
    if (dossier.property_id) {
      await base44.entities.Property.update(dossier.property_id, {
        status: "bientot_disponible",
        publish_site: true,
        available_date: fin || undefined,
      });
    }
    await base44.entities.DossierSortie.update(dossier.id, {
      statut: "edl_planifie",
      date_sortie_prevue: debut,
      date_sortie_effective: fin,
      duree_preavis_mois: duree,
      historique: [
        ...(dossier.historique || []),
        { id: Date.now(), content: `Préavis confirmé. Départ prévu le ${fmt(fin)}.`, date: new Date().toISOString() },
      ],
    });
    setSaving(false);
    setEditMode(false);
    onUpdate();
    onNext();
  };

  const saveModification = async () => {
    setSaving(true);
    await base44.entities.DossierSortie.update(dossier.id, {
      date_sortie_prevue: debut,
      date_sortie_effective: fin,
      duree_preavis_mois: duree,
    });
    setSaving(false);
    setEditMode(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Locataire & bien */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <User className="w-4 h-4 text-blue-500 mb-2" />
          <p className="text-sm font-semibold">{dossier.locataire?.nom || "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{dossier.locataire?.email || "—"}</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Home className="w-4 h-4 text-amber-500 mb-2" />
          <p className="text-sm font-semibold truncate">{dossier.property_title}</p>
          <p className="text-xs text-muted-foreground truncate">{dossier.property_address || "—"}</p>
        </div>
        <div className="bg-white border border-border/50 rounded-xl p-4">
          <Clock className="w-4 h-4 text-green-500 mb-2" />
          <p className="text-sm font-semibold">{fmt2(dossier.loyer)}/mois</p>
          <p className="text-xs text-muted-foreground">Caution : {fmt2(dossier.depot_garantie)}</p>
        </div>
      </div>

      {/* Préavis config */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Préavis & date de départ</p>
            <p className="text-xs text-muted-foreground mt-0.5">Définissez la durée du préavis et la date de sortie</p>
          </div>
          {!editMode && isPreavisConfirmed && (
            <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Edit2 className="w-3 h-3" /> Modifier
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Date de début du préavis</label>
                <Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Durée du préavis</label>
                <select
                  value={duree}
                  onChange={(e) => setDuree(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value={1}>1 mois (meublé / zone tendue)</option>
                  <option value={3}>3 mois (vide)</option>
                </select>
              </div>
            </div>

            {debut && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Départ calculé : {fmt(fin)}</p>
                  <p className="text-xs text-amber-600">Préavis de {duree} mois à partir du {fmt(debut)}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {isPreavisConfirmed && (
                <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => setEditMode(false)}>
                  Annuler
                </Button>
              )}
              <Button
                size="sm"
                className={`rounded-full h-9 text-xs gap-1.5 ${isPreavisConfirmed ? "bg-primary" : "bg-amber-500 hover:bg-amber-600"}`}
                onClick={isPreavisConfirmed ? saveModification : confirmerPreavis}
                disabled={saving || !debut}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                {isPreavisConfirmed ? "Enregistrer" : "Confirmer le préavis"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Début préavis</p>
              <p className="text-sm font-semibold">{fmt(dossier.date_sortie_prevue)}</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Durée</p>
              <p className="text-sm font-semibold">{dossier.duree_preavis_mois || "—"} mois</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-600 mb-1">Date de sortie</p>
              <p className="text-sm font-semibold text-amber-800">{fmt(dossier.date_sortie_effective)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Date d'entrée pour contexte */}
      {dossier.date_entree && (
        <div className="bg-secondary/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Date d'entrée dans le logement : <strong>{fmt(dossier.date_entree)}</strong>
            {dossier.date_entree && dossier.date_sortie_effective && (
              <span> · Durée d'occupation : <strong>{Math.round((new Date(dossier.date_sortie_effective) - new Date(dossier.date_entree)) / (1000 * 60 * 60 * 24 * 30))} mois</strong></span>
            )}
          </p>
        </div>
      )}

      {isPreavisConfirmed && (
        <div className="flex justify-end">
          <Button className="rounded-full gap-2" onClick={onNext}>
            Étape suivante — EDL <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}