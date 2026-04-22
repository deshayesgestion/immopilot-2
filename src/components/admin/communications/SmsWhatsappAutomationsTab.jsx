/**
 * SmsWhatsappAutomationsTab — Gestion des règles SMS/WhatsApp automatiques
 * Intégré dans HubCommunication (onglet Automations)
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare, Plus, X, Loader2, CheckCircle2, Zap,
  ToggleLeft, ToggleRight, FolderOpen, CreditCard, TicketIcon,
  Home, Play, History, Phone, Bot
} from "lucide-react";

const TRIGGERS = [
  { v: "dossier_cree",          l: "Dossier créé",               icon: FolderOpen, color: "text-indigo-600 bg-indigo-50" },
  { v: "dossier_statut_change", l: "Changement statut dossier",  icon: FolderOpen, color: "text-purple-600 bg-purple-50" },
  { v: "bien_statut_change",    l: "Changement statut bien",     icon: Home,        color: "text-blue-600 bg-blue-50" },
  { v: "paiement_enregistre",   l: "Paiement enregistré",        icon: CreditCard,  color: "text-green-600 bg-green-50" },
  { v: "ticket_cree",           l: "Ticket IA créé",             icon: TicketIcon,  color: "text-amber-600 bg-amber-50" },
  { v: "activite_client",       l: "Activité client portail",    icon: Phone,       color: "text-gray-600 bg-gray-50" },
];

const TYPE_MESSAGES = [
  { v: "confirmation_visite", l: "Confirmation visite" },
  { v: "rappel_rdv",          l: "Rappel rendez-vous" },
  { v: "rappel_paiement",     l: "Rappel paiement" },
  { v: "maj_dossier",         l: "Mise à jour dossier" },
  { v: "nouveau_bien",        l: "Nouveau bien disponible" },
  { v: "bienvenue",           l: "Message de bienvenue" },
];

const CANAUX = [
  { v: "sms",      l: "SMS",           color: "bg-blue-100 text-blue-700", icon: Phone },
  { v: "whatsapp", l: "WhatsApp",      color: "bg-green-100 text-green-700", icon: MessageSquare },
  { v: "les_deux", l: "SMS + WhatsApp", color: "bg-purple-100 text-purple-700", icon: Zap },
];

const EMPTY_FORM = {
  trigger: "dossier_cree",
  type_message: "confirmation_visite",
  canal: "sms",
  condition_module: "tous",
  template: "",
  actif: true,
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function AutomationCard({ automation, onToggle, onDelete, onTest, testing }) {
  const [showHistory, setShowHistory] = useState(false);
  const trigger = TRIGGERS.find(t => t.v === automation.trigger);
  const canal = CANAUX.find(c => c.v === automation.canal);
  const TrigIcon = trigger?.icon || Zap;
  const CanalIcon = canal?.icon || MessageSquare;

  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-3 transition-all ${automation.actif ? "border-border/50" : "border-dashed border-border/30 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${trigger?.color || "text-gray-500 bg-gray-50"}`}>
            <TrigIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{TYPE_MESSAGES.find(t => t.v === automation.type_message)?.l || automation.type_message}</p>
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
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${canal?.color || "bg-gray-100 text-gray-500"}`}>
          <CanalIcon className="w-2.5 h-2.5" />{canal?.l || automation.canal}
        </span>
        {automation.condition_module && automation.condition_module !== "tous" && (
          <span className="text-[10px] bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full capitalize">{automation.condition_module}</span>
        )}
        {automation.template ? (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Template perso</span>
        ) : (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
            <Bot className="w-2.5 h-2.5" /> Contenu IA
          </span>
        )}
      </div>

      {automation.template && (
        <p className="text-xs text-muted-foreground truncate italic">"{automation.template.substring(0, 80)}…"</p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="w-3 h-3" />
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
            <div key={i} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="truncate">{h.to_nom || h.to_phone || h.to_email} — <span className="uppercase text-[10px] font-semibold">{h.canal}</span></p>
                <p className="text-muted-foreground text-[10px] truncate">{h.contenu?.substring(0, 60)}</p>
              </div>
              <span className="text-muted-foreground flex-shrink-0 text-[10px]">{fmtDate(h.date)}</span>
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
    await base44.entities.MessageAutomation.create({ ...form, nb_envois: 0, historique_envois: [] });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <p className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" /> Nouvelle automation SMS/WhatsApp
          </p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Déclencheur</label>
              <select value={form.trigger} onChange={e => set("trigger", e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {TRIGGERS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Type de message</label>
              <select value={form.type_message} onChange={e => set("type_message", e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {TYPE_MESSAGES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
          </div>

          {/* Canal selector */}
          <div>
            <label className="label-field">Canal d'envoi</label>
            <div className="flex gap-2">
              {CANAUX.map(c => {
                const Icon = c.icon;
                return (
                  <button key={c.v} onClick={() => set("canal", c.v)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${
                      form.canal === c.v ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                    }`}>
                    <Icon className="w-3.5 h-3.5" />{c.l}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label-field">Module (condition)</label>
            <select value={form.condition_module} onChange={e => set("condition_module", e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
              <option value="tous">Tous modules</option>
              <option value="location">Location uniquement</option>
              <option value="vente">Vente uniquement</option>
              <option value="comptabilite">Comptabilité uniquement</option>
            </select>
          </div>

          <div>
            <label className="label-field">
              Template message (vide = IA génère · variables: {"{client}"} {"{bien}"} {"{dossier}"} {"{montant}"} {"{date}"})
            </label>
            <textarea
              value={form.template}
              onChange={e => set("template", e.target.value)}
              rows={4}
              placeholder={`Ex: Bonjour {client}, votre dossier {dossier} a été mis à jour. Votre agence.`}
              className="w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {form.canal === "sms" && (
              <p className="text-[10px] text-muted-foreground mt-1">SMS : max 160 caractères recommandé ({form.template.length}/160)</p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1"><Bot className="w-3 h-3" /> Génération IA automatique</p>
            <p className="text-xs text-green-600">Si le template est vide, l'IA génère un message personnalisé selon le contexte (client, bien, dossier, montant). Le message est adapté au canal (SMS court / WhatsApp détaillé).</p>
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

export default function SmsWhatsappAutomationsTab() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(null);

  const load = async () => {
    const res = await base44.entities.MessageAutomation.list("-created_date", 100);
    setAutomations(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (automation) => {
    await base44.entities.MessageAutomation.update(automation.id, { actif: !automation.actif });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.MessageAutomation.delete(id);
    load();
  };

  const handleTest = async (automation) => {
    setTesting(automation.id);
    await base44.functions.invoke("smsWhatsappAutomation", {
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

  const stats = {
    total: automations.length,
    actives: automations.filter(a => a.actif).length,
    sms: automations.filter(a => a.canal === "sms" || a.canal === "les_deux").length,
    wa: automations.filter(a => a.canal === "whatsapp" || a.canal === "les_deux").length,
    envois: automations.reduce((s, a) => s + (a.nb_envois || 0), 0),
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Règles actives",  value: stats.actives, color: "text-green-600",  bg: "bg-green-50",   icon: Zap },
          { label: "Règles SMS",      value: stats.sms,     color: "text-blue-600",   bg: "bg-blue-50",    icon: Phone },
          { label: "Règles WhatsApp", value: stats.wa,      color: "text-green-700",  bg: "bg-green-100",  icon: MessageSquare },
          { label: "Messages envoyés",value: stats.envois,  color: "text-primary",    bg: "bg-primary/10", icon: CheckCircle2 },
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

      {/* Flux */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200/50 rounded-2xl p-4">
        <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Flux multicanal automatisé
        </p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          {["Événement SaaS", "→", "Règle déclenchée", "→", "IA personnalise", "→", "SMS / WhatsApp", "→", "Journal HubComm"].map((s, i) => (
            <span key={i} className={s === "→" ? "text-green-400" : "bg-white border border-border/30 px-2 py-0.5 rounded-full"}>{s}</span>
          ))}
        </div>
      </div>

      {/* Note intégration téléphonie */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Phone className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-700">Intégration téléphonie requise pour envoi réel</p>
          <p className="text-xs text-amber-600 mt-0.5">Les messages sont générés et journalisés automatiquement. Pour l'envoi SMS/WA réel, connectez Twilio, Vonage ou OVH SMS dans vos paramètres. En attendant, les messages apparaissent dans le Hub Communication.</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">{automations.length} règle{automations.length > 1 ? "s" : ""} configurée{automations.length > 1 ? "s" : ""}</p>
        <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => setShowModal(true)}>
          <Plus className="w-3.5 h-3.5" /> Nouvelle règle
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border/50 p-12 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-4">Aucune automation SMS/WhatsApp configurée</p>
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

      {showModal && <AutomationFormModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}