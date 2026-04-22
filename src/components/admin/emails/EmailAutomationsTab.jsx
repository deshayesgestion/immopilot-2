/**
 * EmailAutomationsTab — Gestion des règles d'automation email
 * Intégré dans /admin/parametres/emails (onglet Automations)
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap, Plus, X, Loader2, CheckCircle2, Clock, Mail, ToggleLeft, ToggleRight,
  FolderOpen, CreditCard, TicketIcon, Home, Play, History
} from "lucide-react";

const TRIGGERS = [
  { v: "dossier_cree",         l: "Dossier créé",                icon: FolderOpen,   color: "text-indigo-600 bg-indigo-50" },
  { v: "dossier_statut_change",l: "Changement statut dossier",    icon: FolderOpen,   color: "text-purple-600 bg-purple-50" },
  { v: "bien_statut_change",   l: "Changement statut bien",       icon: Home,         color: "text-blue-600 bg-blue-50" },
  { v: "paiement_enregistre",  l: "Paiement enregistré",          icon: CreditCard,   color: "text-green-600 bg-green-50" },
  { v: "ticket_cree",          l: "Ticket IA créé",               icon: TicketIcon,   color: "text-amber-600 bg-amber-50" },
  { v: "hebdomadaire",         l: "Rapport hebdomadaire",         icon: Mail,         color: "text-gray-600 bg-gray-50" },
];

const TYPE_EMAILS = [
  { v: "suivi_dossier",       l: "Suivi de dossier" },
  { v: "rappel_paiement",     l: "Rappel de paiement" },
  { v: "confirmation_visite", l: "Confirmation de visite" },
  { v: "mise_a_jour_hebdo",   l: "Mise à jour hebdo" },
  { v: "bienvenue",           l: "Email de bienvenue" },
  { v: "alerte_urgente",      l: "Alerte urgente" },
];

const MODULES = [
  { v: "tous", l: "Tous modules" },
  { v: "location", l: "Location uniquement" },
  { v: "vente", l: "Vente uniquement" },
  { v: "comptabilite", l: "Comptabilité uniquement" },
];

const EMPTY_FORM = {
  trigger: "dossier_cree",
  type_email: "suivi_dossier",
  actif: true,
  condition_module: "tous",
  delai_heures: 0,
  sujet_template: "",
  corps_template: "",
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function AutomationCard({ automation, onToggle, onDelete, onTest, testing }) {
  const [showHistory, setShowHistory] = useState(false);
  const trigger = TRIGGERS.find(t => t.v === automation.trigger);
  const TrigIcon = trigger?.icon || Zap;

  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-3 transition-all ${automation.actif ? "border-border/50" : "border-dashed border-border/30 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${trigger?.color || "text-gray-500 bg-gray-50"}`}>
            <TrigIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{TYPE_EMAILS.find(t => t.v === automation.type_email)?.l || automation.type_email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{trigger?.l || automation.trigger}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onTest(automation)} disabled={testing === automation.id}
            className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-primary transition-colors" title="Tester">
            {testing === automation.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onToggle(automation)}
            className={`p-1.5 rounded-lg transition-colors ${automation.actif ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-secondary/50"}`}>
            {automation.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(automation.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {automation.condition_module && automation.condition_module !== "tous" && (
          <span className="text-[10px] bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full capitalize">{automation.condition_module}</span>
        )}
        {automation.delai_heures > 0 && (
          <span className="text-[10px] bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Délai {automation.delai_heures}h
          </span>
        )}
        {automation.corps_template ? (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Template personnalisé</span>
        ) : (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> Contenu IA
          </span>
        )}
      </div>

      {automation.sujet_template && (
        <p className="text-xs text-muted-foreground truncate">Sujet : {automation.sujet_template}</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="w-3 h-3" />
          <span>{automation.nb_envois || 0} envois</span>
          {automation.dernier_envoi && <span>· dernier {fmtDate(automation.dernier_envoi)}</span>}
        </div>
        {automation.historique_envois?.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] text-primary hover:underline flex items-center gap-1">
            <History className="w-2.5 h-2.5" /> Historique
          </button>
        )}
      </div>

      {showHistory && (
        <div className="space-y-1.5 pt-1">
          {[...(automation.historique_envois || [])].reverse().slice(0, 5).map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span className="truncate flex-1">{h.to} — {h.sujet}</span>
              <span className="text-muted-foreground flex-shrink-0">{fmtDate(h.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AutomationFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    await base44.entities.EmailAutomation.create({ ...form, nb_envois: 0, historique_envois: [] });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <p className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Nouvelle automation email</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Déclencheur</label>
              <select value={form.trigger} onChange={e => set("trigger", e.target.value)} className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {TRIGGERS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Type d'email</label>
              <select value={form.type_email} onChange={e => set("type_email", e.target.value)} className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {TYPE_EMAILS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Module (condition)</label>
              <select value={form.condition_module} onChange={e => set("condition_module", e.target.value)} className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {MODULES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Délai (heures)</label>
              <Input type="number" min="0" value={form.delai_heures} onChange={e => set("delai_heures", Number(e.target.value))} className="h-9 text-sm rounded-xl" />
            </div>
          </div>

          <div>
            <label className="label-field">Sujet (optionnel — variables: {"{client}"} {"{bien}"} {"{dossier}"})</label>
            <Input value={form.sujet_template} onChange={e => set("sujet_template", e.target.value)}
              placeholder="Ex: Votre dossier {dossier} est en cours de traitement" className="h-9 text-sm rounded-xl" />
          </div>

          <div>
            <label className="label-field">Corps email (vide = IA génère automatiquement)</label>
            <textarea value={form.corps_template} onChange={e => set("corps_template", e.target.value)}
              rows={5} placeholder="Laisser vide pour que l'IA génère le contenu dynamiquement…"
              className="w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1"><Zap className="w-3 h-3" /> Génération IA automatique</p>
            <p className="text-xs text-blue-600">Si le corps est vide, l'IA génère un email personnalisé à chaque envoi en tenant compte du contexte (client, bien, dossier, statut).</p>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="outline" className="rounded-full flex-1 h-9 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="rounded-full flex-1 h-9 text-sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Créer l'automation"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EmailAutomationsTab() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(null);

  const load = async () => {
    const res = await base44.entities.EmailAutomation.list("-created_date", 100);
    setAutomations(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (automation) => {
    await base44.entities.EmailAutomation.update(automation.id, { actif: !automation.actif });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.EmailAutomation.delete(id);
    load();
  };

  const handleTest = async (automation) => {
    setTesting(automation.id);
    // Test avec données fictives
    await base44.functions.invoke("emailAutomation", {
      trigger: automation.trigger,
      source_type: automation.trigger.includes("dossier") ? "dossier"
        : automation.trigger.includes("paiement") ? "paiement"
        : automation.trigger.includes("ticket") ? "ticket" : "bien",
      source_id: "test-" + Date.now(),
      source_data: { type: automation.condition_module !== "tous" ? automation.condition_module : "location" },
      force: true,
    });
    setTesting(null);
    load();
  };

  const totalEnvois = automations.reduce((s, a) => s + (a.nb_envois || 0), 0);
  const actives = automations.filter(a => a.actif).length;

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Automations actives", value: actives, color: "text-green-600", bg: "bg-green-50", icon: Zap },
          { label: "Total règles", value: automations.length, color: "text-primary", bg: "bg-primary/10", icon: Mail },
          { label: "Emails envoyés", value: totalEnvois, color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flux expliqué */}
      <div className="bg-gradient-to-r from-primary/5 to-purple-50 border border-primary/15 rounded-2xl p-4">
        <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Comment fonctionne l'automation</p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          {["Événement SaaS", "→", "Règle déclenchée", "→", "IA génère email", "→", "Anti-doublon", "→", "Envoi + Journal"].map((s, i) => (
            <span key={i} className={s === "→" ? "text-primary/40" : "bg-white border border-border/30 px-2 py-0.5 rounded-full"}>{s}</span>
          ))}
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{automations.length} règle{automations.length > 1 ? "s" : ""} configurée{automations.length > 1 ? "s" : ""}</p>
        <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => setShowModal(true)}>
          <Plus className="w-3.5 h-3.5" /> Nouvelle règle
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border/50 p-12 text-center">
          <Zap className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-1">Aucune automation configurée</p>
          <p className="text-xs text-muted-foreground mb-4">Créez votre première règle pour envoyer des emails automatiquement</p>
          <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Créer une règle
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {automations.map(a => (
            <AutomationCard key={a.id} automation={a}
              onToggle={handleToggle} onDelete={handleDelete}
              onTest={handleTest} testing={testing} />
          ))}
        </div>
      )}

      {/* Info connexion automations */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Événements système connectés</p>
        <div className="space-y-2">
          {[
            { entity: "DossierImmobilier", events: "Création + Changement de statut", status: true },
            { entity: "Paiement", events: "Création + Changement de statut", status: true },
            { entity: "TicketIA", events: "Création de ticket", status: true },
            { entity: "Bien", events: "Changement de statut", status: true },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="font-medium">{r.entity}</span>
              <span className="text-muted-foreground flex-1">— {r.events}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {r.status ? "Actif" : "Inactif"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showModal && <AutomationFormModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}