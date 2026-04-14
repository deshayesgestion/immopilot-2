import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Mail, Plus, Loader2, BarChart2, Inbox, Settings,
  RefreshCw, Bot, CheckCircle2, Clock, AlertTriangle, TicketIcon
} from "lucide-react";
import EmailInbox from "../../components/admin/emails/EmailInbox";
import EmailDetail from "../../components/admin/emails/EmailDetail";
import EmailComposeModal from "../../components/admin/emails/EmailComposeModal";

const TABS = [
  { id: "inbox", label: "Boîte de réception", icon: Inbox },
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "config", label: "Configuration", icon: Settings },
];

export default function GestionEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [analysingId, setAnalysingId] = useState(null);
  const [analysingAll, setAnalysingAll] = useState(false);

  const load = async () => {
    const res = await base44.entities.EmailEntrant.list("-date_reception", 200);
    setEmails(res);
    setLoading(false);
    // Refresh selected email
    if (selectedEmail) {
      const updated = res.find(e => e.id === selectedEmail.id);
      if (updated) setSelectedEmail(updated);
    }
  };

  useEffect(() => { load(); }, []);

  const analyseEmail = async (emailId) => {
    setAnalysingId(emailId);
    await base44.functions.invoke("analyserEmail", { email_id: emailId });
    setAnalysingId(null);
    load();
  };

  const analyserTous = async () => {
    setAnalysingAll(true);
    const nonAnalyses = emails.filter(e => !e.resume_ia && e.statut !== "archive");
    for (const email of nonAnalyses) {
      await base44.functions.invoke("analyserEmail", { email_id: email.id });
    }
    setAnalysingAll(false);
    load();
  };

  const stats = {
    total: emails.length,
    non_lus: emails.filter(e => e.statut === "non_lu").length,
    urgents: emails.filter(e => e.priorite === "urgent").length,
    traites: emails.filter(e => e.statut === "traite" || e.statut === "archive").length,
    avec_ticket: emails.filter(e => e.ticket_id).length,
    analyzes: emails.filter(e => e.resume_ia).length,
    par_module: {
      location: emails.filter(e => e.module === "location").length,
      vente: emails.filter(e => e.module === "vente").length,
      comptabilite: emails.filter(e => e.module === "comptabilite").length,
    },
    par_intention: emails.reduce((acc, e) => {
      if (e.intention) acc[e.intention] = (acc[e.intention] || 0) + 1;
      return acc;
    }, {}),
  };

  const INTENTION_LABELS = {
    incident_logement: "Incidents logement",
    demande_visite: "Demandes visite",
    question_administrative: "Questions admin",
    paiement_facture: "Paiements/Factures",
    demande_information: "Demandes info",
    lead: "Leads prospects",
    autre: "Autres",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Gestion emails IA
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Lecture, analyse et traitement intelligent des emails entrants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full gap-2 h-9 text-sm" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          {emails.filter(e => !e.resume_ia).length > 0 && (
            <Button variant="outline" className="rounded-full gap-2 h-9 text-sm" onClick={analyserTous} disabled={analysingAll}>
              {analysingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
              Tout analyser ({emails.filter(e => !e.resume_ia).length})
            </Button>
          )}
          <Button className="rounded-full gap-2 h-9 text-sm" onClick={() => setShowCompose(true)}>
            <Plus className="w-3.5 h-3.5" /> Importer email
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 shadow-sm p-1.5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                activeTab === tab.id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "inbox" && stats.non_lus > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20" : "bg-primary text-white"}`}>
                  {stats.non_lus}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── INBOX ── */}
      {activeTab === "inbox" && (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="flex h-full">
              {/* Left panel — list */}
              <div className={`border-r border-border/50 flex-shrink-0 overflow-hidden flex flex-col ${selectedEmail ? "w-80" : "w-full max-w-xl mx-auto"}`}>
                <EmailInbox
                  emails={emails}
                  selectedId={selectedEmail?.id}
                  onSelect={(e) => setSelectedEmail(e)}
                  onAnalyse={analyseEmail}
                  analysingId={analysingId}
                />
              </div>

              {/* Right panel — detail */}
              {selectedEmail && (
                <div className="flex-1 overflow-hidden">
                  <EmailDetail
                    email={selectedEmail}
                    onUpdate={load}
                    onClose={() => setSelectedEmail(null)}
                  />
                </div>
              )}

              {/* Empty state */}
              {!selectedEmail && emails.length > 0 && (
                <div className="hidden lg:flex flex-1 items-center justify-center text-center">
                  <div>
                    <Mail className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Sélectionnez un email pour le lire</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total emails", value: stats.total, icon: Mail, color: "text-primary", bg: "bg-primary/10" },
              { label: "Non lus", value: stats.non_lus, icon: Inbox, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Urgents", value: stats.urgents, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
              { label: "Traités", value: stats.traites, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
              { label: "Tickets générés", value: stats.avec_ticket, icon: TicketIcon, color: "text-purple-600", bg: "bg-purple-50" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-border/50 p-4">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Par module */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Location", value: stats.par_module.location, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Vente", value: stats.par_module.vente, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Comptabilité", value: stats.par_module.comptabilite, color: "text-green-600", bg: "bg-green-50" },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl border border-border/50 p-4 text-center">
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Par intention */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <p className="text-sm font-semibold mb-4">Répartition par intention</p>
            <div className="space-y-3">
              {Object.entries(stats.par_intention).sort((a, b) => b[1] - a[1]).map(([intention, count]) => {
                const pct = stats.analyzes > 0 ? Math.round((count / stats.analyzes) * 100) : 0;
                return (
                  <div key={intention} className="flex items-center gap-3">
                    <p className="text-xs w-40 text-muted-foreground">{INTENTION_LABELS[intention] || intention}</p>
                    <div className="flex-1 h-2 bg-secondary/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs font-semibold w-8 text-right">{count}</p>
                  </div>
                );
              })}
              {Object.keys(stats.par_intention).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun email analysé — cliquez "Tout analyser" pour commencer</p>
              )}
            </div>
          </div>

          {/* Taux analyse */}
          <div className="bg-white rounded-2xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Taux d'analyse IA</p>
              <p className="text-sm font-bold text-primary">
                {stats.total > 0 ? Math.round((stats.analyzes / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.analyzes / stats.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-muted-foreground">{stats.analyzes} analysés</p>
              <p className="text-xs text-muted-foreground">{stats.total - stats.analyzes} en attente</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIG ── */}
      {activeTab === "config" && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
            <p className="text-sm font-semibold">Connexion boîte email (à venir)</p>
            <div className="space-y-3">
              {[
                { name: "Gmail", desc: "Connexion OAuth Google — synchronisation automatique", soon: false },
                { name: "Outlook / Microsoft 365", desc: "Connexion OAuth Microsoft — emails entrants", soon: false },
                { name: "IMAP générique", desc: "Connexion à n'importe quelle boîte IMAP", soon: true },
              ].map(item => (
                <div key={item.name} className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  {item.soon ? (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">Bientôt</span>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-full h-8 text-xs">Connecter</Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/50 p-5 space-y-4">
            <p className="text-sm font-semibold">Automatisations email</p>
            <div className="space-y-2">
              {[
                { trigger: "Email = incident logement", action: "Créer ticket Location + alerte agent", actif: true },
                { trigger: "Email = demande visite", action: "Créer ticket Vente + proposer créneaux", actif: true },
                { trigger: "Email = paiement/facture", action: "Rediriger vers Comptabilité + créer ticket", actif: true },
                { trigger: "Email = prospect inconnu", action: "Créer Lead + réponse confirmation automatique", actif: true },
                { trigger: "Email urgent", action: "Alerte email immédiate à l'agent responsable", actif: true },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-secondary/20 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">Si : {r.trigger}</p>
                    <p className="text-xs text-muted-foreground">→ {r.action}</p>
                  </div>
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Actif</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCompose && (
        <EmailComposeModal
          onClose={() => setShowCompose(false)}
          onCreated={(email) => { load(); setSelectedEmail(email); setActiveTab("inbox"); }}
        />
      )}
    </div>
  );
}