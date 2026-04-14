import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Plus, X, Loader2, CheckCircle2, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STATUT_CONFIG = {
  ouvert: { label: "Ouvert", color: "bg-red-100 text-red-700" },
  en_cours: { label: "En cours", color: "bg-amber-100 text-amber-700" },
  resolu: { label: "Résolu", color: "bg-green-100 text-green-700" },
};

export default function LocataireIncidents() {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", categorie: "autre" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const dossiers = await base44.entities.DossierLocatif.list("-created_date", 100);
      const found = dossiers.find(d =>
        d.locataire_selectionne?.email === me.email ||
        d.candidatures?.some(c => c.email === me.email && c.statut === "selectionne")
      );
      setDossier(found || null);
      setLoading(false);
    };
    load();
  }, []);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploadingPhoto(false);
  };

  const soumettre = async () => {
    if (!form.titre || !dossier) return;
    setSaving(true);
    const newIncident = {
      id: Date.now(),
      ...form,
      photo_url: photoUrl,
      statut: "ouvert",
      date: new Date().toISOString(),
      source: "locataire",
    };
    const updated = [...(dossier.incidents || []), newIncident];
    await base44.entities.DossierLocatif.update(dossier.id, { incidents: updated });
    // Auto-create ticket
    await base44.entities.TicketIA.create({
      type_demande: "incident_logement",
      source: "manuel",
      description: `Incident déclaré par le locataire: ${form.titre}\n\n${form.description}`,
      bien_titre: dossier.property_title,
      dossier_id: dossier.id,
      priorite: "normal",
      module: "location",
      statut: "nouveau",
      numero: `INC-${Date.now()}`,
    });
    setDossier(prev => ({ ...prev, incidents: updated }));
    setShowForm(false);
    setForm({ titre: "", description: "", categorie: "autre" });
    setPhotoUrl("");
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const incidents = [...(dossier?.incidents || [])].reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-1">Déclarez un problème dans votre logement</p>
        </div>
        {dossier && (
          <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3.5 h-3.5" /> Déclarer un incident
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Nouveau signalement</p>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Titre *</label>
            <Input value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
              placeholder="Ex: Fuite d'eau dans la salle de bain" className="h-9 text-sm rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Catégorie</label>
            <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="plomberie">Plomberie</option>
              <option value="electricite">Électricité</option>
              <option value="chauffage">Chauffage</option>
              <option value="menuiserie">Menuiserie / Serrurerie</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Décrivez le problème en détail..." className="text-sm rounded-xl resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Photo (optionnel)</label>
            {photoUrl ? (
              <div className="flex items-center gap-2">
                <img src={photoUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <button onClick={() => setPhotoUrl("")} className="text-xs text-red-500 hover:underline">Supprimer</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-xl p-3 hover:bg-secondary/30 transition-colors">
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">Ajouter une photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button className="rounded-full flex-1 h-9 text-sm" onClick={soumettre} disabled={saving || !form.titre}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Envoyer le signalement"}
            </Button>
          </div>
        </div>
      )}

      {/* Incidents list */}
      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        {incidents.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="font-semibold">Aucun incident déclaré</p>
            <p className="text-sm text-muted-foreground mt-1">Tout semble aller bien dans votre logement 👌</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {incidents.map((inc) => {
              const cfg = STATUT_CONFIG[inc.statut] || STATUT_CONFIG.ouvert;
              return (
                <div key={inc.id} className="flex items-start gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${inc.statut === "ouvert" ? "bg-red-50" : inc.statut === "resolu" ? "bg-green-50" : "bg-amber-50"}`}>
                    <AlertTriangle className={`w-4 h-4 ${inc.statut === "ouvert" ? "text-red-500" : inc.statut === "resolu" ? "text-green-600" : "text-amber-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{inc.titre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{inc.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(inc.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}