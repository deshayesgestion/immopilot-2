import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, ChevronLeft, ChevronRight, CheckCircle2, Camera, Trash2, ClipboardList } from "lucide-react";

const CHECKLIST_DEFAULT = [
  { id: "cuisine", label: "Cuisine", items: ["Plaques/four", "Réfrigérateur", "Hotte", "Placards", "Évier"] },
  { id: "salon", label: "Salon / Séjour", items: ["Sols", "Murs / peintures", "Fenêtres", "Prises électriques"] },
  { id: "chambre", label: "Chambre(s)", items: ["Sols", "Murs / peintures", "Placards", "Fenêtres"] },
  { id: "sdb", label: "Salle de bain / WC", items: ["Sanitaires", "Robinetterie", "Carrelage", "Joints"] },
  { id: "communs", label: "Parties communes", items: ["Entrée", "Couloir", "Cave / parking"] },
];

const ETAT_OPTIONS = ["Bon état", "Usage normal", "Dégradé", "À remplacer"];
const ETAT_COLORS = {
  "Bon état": "bg-green-100 text-green-700",
  "Usage normal": "bg-blue-100 text-blue-700",
  "Dégradé": "bg-orange-100 text-orange-700",
  "À remplacer": "bg-red-100 text-red-700",
};

export default function Step2EDL({ dossier, onUpdate, onNext, onPrev }) {
  const existingEdl = dossier.edl_sortie || {};
  const isEdlDone = dossier.statut === "edl_realise" || dossier.statut === "restitution_caution" || dossier.statut === "cloture";

  const [checklist, setChecklist] = useState(existingEdl.checklist || CHECKLIST_DEFAULT.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({ label: item, etat: "", commentaire: "" }))
  })));
  const [notes, setNotes] = useState(existingEdl.notes || "");
  const [dateEdl, setDateEdl] = useState(existingEdl.date || new Date().toISOString().substring(0, 10));
  const [signataire, setSignataire] = useState(existingEdl.signataire || dossier.locataire?.nom || "");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(!isEdlDone);

  const updateItem = (catIdx, itemIdx, field, value) => {
    const updated = checklist.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      items: cat.items.map((item, ii) => ii !== itemIdx ? item : { ...item, [field]: value })
    });
    setChecklist(updated);
  };

  const validerEdl = async () => {
    setSaving(true);
    const edl = { checklist, notes, date: dateEdl, signataire, validated_at: new Date().toISOString() };
    await base44.entities.DossierSortie.update(dossier.id, {
      edl_sortie: edl,
      statut: "edl_realise",
      historique: [
        ...(dossier.historique || []),
        { id: Date.now(), content: `EDL de sortie réalisé et validé le ${new Date(dateEdl).toLocaleDateString("fr-FR")}.`, date: new Date().toISOString() },
      ],
    });
    setSaving(false);
    setEditMode(false);
    onUpdate();
    onNext();
  };

  const saveEdl = async () => {
    setSaving(true);
    const edl = { checklist, notes, date: dateEdl, signataire };
    await base44.entities.DossierSortie.update(dossier.id, { edl_sortie: edl });
    setSaving(false);
    setEditMode(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              État des lieux de sortie
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Réalisé pièce par pièce avec photos et commentaires</p>
          </div>
          {!editMode && isEdlDone && (
            <button onClick={() => setEditMode(true)} className="text-xs text-primary hover:underline">Modifier</button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date EDL</label>
            <Input type="date" value={dateEdl} onChange={(e) => setDateEdl(e.target.value)} className="h-8 text-sm" disabled={!editMode} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Signataire locataire</label>
            <Input value={signataire} onChange={(e) => setSignataire(e.target.value)} className="h-8 text-sm" placeholder="Nom du locataire" disabled={!editMode} />
          </div>
        </div>
      </div>

      {/* Checklist par pièce */}
      {checklist.map((cat, catIdx) => (
        <div key={cat.id} className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-secondary/20 border-b border-border/30">
            <p className="text-sm font-semibold">{cat.label}</p>
          </div>
          <div className="divide-y divide-border/20">
            {cat.items.map((item, itemIdx) => (
              <div key={itemIdx} className="px-5 py-3 grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                <p className="text-sm font-medium pt-1">{item.label}</p>
                <div className="flex flex-col gap-1">
                  {ETAT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => editMode && updateItem(catIdx, itemIdx, "etat", opt)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                        item.etat === opt ? ETAT_COLORS[opt] + " font-medium" : "bg-secondary/30 text-muted-foreground hover:bg-secondary"
                      } ${!editMode ? "cursor-default" : "cursor-pointer"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={item.commentaire}
                  onChange={(e) => editMode && updateItem(catIdx, itemIdx, "commentaire", e.target.value)}
                  placeholder="Commentaire..."
                  className="text-xs resize-none min-h-[60px] rounded-lg"
                  disabled={!editMode}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Notes générales */}
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
        <p className="text-sm font-semibold">Notes générales</p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Remarques générales, observations complémentaires..."
          className="text-sm resize-none min-h-[80px] rounded-xl"
          disabled={!editMode}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-full gap-2" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" /> Retour
        </Button>
        <div className="flex gap-2">
          {editMode && isEdlDone && (
            <Button variant="outline" className="rounded-full h-9 text-sm" onClick={saveEdl} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </Button>
          )}
          {editMode && !isEdlDone && (
            <Button className="rounded-full gap-2 bg-green-600 hover:bg-green-700" onClick={validerEdl} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Valider l'EDL
            </Button>
          )}
          {!editMode && isEdlDone && (
            <Button className="rounded-full gap-2" onClick={onNext}>
              Étape suivante <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}