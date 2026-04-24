import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useAgency } from "../../hooks/useAgency";
import RoleGuard from "@/components/admin/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, CheckCircle, Building2, Bot, ArrowRight, Mail, Globe } from "lucide-react";
import LandingEditor from "@/components/admin/landing/LandingEditor";

const PAGE_TABS = [
  { id: "agence", label: "🏢 Agence" },
  { id: "landing", label: "🌐 Landing Page" },
];

export default function AdminSettings() {
  const { agency, refetch } = useAgency();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pageTab, setPageTab] = useState("agence");

  useEffect(() => {
    if (agency) {
      setForm({
        name: agency.name || "",
        slogan: agency.slogan || "",
        email: agency.email || "",
        phone: agency.phone || "",
        address: agency.address || "",
        city: agency.city || "",
        postal_code: agency.postal_code || "",
        description: agency.description || "",
        expertise: agency.expertise || "",
        founded_year: agency.founded_year || "",
        primary_color: agency.primary_color || "#4F46E5",
        social_instagram: agency.social_instagram || "",
        social_linkedin: agency.social_linkedin || "",
      });
    } else {
      setForm({
        name: "", slogan: "", email: "", phone: "", address: "",
        city: "", postal_code: "", description: "", expertise: "",
        founded_year: "", primary_color: "#4F46E5", social_instagram: "", social_linkedin: ""
      });
    }
  }, [agency]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, founded_year: form.founded_year ? Number(form.founded_year) : undefined };
    if (agency) {
      await base44.entities.Agency.update(agency.id, payload);
    } else {
      await base44.entities.Agency.create(payload);
    }
    await refetch();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  if (!form) return (
    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-border/50 p-6">
      <h3 className="font-semibold mb-4 text-sm">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  return (
    <RoleGuard module="parametres">
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Paramètres
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configurez votre agence et personnalisez votre site public.
        </p>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-border/50 p-1.5 max-w-xs">
        {PAGE_TABS.map(t => (
          <button key={t.id} onClick={() => setPageTab(t.id)}
            className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${pageTab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-secondary/50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {pageTab === "landing" && agency && (
        <LandingEditor agency={agency} onSave={refetch} />
      )}

      {pageTab === "agence" && <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
        <Section title="Identité">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Nom de l'agence *</label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Immobilier Prestige" className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Couleur principale</label>
              <div className="flex gap-2">
                <input type="color" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="w-11 h-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="rounded-xl flex-1 font-mono text-sm" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Slogan</label>
            <Input value={form.slogan} onChange={(e) => set("slogan", e.target.value)} placeholder="Votre expert immobilier local" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Présentation</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Décrivez votre agence..." className="rounded-xl resize-none min-h-[90px]" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Zones d'expertise / spécialités</label>
            <Input value={form.expertise} onChange={(e) => set("expertise", e.target.value)} placeholder="Paris 8e, Neuilly, Boulogne..." className="rounded-xl" />
          </div>
        </Section>

        <Section title="Coordonnées">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email *</label>
              <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contact@agence.fr" className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Téléphone</label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01 23 45 67 89" className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Adresse</label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="12 Avenue des Champs-Élysées" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Ville</label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Paris" className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Code postal</label>
              <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} placeholder="75008" className="rounded-xl" />
            </div>
          </div>
        </Section>

        <Section title="Réseaux sociaux & informations">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Instagram</label>
              <Input value={form.social_instagram} onChange={(e) => set("social_instagram", e.target.value)} placeholder="@agence" className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">LinkedIn</label>
              <Input value={form.social_linkedin} onChange={(e) => set("social_linkedin", e.target.value)} placeholder="URL LinkedIn" className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Année de fondation</label>
            <Input type="number" value={form.founded_year} onChange={(e) => set("founded_year", e.target.value)} placeholder="1995" className="rounded-xl" />
          </div>
        </Section>

        {/* Gestion Emails IA */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-200/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Gestion emails IA</p>
                <p className="text-xs text-muted-foreground mt-0.5">Lecture, analyse, classification et réponse automatique aux emails entrants</p>
              </div>
            </div>
            <Link to="/admin/parametres/emails">
              <Button variant="outline" className="rounded-full gap-2 h-9 text-sm flex-shrink-0 border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white">
                Accéder <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          
          {/* Configuration guide */}
          <div className="bg-white/50 rounded-lg p-3 space-y-2 text-xs">
            <p className="font-semibold text-blue-700">✅ Envoi d'emails : déjà actif</p>
            <p className="text-muted-foreground">Les réponses IA peuvent être envoyées directement aux clients via la base44 Core integration.</p>
            
            <p className="font-semibold text-blue-700 mt-3">📧 Lecture d'emails entrants : à configurer</p>
            <p className="text-muted-foreground mb-2">Quand vous aurez vos accès Google/Outlook, vous pourrez :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
              <li>Autoriser Gmail/Outlook pour lire vos emails entrants</li>
              <li>Synchroniser automatiquement les emails en base de données</li>
              <li>Créer des webhooks pour traiter les nouveaux messages en temps réel</li>
            </ul>
          </div>
        </div>

        {/* Accueil IA */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Accueil IA — Standardiste intelligent</p>
              <p className="text-xs text-muted-foreground mt-0.5">Gestion automatique des appels, création de tickets, intégration Location & Vente</p>
            </div>
          </div>
          <Link to="/admin/parametres/accueil-ia">
            <Button variant="outline" className="rounded-full gap-2 h-9 text-sm flex-shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-white">
              Configurer <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <Button type="submit" className="rounded-full gap-2 px-6" disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Enregistré !" : "Enregistrer les paramètres"}
        </Button>
      </form>}
    </div>
    </RoleGuard>
  );
}