import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Home, Loader2, Clock, CheckCircle2, MapPin, TrendingUp } from "lucide-react";

const fmtDate = (d) => d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

export default function AcquereurVisites() {
  const [leads, setLeads] = useState([]);
  const [biensMap, setBiensMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();

      const [contacts, allBiens] = await Promise.all([
        base44.entities.Contact.filter({ email: me.email }, "-created_date", 5),
        base44.entities.Bien.list("-created_date", 300),
      ]);

      const myContact = contacts[0] || null;
      const bMap = Object.fromEntries(allBiens.map(b => [b.id, b]));
      setBiensMap(bMap);

      let myLeads = [];
      if (myContact) {
        myLeads = await base44.entities.Lead.filter({ contact_id: myContact.id }, "-created_date", 50);
      }
      setLeads(myLeads);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const STATUT_LEAD = {
    nouveau:   { label: "Nouveau",   color: "bg-slate-100 text-slate-600" },
    contacte:  { label: "Contacté",  color: "bg-blue-100 text-blue-700" },
    qualifie:  { label: "Qualifié",  color: "bg-purple-100 text-purple-700" },
    perdu:     { label: "Perdu",     color: "bg-red-100 text-red-600" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes visites & biens suivis</h1>
        <p className="text-sm text-muted-foreground mt-1">Biens en cours de prospection et visites</p>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/50 p-10 text-center space-y-3">
          <Calendar className="w-10 h-10 text-muted-foreground/20 mx-auto" />
          <p className="font-semibold">Aucune visite planifiée</p>
          <p className="text-sm text-muted-foreground">Votre conseiller vous proposera des créneaux de visites.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-border/50 p-4 text-center">
              <p className="text-lg font-bold text-blue-600">{leads.length}</p>
              <p className="text-xs text-muted-foreground">Biens suivis</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-4 text-center">
              <p className="text-lg font-bold text-purple-600">{leads.filter(l => l.statut === "qualifie").length}</p>
              <p className="text-xs text-muted-foreground">Qualifiés</p>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-4 text-center">
              <p className="text-lg font-bold text-green-600">{leads.filter(l => l.statut === "contacte" || l.statut === "qualifie").length}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </div>

          {/* Liste des biens suivis */}
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <p className="text-sm font-semibold">Biens en cours de suivi</p>
            </div>
            <div className="divide-y divide-border/30">
              {leads.map((lead) => {
                const bien = biensMap[lead.bien_id];
                const statut = STATUT_LEAD[lead.statut] || { label: lead.statut, color: "bg-secondary text-muted-foreground" };
                return (
                  <div key={lead.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Home className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{bien?.titre || "Bien"}</p>
                      {bien?.adresse && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{bien.adresse}
                        </p>
                      )}
                      {bien?.surface && (
                        <p className="text-xs text-muted-foreground mt-0.5">{bien.surface}m² · {bien.nb_pieces || "—"}p</p>
                      )}
                      {lead.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">{lead.notes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {bien?.prix && (
                        <p className="text-sm font-bold text-purple-700 mb-1">{fmt(bien.prix)}</p>
                      )}
                      {lead.score != null && (
                        <p className="text-xs text-muted-foreground mb-1">Score : {lead.score}/100</p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statut.color}`}>
                        {statut.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}