import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Home, User, Euro, FileText, Clock, Plus, X,
  Loader2, Edit2, Save, ChevronRight, TrendingUp, KeySquare, StickyNote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUT_CONFIG = {
  nouveau:   { label: "Nouveau",   color: "bg-slate-100 text-slate-600" },
  en_cours:  { label: "En cours",  color: "bg-blue-100 text-blue-700" },
  signe:     { label: "Signé",     color: "bg-green-100 text-green-700" },
  termine:   { label: "Terminé",   color: "bg-purple-100 text-purple-700" },
};

const TYPE_CONFIG = {
  vente:    { label: "Vente",    icon: TrendingUp, color: "text-blue-600",   bg: "bg-blue-50" },
  location: { label: "Location", icon: KeySquare,  color: "text-emerald-600", bg: "bg-emerald-50" },
};

function Section({ icon: Icon, title, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function DossierImmobilierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dossier, setDossier] = useState(null);
  const [bien, setBien] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [editingStatut, setEditingStatut] = useState(false);
  const [newHistorique, setNewHistorique] = useState("");

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    setLoading(true);
    const [d, allC] = await Promise.all([
      base44.entities.DossierImmobilier.filter({ id }),
      base44.entities.Contact.list("-created_date", 500),
    ]);
    const doc = d[0];
    if (!doc) { setLoading(false); return; }
    setDossier(doc);
    setNoteValue(doc.notes || "");
    setAllContacts(allC);

    const [bienData, contactsData, paiementsData, leadsData] = await Promise.all([
      doc.bien_id ? base44.entities.Bien.filter({ id: doc.bien_id }) : Promise.resolve([]),
      doc.contact_ids?.length ? Promise.all(doc.contact_ids.map(cid => base44.entities.Contact.filter({ id: cid }))) : Promise.resolve([]),
      doc.paiement_ids?.length ? Promise.all(doc.paiement_ids.map(pid => base44.entities.Paiement.filter({ id: pid }))) : Promise.resolve([]),
      doc.lead_ids?.length ? Promise.all(doc.lead_ids.map(lid => base44.entities.Lead.filter({ id: lid }))) : Promise.resolve([]),
    ]);

    setBien(bienData[0] || null);
    setContacts(contactsData.flat());
    setPaiements(paiementsData.flat());
    setLeads(leadsData.flat());
    setLoading(false);
  };

  const updateDossier = async (patch) => {
    const updated = await base44.entities.DossierImmobilier.update(dossier.id, patch);
    setDossier(prev => ({ ...prev, ...patch }));
    return updated;
  };

  const saveNote = async () => {
    setSavingNote(true);
    await updateDossier({ notes: noteValue });
    setEditingNote(false);
    setSavingNote(false);
  };

  const addHistorique = async () => {
    if (!newHistorique.trim()) return;
    const entry = { date: new Date().toISOString(), action: newHistorique.trim() };
    const hist = [...(dossier.historique || []), entry];
    await updateDossier({ historique: hist });
    setNewHistorique("");
  };

  const addContact = async () => {
    if (!selectedContactId) return;
    const ids = [...new Set([...(dossier.contact_ids || []), selectedContactId])];
    await updateDossier({ contact_ids: ids });
    const found = allContacts.find(c => c.id === selectedContactId);
    if (found) setContacts(prev => [...prev, found]);
    setSelectedContactId("");
    setAddingContact(false);
  };

  const removeContact = async (cid) => {
    const ids = (dossier.contact_ids || []).filter(id => id !== cid);
    await updateDossier({ contact_ids: ids });
    setContacts(prev => prev.filter(c => c.id !== cid));
  };

  const changeStatut = async (s) => {
    await updateDossier({ statut: s });
    setEditingStatut(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!dossier) return (
    <div className="text-center py-32 text-muted-foreground">Dossier introuvable</div>
  );

  const typeConf = TYPE_CONFIG[dossier.type] || {};
  const TypeIcon = typeConf.icon || Home;
  const statutConf = STATUT_CONFIG[dossier.statut] || {};

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`p-1.5 rounded-lg ${typeConf.bg}`}>
              <TypeIcon className={`w-4 h-4 ${typeConf.color}`} />
            </div>
            <h1 className="text-xl font-bold truncate">{dossier.titre}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statutConf.color}`}>
              {statutConf.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-9">
            {typeConf.label} · Créé le {new Date(dossier.created_date).toLocaleDateString("fr-FR")}
          </p>
        </div>
        {/* Statut quick-change */}
        <div className="relative">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setEditingStatut(v => !v)}>
            <Edit2 className="w-3.5 h-3.5" /> Statut
          </Button>
          {editingStatut && (
            <div className="absolute right-0 top-10 bg-white border border-border rounded-2xl shadow-xl z-20 p-2 min-w-40">
              {Object.entries(STATUT_CONFIG).map(([k, v]) => (
                <button key={k} onClick={() => changeStatut(k)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-secondary transition-colors ${dossier.statut === k ? "font-semibold" : ""}`}>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mr-2 ${v.color}`}>{v.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bien associé */}
      <Section icon={Home} title="Bien associé">
        {bien ? (
          <div className="flex items-center gap-4 p-3 bg-secondary/40 rounded-xl">
            {bien.photo_principale ? (
              <img src={bien.photo_principale} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-16 h-12 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{bien.titre}</p>
              {bien.adresse && <p className="text-xs text-muted-foreground">{bien.adresse}</p>}
              <div className="flex items-center gap-2 mt-1">
                {bien.prix && <span className="text-sm font-bold">{bien.prix.toLocaleString("fr-FR")} €</span>}
                {bien.surface && <span className="text-xs text-muted-foreground">{bien.surface} m²</span>}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Bien non trouvé (ID: {dossier.bien_id})</p>
        )}
      </Section>

      {/* Contacts */}
      <Section icon={User} title={`Contacts (${contacts.length})`} action={
        <button onClick={() => setAddingContact(v => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      }>
        {addingContact && (
          <div className="flex gap-2 mb-4">
            <select
              value={selectedContactId}
              onChange={e => setSelectedContactId(e.target.value)}
              className="flex-1 h-9 text-sm border border-input rounded-xl px-3 bg-white"
            >
              <option value="">Choisir un contact…</option>
              {allContacts.filter(c => !(dossier.contact_ids || []).includes(c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.nom} {c.type ? `(${c.type})` : ""}</option>
              ))}
            </select>
            <Button size="sm" className="rounded-xl" onClick={addContact} disabled={!selectedContactId}>
              Lier
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setAddingContact(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun contact lié</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-xs font-bold">
                    {c.nom?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.nom}</p>
                    <p className="text-xs text-muted-foreground">{c.type || "—"} {c.email ? `· ${c.email}` : ""}</p>
                  </div>
                </div>
                <button onClick={() => removeContact(c.id)} className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Paiements */}
      <Section icon={Euro} title={`Paiements (${paiements.length})`}>
        {paiements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement lié</p>
        ) : (
          <div className="space-y-2">
            {paiements.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl text-sm">
                <span className="font-medium">{p.type || "Paiement"}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{p.montant?.toLocaleString("fr-FR")} €</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.statut === "paye" ? "bg-green-100 text-green-700" :
                    p.statut === "en_retard" ? "bg-red-100 text-red-600" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{p.statut}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Notes */}
      <Section icon={StickyNote} title="Notes" action={
        editingNote ? (
          <button onClick={saveNote} disabled={savingNote}
            className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
            {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Enregistrer
          </button>
        ) : (
          <button onClick={() => setEditingNote(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Edit2 className="w-3.5 h-3.5" /> Modifier
          </button>
        )
      }>
        {editingNote ? (
          <textarea
            value={noteValue}
            onChange={e => setNoteValue(e.target.value)}
            rows={5}
            placeholder="Saisir des notes internes…"
            className="w-full border border-input rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {dossier.notes || "Aucune note"}
          </p>
        )}
      </Section>

      {/* Historique */}
      <Section icon={Clock} title="Historique">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newHistorique}
              onChange={e => setNewHistorique(e.target.value)}
              placeholder="Ajouter une action à l'historique…"
              className="rounded-xl text-sm"
              onKeyDown={e => e.key === "Enter" && addHistorique()}
            />
            <Button size="sm" className="rounded-xl" onClick={addHistorique} disabled={!newHistorique.trim()}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {(dossier.historique || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun historique</p>
          ) : (
            <div className="space-y-2 mt-2">
              {[...(dossier.historique || [])].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p>{h.action}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}