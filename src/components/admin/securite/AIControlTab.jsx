import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Power, Shield, AlertTriangle, CheckCircle2, Loader2,
  ToggleRight, ToggleLeft, Lock, Unlock, Settings, Save
} from "lucide-react";

const AGENTS = [
  { id: "agent_vente",        label: "Agent Vente",        emoji: "📈" },
  { id: "agent_location",     label: "Agent Location",     emoji: "🏠" },
  { id: "agent_comptabilite", label: "Agent Comptabilité", emoji: "💰" },
  { id: "agent_support",      label: "Agent Support",      emoji: "🎧" },
  { id: "accueil_ia",         label: "Accueil IA",         emoji: "🤖" },
  { id: "email_ia",           label: "Email IA",           emoji: "📧" },
  { id: "relance_ia",         label: "Relance IA",         emoji: "🔔" },
  { id: "rounded",            label: "Rounded",            emoji: "📞" },
];

const DEFAULT_CONFIG = {
  all_ai_suspended: false,
  require_human_validation: false,
  can_modify_data: true,
  can_send_messages: true,
  can_financial_actions: false,
  max_actions_per_day: 200,
  max_messages_per_client_day: 3,
  min_delay_between_actions_minutes: 5,
  alert_on_volume_threshold: 50,
  alert_email: "",
};

export default function AIControlTab() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [configId, setConfigId] = useState(null);
  const [agentStates, setAgentStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.AISecurityConfig.filter({ config_key: "global" }),
      ...AGENTS.map(a => base44.entities.AISecurityConfig.filter({ config_key: a.id }))
    ]).then(([globalRes, ...agentRes]) => {
      if (globalRes[0]) {
        setConfig({ ...DEFAULT_CONFIG, ...globalRes[0] });
        setConfigId(globalRes[0].id);
      }
      const states = {};
      agentRes.forEach((res, i) => {
        states[AGENTS[i].id] = res[0]?.agent_enabled !== false;
      });
      setAgentStates(states);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setConfig(prev => ({ ...prev, [k]: v }));

  const toggleAgent = async (agentId) => {
    const current = agentStates[agentId] !== false;
    setAgentStates(prev => ({ ...prev, [agentId]: !current }));
    const existing = await base44.entities.AISecurityConfig.filter({ config_key: agentId });
    if (existing[0]) {
      await base44.entities.AISecurityConfig.update(existing[0].id, { agent_enabled: !current });
    } else {
      await base44.entities.AISecurityConfig.create({ config_key: agentId, agent_enabled: !current });
    }
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...config, config_key: "global" };
    if (configId) {
      await base44.entities.AISecurityConfig.update(configId, payload);
    } else {
      const created = await base44.entities.AISecurityConfig.create(payload);
      setConfigId(created.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Arrêt d'urgence global */}
      <div className={`rounded-2xl border p-5 ${config.all_ai_suspended ? "bg-red-50 border-red-300" : "bg-green-50 border-green-200"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.all_ai_suspended ? "bg-red-100" : "bg-green-100"}`}>
              {config.all_ai_suspended ? <Power className="w-5 h-5 text-red-600" /> : <Power className="w-5 h-5 text-green-600" />}
            </div>
            <div>
              <p className="text-sm font-bold">{config.all_ai_suspended ? "🔴 IA globalement suspendue" : "🟢 IA opérationnelle"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.all_ai_suspended ? "Toutes les actions IA sont bloquées" : "Tous les agents IA fonctionnent normalement"}
              </p>
            </div>
          </div>
          <Button
            variant={config.all_ai_suspended ? "default" : "destructive"}
            className="rounded-full gap-2 flex-shrink-0"
            onClick={() => set("all_ai_suspended", !config.all_ai_suspended)}>
            {config.all_ai_suspended ? <><Unlock className="w-4 h-4" /> Réactiver l'IA</> : <><Power className="w-4 h-4" /> Suspendre l'IA</>}
          </Button>
        </div>
      </div>

      {/* Activation par agent */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Contrôle par agent</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AGENTS.map(agent => {
            const isEnabled = agentStates[agent.id] !== false;
            return (
              <div key={agent.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isEnabled ? "border-green-200 bg-green-50" : "border-border/30 bg-secondary/10"
              }`}>
                <span className="text-lg">{agent.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{agent.label}</p>
                  <p className={`text-[10px] ${isEnabled ? "text-green-600" : "text-muted-foreground"}`}>
                    {isEnabled ? "Actif" : "Désactivé"}
                  </p>
                </div>
                <button onClick={() => toggleAgent(agent.id)}>
                  {isEnabled
                    ? <ToggleRight className="w-6 h-6 text-green-500" />
                    : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions IA */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Permissions globales</h3>
        <div className="space-y-3">
          {[
            { key: "require_human_validation", label: "Exiger validation humaine", desc: "Toutes les actions IA nécessitent une approbation manuelle avant exécution" },
            { key: "can_modify_data", label: "Autoriser modification de données", desc: "L'IA peut créer et mettre à jour des enregistrements" },
            { key: "can_send_messages", label: "Autoriser envoi de messages", desc: "L'IA peut envoyer emails, SMS et WhatsApp" },
            { key: "can_financial_actions", label: "Autoriser actions financières", desc: "L'IA peut créer des paiements et modifier des montants" },
          ].map(perm => (
            <div key={perm.key} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              config[perm.key] ? "border-primary/20 bg-primary/5" : "border-border/30 bg-secondary/20"
            }`}>
              <div className="flex-1">
                <p className="text-sm font-medium">{perm.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{perm.desc}</p>
              </div>
              <button onClick={() => set(perm.key, !config[perm.key])}>
                {config[perm.key]
                  ? <ToggleRight className="w-7 h-7 text-primary" />
                  : <ToggleLeft className="w-7 h-7 text-gray-300" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Anti-spam / Anti-boucle */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Anti-spam & Limites</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "max_actions_per_day", label: "Actions max / jour (global)", type: "number", placeholder: "200" },
            { key: "max_messages_per_client_day", label: "Messages max / client / jour", type: "number", placeholder: "3" },
            { key: "min_delay_between_actions_minutes", label: "Délai min entre actions (min)", type: "number", placeholder: "5" },
            { key: "alert_on_volume_threshold", label: "Alerte si volume > (actions/heure)", type: "number", placeholder: "50" },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs text-muted-foreground mb-1.5 block">{field.label}</label>
              <Input
                type={field.type}
                value={config[field.key] || ""}
                onChange={e => set(field.key, Number(e.target.value))}
                placeholder={field.placeholder}
                className="h-9 rounded-xl text-sm"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Email d'alerte</label>
          <Input
            type="email"
            value={config.alert_email || ""}
            onChange={e => set("alert_email", e.target.value)}
            placeholder="admin@agence.fr"
            className="h-9 rounded-xl text-sm max-w-sm"
          />
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="rounded-full gap-2 px-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
         saved ? <><CheckCircle2 className="w-4 h-4" /> Enregistré !</> :
         <><Save className="w-4 h-4" /> Enregistrer la configuration</>}
      </Button>
    </div>
  );
}