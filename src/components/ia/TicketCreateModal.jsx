/**
 * TicketCreateModal — Modal de création manuelle de ticket IA
 * Réutilisable dans AccueilIA et autres pages
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = {
  appelant_nom: "", appelant_email: "", appelant_telephone: "",
  type_demande: "incident_logement", module: "location",
  priorite: "normal", description: "", source: "manuel"
};

export default function TicketCreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    setSaving(true);
    const ticket = await base44.entities.TicketIA.create({
      ...form,
      numero: `TKT-${Date.now()}`,
      date_appel: new Date().toISOString(),
      statut: "nouveau",
    });
    setSaving(false);
    onCreated?.(ticket);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Créer un ticket manuellement</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label-field">Nom contact</label>
            <Input value={form.appelant_nom} onChange={e => set("appelant_nom", e.target.value)} className="h-9 text-sm rounded-xl" />
          </div>
          <div>
            <label className="label-field">Email</label>
            <Input type="email" value={form.appelant_email} onChange={e => set("appelant_email", e.target.value)} className="h-9 text-sm rounded-xl" />
          </div>
          <div>
            <label className="label-field">Téléphone</label>
            <Input value={form.appelant_telephone} onChange={e => set("appelant_telephone", e.target.value)} className="h-9 text-sm rounded-xl" />
          </div>
          <div>
            <label className="label-field">Priorité</label>
            <select value={form.priorite} onChange={e => set("priorite", e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="faible">Faible</option>
            </select>
          </div>
          <div>
            <label className="label-field">Module</label>
            <select value={form.module} onChange={e => set("module", e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="location">Location</option>
              <option value="vente">Vente</option>
              <option value="comptabilite">Comptabilité</option>
              <option value="general">Général</option>
            </select>
          </div>
          <div>
            <label className="label-field">Type</label>
            <select value={form.type_demande} onChange={e => set("type_demande", e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="incident_logement">Incident logement</option>
              <option value="demande_visite">Demande visite</option>
              <option value="demande_information">Demande d'info</option>
              <option value="probleme_paiement">Problème paiement</option>
              <option value="question_administrative">Question admin</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="label-field">Source</label>
            <select value={form.source} onChange={e => set("source", e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="manuel">Manuel</option>
              <option value="email">Email</option>
              <option value="appel">Appel</option>
              <option value="chat">Chat</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label-field">Description</label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className="text-sm rounded-xl resize-none" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full flex-1 h-9 text-sm" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Créer le ticket"}
          </Button>
        </div>
      </div>
    </div>
  );
}