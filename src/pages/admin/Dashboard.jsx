import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAgency } from "../../hooks/useAgency";
import { Home, Users, TrendingUp, MessageSquare, ArrowUpRight, Brain, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import OnboardingChecklist from "../../components/onboarding/OnboardingChecklist.jsx";
import OnboardingAssistant from "../../components/onboarding/OnboardingAssistant.jsx";

export default function Dashboard() {
  const { agency } = useAgency();
  const [stats, setStats] = useState({ properties: 0, leads: 0, messages: 0, estimations: 0 });
  const [recentLeads, setRecentLeads] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      const [props, leads, msgs, ests] = await Promise.all([
        base44.entities.Property.list("-created_date", 5),
        base44.entities.Lead.list("-created_date", 5),
        base44.entities.ContactMessage.list("-created_date", 50),
        base44.entities.Estimation.list("-created_date", 50),
      ]);
      setStats({ properties: props.length, leads: leads.length, messages: msgs.length, estimations: ests.length });
      setRecentLeads(leads.slice(0, 4));
      setRecentProperties(props.slice(0, 4));
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: "Biens actifs", value: stats.properties, icon: Home, color: "bg-blue-50 text-blue-600", link: "/admin/biens" },
    { label: "Leads CRM", value: stats.leads, icon: Users, color: "bg-violet-50 text-violet-600", link: "/admin/crm" },
    { label: "Messages", value: stats.messages, icon: MessageSquare, color: "bg-green-50 text-green-600", link: "/admin/crm" },
    { label: "Estimations IA", value: stats.estimations, icon: Brain, color: "bg-orange-50 text-orange-600", link: "/admin/ia" },
  ];

  const statusColors = {
    nouveau: "bg-blue-100 text-blue-700",
    contacte: "bg-yellow-100 text-yellow-700",
    qualifie: "bg-green-100 text-green-700",
    en_cours: "bg-purple-100 text-purple-700",
    gagne: "bg-emerald-100 text-emerald-700",
    perdu: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour 👋 {agency?.name || "ImmoPilot"}
        </h1>
        <p className="text-muted-foreground mt-1">Voici le résumé de votre activité.</p>
      </div>

      <OnboardingChecklist user={user} onOpen={() => setAssistantOpen(true)} />
      <OnboardingAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} user={user} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Link key={i} to={s.link} className="bg-white rounded-2xl p-5 border border-border/50 hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4.5 h-4.5 w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-3xl font-bold">{loading ? "—" : s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Derniers leads</h2>
            <Link to="/admin/crm" className="text-sm text-primary hover:underline">Voir tout →</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun lead pour l'instant.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {lead.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[lead.status] || "bg-gray-100 text-gray-600"}`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Derniers biens</h2>
            <Link to="/admin/biens" className="text-sm text-primary hover:underline">Voir tout →</Link>
          </div>
          {recentProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun bien pour l'instant.</p>
          ) : (
            <div className="space-y-3">
              {recentProperties.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.city} · {p.surface}m² · {p.rooms}p</p>
                  </div>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p.price)}
                    {p.transaction === "location" && <span className="text-xs font-normal">/m</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary/10 via-accent to-primary/5 rounded-2xl p-6 flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">Module IA disponible</h3>
          <p className="text-sm text-muted-foreground mt-1">Générez des descriptions, estimez vos biens et scorez vos leads automatiquement.</p>
        </div>
        <Link to="/admin/ia" className="flex-shrink-0">
          <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
            Accéder à l'IA
          </button>
        </Link>
      </div>
    </div>
  );
}