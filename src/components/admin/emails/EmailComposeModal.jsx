import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Loader2, Zap } from "lucide-react";

export default function EmailComposeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    de: "", de_nom: "", objet: "", corps: "",
    date_reception: new Date().toISOString(), statut: "non_lu"
  });
  const [saving, setSaving] = useState(false);
  const [analysing, setAnalysing] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const importer = async () => {
    if (!form.de || !form.objet) return;
    setSaving(true);
    const email = await base44.entities.EmailEntrant.create(form);
    setSaving(false);
    onCreated(email);
    onClose();
  };

  const importerEtAnalyser = async () => {
    if (!form.de || !form.objet) return;
    setAnalysing(true);
    const email = await base44.entities.EmailEntrant.create(form);
    await base44.functions.invoke("analyserEmail", { email_id: email.id });
    setAnalysing(false);
    onCreated(email);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <p className="text-sm font-semibold">Importer un email</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email expéditeur *</label>
              <Input value={form.de} onChange={e => set("de", e.target.value)} placeholder="client@email.fr" className="h-9 text-sm rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nom expéditeur</label>
              <Input value={form.de_nom} onChange={e => set("de_nom", e.target.value)} placeholder="Jean Dupont" className="h-9 text-sm rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Objet *</label>
            <Input value={form.objet} onChange={e => set("objet", e.target.value)} placeholder="Problème chauffage — Appartement..." className="h-9 text-sm rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Corps de l'email</label>
            <Textarea value={form.corps} onChange={e => set("corps", e.target.value)} rows={6} placeholder="Copiez ici le contenu de l'email..." className="text-sm rounded-xl resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date de réception</label>
            <Input type="datetime-local" value={form.date_reception?.substring(0, 16)} onChange={e => set("date_reception", new Date(e.target.value).toISOString())} className="h-9 text-sm rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={importer} disabled={saving || !form.de || !form.objet}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Importer"}
          </Button>
          <Button className="rounded-full flex-1 h-9 text-sm gap-1.5" onClick={importerEtAnalyser} disabled={analysing || !form.de || !form.objet}>
            {analysing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Importer & Analyser
          </Button>
        </div>
      </div>
    </div>
  );
}