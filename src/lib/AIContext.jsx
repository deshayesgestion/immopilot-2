import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * AIContext — Cerveau global IA du SaaS
 * Actif par défaut, tourne en fond dans AdminLayout.
 * Expose : statut agents, métriques temps réel, logs IA, toggles.
 */

const AIContext = createContext(null);

const AGENT_IDS = ["agent_vente", "agent_location", "agent_comptabilite", "agent_support"];

// Calcul d'alertes automatiques depuis les données brutes
function computeAIAlerts(data) {
  if (!data) return [];
  const alerts = [];
  const now = new Date();

  // Loyers en retard
  const retards = (data.paiements || []).filter(p => p.statut === "en_retard");
  if (retards.length > 0) {
    alerts.push({ id: "loyers_retard", agent: "agent_location", level: retards.length > 3 ? "critical" : "warning", message: `${retards.length} loyer${retards.length > 1 ? "s" : ""} en retard détecté${retards.length > 1 ? "s" : ""}`, action: "/admin/modules/location", ts: now });
  }

  // Leads non contactés depuis 7j
  const leadsInactifs = (data.leads || []).filter(l => {
    if (l.statut === "perdu") return false;
    const age = (now - new Date(l.updated_date)) / 86400000;
    return age > 7;
  });
  if (leadsInactifs.length > 0) {
    alerts.push({ id: "leads_inactifs", agent: "agent_vente", level: "warning", message: `${leadsInactifs.length} lead${leadsInactifs.length > 1 ? "s" : ""} sans contact depuis 7j`, action: "/admin/modules/vente", ts: now });
  }

  // Tickets urgents non résolus
  const urgents = (data.tickets || []).filter(t => t.priorite === "urgent" && t.statut !== "resolu");
  if (urgents.length > 0) {
    alerts.push({ id: "tickets_urgents", agent: "agent_support", level: "critical", message: `${urgents.length} ticket${urgents.length > 1 ? "s" : ""} urgent${urgents.length > 1 ? "s" : ""} non résolu${urgents.length > 1 ? "s" : ""}`, action: "/admin/parametres/accueil-ia", ts: now });
  }

  // Paiements en attente >30j
  const attente30 = (data.paiements || []).filter(p => {
    if (p.statut !== "en_attente") return false;
    const age = (now - new Date(p.created_date)) / 86400000;
    return age > 30;
  });
  if (attente30.length > 0) {
    alerts.push({ id: "paiements_bloques", agent: "agent_comptabilite", level: "warning", message: `${attente30.length} paiement${attente30.length > 1 ? "s" : ""} en attente depuis +30j`, action: "/admin/modules/comptabilite", ts: now });
  }

  return alerts;
}

// Compute lightweight metrics
function computeMetrics(data) {
  if (!data) return null;
  const paiements = data.paiements || [];
  const leads = data.leads || [];
  const tickets = data.tickets || [];
  return {
    loyersEnRetard: paiements.filter(p => p.statut === "en_retard").length,
    leadsActifs: leads.filter(l => l.statut !== "perdu").length,
    leadsChauds: leads.filter(l => l.statut === "qualifie").length,
    ticketsUrgents: tickets.filter(t => t.priorite === "urgent" && t.statut !== "resolu").length,
    paiementsAttente: paiements.filter(p => p.statut === "en_attente").length,
    totalScore: paiements.filter(p => p.statut === "paye").reduce((s, p) => s + (p.montant || 0), 0),
  };
}

export function AIProvider({ children }) {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [agentStatus, setAgentStatus] = useState(
    // Tous actifs par défaut
    Object.fromEntries(AGENT_IDS.map(id => [id, true]))
  );
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  const addLog = useCallback((agentId, message, level = "info") => {
    setLogs(prev => [
      { id: Date.now(), agentId, message, level, ts: new Date() },
      ...prev.slice(0, 49), // garder les 50 derniers
    ]);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [leads, paiements, dossiers, contacts, tickets] = await Promise.all([
        base44.entities.Lead.list("-created_date", 200),
        base44.entities.Paiement.list("-created_date", 300),
        base44.entities.DossierImmobilier.list("-created_date", 200),
        base44.entities.Contact.list("-created_date", 200),
        base44.entities.TicketIA.list("-created_date", 100),
      ]);
      const newData = { leads, paiements, dossiers, contacts, tickets };
      setData(newData);
      const newAlerts = computeAIAlerts(newData);
      const newMetrics = computeMetrics(newData);
      setAlerts(newAlerts);
      setMetrics(newMetrics);
      setLastRefresh(new Date());

      // Log automatique si nouvelles alertes
      newAlerts.forEach(alert => {
        addLog(alert.agent, alert.message, alert.level === "critical" ? "error" : "warn");
      });

      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }, [addLog]);

  // Démarrage automatique + refresh toutes les 5 minutes
  useEffect(() => {
    refreshData();
    addLog("system", "Système IA démarré — 4 agents actifs", "info");
    intervalRef.current = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const toggleAgent = useCallback((agentId) => {
    setAgentStatus(prev => {
      const next = { ...prev, [agentId]: !prev[agentId] };
      const active = next[agentId];
      addLog(agentId, `Agent ${active ? "activé" : "désactivé"} manuellement`, active ? "info" : "warn");
      return next;
    });
  }, [addLog]);

  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  return (
    <AIContext.Provider value={{
      data, alerts, metrics, agentStatus, logs, loading, lastRefresh,
      toggleAgent, dismissAlert, refreshData, addLog,
      activeAgentsCount: Object.values(agentStatus).filter(Boolean).length,
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error("useAI must be used within AIProvider");
  return ctx;
}