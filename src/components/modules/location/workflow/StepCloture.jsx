import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Plus, Trash2, Loader2, Archive } from "lucide-react";

export default function StepCloture({ dossier, onSave }) {
  const [retenues, setRetenues] = useState(dossier.depot_garantie_retenues || []);
  const [newRetenue, setNewRetenue] = useState({ motif: "", montant: "" });
  const [saving, setSaving] = useState(false);

  const depot = dossier.depot_garantie_montant || 0;
  const totalRetenues = retenues.reduce((s, r) => s + (Number(r.montant) || 0), 0);
  const degradations = dossier.edls_degradations || [];
  const totalDegradations = degradations.reduce((s, d) => s + (Number(d.montant_estime) || 0), 0);
  const restitution = Math.max(0, depot - totalRetenues);

  const addRetenue = async () => {
    if (!newRetenue.motif || !newRetenue.montant) return;
    const updated = [...retenues, { motif: newRetenue.motif, montant: Number(newRetenue.montant) }];
    setRetenues(updated);
    await base44.entities.DossierLocatif.update(dossier.id, { depot_garantie_retenues: updated });
    onSave({ depot_garantie_retenues: updated });
    setNewRetenue({ motif: "", montant: "" });
  };

  const removeRetenue = async (idx) => {
    const updated = retenues.filter((_, i) => i !== idx);
    setRetenues(updated);
    await base44.entities.DossierLocatif.update(dossier.id, { depot_garantie_retenues: updated });
    onSave({ depot_garantie_retenues: updated });
  };

  const cloturerDossier = async () => {
    setSaving(true);
    const data = {
      depot_garantie_statut: restitution >= depot ? "restitue_total" : restitution > 0 ? "restitue_partiel" : "restitue_total",
      depot_garantie_restitution_montant: restitution,
      bail_statut: "termine",
      statut_dossier: "termine",
      historique: [...(dossier.historique || []), { date: new Date().toISOString(), action: `Dossier clôturé — Restitution : ${restitution} €`, auteur: "Agent" }]
    };
    await base44.entities.DossierLocatif.update(dossier.id, data);
    onSave(data);
    setSaving(false);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
      <p className="text-sm font-semibold flex items-center gap-2">🏁 Clôture du dossier</p>

      {/* Résumé dépôt */}
      <div className="bg-white rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Dépôt de garantie</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Montant initial</span>
          <span className="font-bold">{depot.toLocaleString("fr-FR")} €</span>
        </div>
        {degradations.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-2 text-xs">
            <p className="font-semibold text-amber-700 mb-1">Dégradations constatées (EDL sortie)</p>
            {degradations.map((d, i) => (
              <div key={i} className="flex justify-between">
                <span>{d.piece} — {d.description}</span>
                <span className="font-medium">{d.montant_estime || 0} €</span>
              </div>
            ))}
            <div className="border-t border-amber-200 mt-1 pt-1 flex justify-between font-bold text-amber-700">
              <span>Total dégradations</span><span>{totalDegradations} €</span>
            </div>
          </div>
        )}
      </div>

      {/* Retenues manuelles */}
      <div>
        <p className="text-xs font-semibold mb-2">Retenues sur dépôt</p>
        <div className="space-y-1.5">
          {retenues.map((r, i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
              <span className="flex-1 text-xs">{r.motif}</span>
              <span className="text-xs font-bold">{Number(r.montant).toLocaleString("fr-FR")} €</span>
              <button onClick={() => removeRetenue(i)}><Trash2 className="w-3 h-3 text-muted-foreground/40 hover:text-red-500" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input value={newRetenue.motif} onChange={e => setNewRetenue(p => ({ ...p, motif: e.target.value }))}
            placeholder="Motif (ex: nettoyage)" className="h-8 rounded-xl text-xs flex-1" />
          <Input type="number" value={newRetenue.montant} onChange={e => setNewRetenue(p => ({ ...p, montant: e.target.value }))}
            placeholder="Montant €" className="h-8 rounded-xl text-xs w-24" />
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl" onClick={addRetenue}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Calcul restitution */}
      <div className={`rounded-xl p-3 ${restitution >= depot ? "bg-green-50 border border-green-200" : restitution > 0 ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Montant à restituer</span>
          <span className={`text-xl font-black ${restitution >= depot ? "text-green-600" : restitution > 0 ? "text-amber-600" : "text-red-600"}`}>
            {restitution.toLocaleString("fr-FR")} €
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {depot} € − {totalRetenues} € de retenues = {restitution} €
        </p>
        {restitution >= depot && <p className="text-xs text-green-600 font-medium mt-1">✓ Restitution totale</p>}
        {restitution < depot && restitution > 0 && <p className="text-xs text-amber-600 font-medium mt-1">⚠ Restitution partielle</p>}
        {restitution <= 0 && totalRetenues > 0 && <p className="text-xs text-red-600 font-medium mt-1">✗ Aucune restitution</p>}
      </div>

      <Button className="w-full rounded-full gap-2 bg-gray-700 hover:bg-gray-800" onClick={cloturerDossier} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
        Clôturer le dossier (restitution : {restitution} €)
      </Button>
    </div>
  );
}