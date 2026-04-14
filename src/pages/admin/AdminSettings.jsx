import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useAgency } from "../../hooks/useAgency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, CheckCircle, Building2, Bot, ArrowRight } from "lucide-react";

export default function AdminSettings() {
  const { agency, refetch } = useAgency();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Paramètres de l'agence
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ces informations apparaissent sur le site public. <span className="text-primary font-medium">agency_id : {agency?.id || "non créé"}</span>
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
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
      </form>
    </div>
  );
}