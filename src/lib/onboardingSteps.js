import {
  Building2, Users, CreditCard, Mail, Home, FileText,
  Calendar, TrendingUp, Eye, Calculator, AlertTriangle, Settings
} from "lucide-react";

// Steps definitions per role
export const ONBOARDING_STEPS = {
  admin: [
    {
      id: "configure_agency",
      label: "Configurer votre agence",
      description: "Renseignez les informations de votre agence (nom, logo, coordonnées).",
      icon: Building2, path: "/admin/parametres", cta: "Configurer",
      color: "text-primary", bg: "bg-primary/10",
    },
    {
      id: "invite_team",
      label: "Inviter votre équipe",
      description: "Ajoutez vos agents, gestionnaires et comptable.",
      icon: Users, path: "/admin/equipe", cta: "Inviter",
      color: "text-purple-600", bg: "bg-purple-50",
    },
    {
      id: "connect_email",
      label: "Connecter la boîte email",
      description: "Activez la gestion IA des emails entrants.",
      icon: Mail, path: "/admin/parametres/emails", cta: "Configurer",
      color: "text-amber-600", bg: "bg-amber-50",
    },
    {
      id: "connect_bank",
      label: "Connecter la banque",
      description: "Synchronisez vos transactions bancaires automatiquement.",
      icon: CreditCard, path: "/admin/comptabilite", cta: "Liaison bancaire",
      color: "text-rose-600", bg: "bg-rose-50",
    },
    {
      id: "explore_dashboard",
      label: "Explorer le tableau de bord",
      description: "Découvrez la vue globale de votre activité.",
      icon: TrendingUp, path: "/admin", cta: "Voir le dashboard",
      color: "text-green-600", bg: "bg-green-50",
    },
  ],

  agent: [
    {
      id: "create_property",
      label: "Ajouter votre premier bien",
      description: "Créez une annonce de vente ou de location.",
      icon: Home, path: "/admin/location", cta: "Ajouter un bien",
      color: "text-blue-600", bg: "bg-blue-50",
    },
    {
      id: "create_mandate",
      label: "Créer un mandat de vente",
      description: "Enregistrez un mandat de vente avec les informations vendeur.",
      icon: FileText, path: "/admin/vente/mandats", cta: "Créer un mandat",
      color: "text-purple-600", bg: "bg-purple-50",
    },
    {
      id: "plan_visit",
      label: "Planifier une visite",
      description: "Utilisez l'agenda pour organiser vos visites.",
      icon: Calendar, path: "/admin/agenda", cta: "Ouvrir l'agenda",
      color: "text-amber-600", bg: "bg-amber-50",
    },
    {
      id: "follow_pipeline",
      label: "Suivre le pipeline vente",
      description: "Visualisez l'avancement de vos transactions.",
      icon: TrendingUp, path: "/admin/vente/transactions", cta: "Voir les transactions",
      color: "text-green-600", bg: "bg-green-50",
    },
  ],

  gestionnaire: [
    {
      id: "create_dossier",
      label: "Créer un dossier locatif",
      description: "Ouvrez un dossier pour votre premier locataire.",
      icon: FileText, path: "/admin/location", cta: "Créer un dossier",
      color: "text-blue-600", bg: "bg-blue-50",
    },
    {
      id: "track_loyers",
      label: "Gérer les loyers",
      description: "Suivez les paiements et relances de loyers.",
      icon: CreditCard, path: "/admin/suivi", cta: "Suivi locatif",
      color: "text-green-600", bg: "bg-green-50",
    },
    {
      id: "handle_incidents",
      label: "Traiter les incidents",
      description: "Prenez en charge les incidents signalés par vos locataires.",
      icon: AlertTriangle, path: "/admin/suivi", cta: "Voir les incidents",
      color: "text-amber-600", bg: "bg-amber-50",
    },
    {
      id: "manage_sortie",
      label: "Gérer les préavis et sorties",
      description: "Initiez le workflow de sortie pour un départ locataire.",
      icon: Settings, path: "/admin/sortie", cta: "Module sorties",
      color: "text-rose-600", bg: "bg-rose-50",
    },
  ],

  comptable: [
    {
      id: "connect_bank",
      label: "Connecter votre banque",
      description: "Synchronisez vos transactions bancaires automatiquement.",
      icon: Building2, path: "/admin/comptabilite", cta: "Liaison bancaire",
      color: "text-rose-600", bg: "bg-rose-50",
    },
    {
      id: "check_transactions",
      label: "Vérifier les transactions",
      description: "Validez les rapprochements bancaires et transactions.",
      icon: CreditCard, path: "/admin/comptabilite", cta: "Voir les transactions",
      color: "text-primary", bg: "bg-primary/10",
    },
    {
      id: "track_loyers",
      label: "Suivre les loyers",
      description: "Consultez le statut des loyers payés et en retard.",
      icon: Home, path: "/admin/comptabilite", cta: "Module loyers",
      color: "text-green-600", bg: "bg-green-50",
    },
    {
      id: "generate_reports",
      label: "Générer des rapports",
      description: "Exportez vos bilans et rapports financiers.",
      icon: FileText, path: "/admin/comptabilite", cta: "Rapports",
      color: "text-purple-600", bg: "bg-purple-50",
    },
  ],

  // Responsable location uses a mix of admin + gestionnaire
  responsable_location: [
    {
      id: "create_property",
      label: "Créer votre premier bien",
      description: "Ajoutez un bien avec ses caractéristiques (meublé, balcon…).",
      icon: Home, path: "/admin/location", cta: "Ajouter un bien",
      color: "text-blue-600", bg: "bg-blue-50",
    },
    {
      id: "create_attribution",
      label: "Lancer une attribution",
      description: "Créez un dossier de sélection de locataire pour un bien.",
      icon: Users, path: "/admin/attribution", cta: "Créer une attribution",
      color: "text-purple-600", bg: "bg-purple-50",
    },
    {
      id: "create_dossier",
      label: "Créer un dossier locatif",
      description: "Enregistrez un dossier de suivi pour votre locataire.",
      icon: FileText, path: "/admin/suivi", cta: "Suivi locatif",
      color: "text-green-600", bg: "bg-green-50",
    },
    {
      id: "explore_suivi",
      label: "Comprendre le suivi locataire",
      description: "Apprenez à suivre les paiements et incidents.",
      icon: Eye, path: "/admin/suivi", cta: "Module suivi",
      color: "text-amber-600", bg: "bg-amber-50",
    },
  ],
};

// Role labels for display
export const ROLE_STEP_LABELS = {
  admin: "Directeur / Admin",
  agent: "Agent immobilier",
  gestionnaire: "Gestionnaire locatif",
  comptable: "Comptable",
  responsable_location: "Responsable location",
};

// Get steps for a role (fallback to admin)
export function getStepsForRole(role) {
  return ONBOARDING_STEPS[role] || ONBOARDING_STEPS.admin;
}

// AI system prompts per role
export const ROLE_AI_PROMPTS = {
  admin: `Tu aides un directeur ou admin d'agence immobilière. Priorités : configurer l'agence, inviter l'équipe, connecter la banque et l'email, piloter le dashboard global.`,
  agent: `Tu aides un agent immobilier. Priorités : créer des biens, gérer des mandats, planifier des visites avec l'agenda, suivre son pipeline de vente.`,
  gestionnaire: `Tu aides un gestionnaire locatif. Priorités : créer et suivre des dossiers locatifs, gérer les loyers, traiter les incidents, gérer les préavis et sorties.`,
  comptable: `Tu aides un comptable. Priorités : connecter la banque, vérifier les transactions, suivre les loyers payés/en retard, générer des rapports. Ne pas mentionner la création de biens ou les visites.`,
  responsable_location: `Tu aides un responsable location. Priorités : créer des biens en location, lancer des attributions, créer des dossiers locatifs, comprendre le suivi locataire.`,
};

export const BASE_SYSTEM_PROMPT = `Tu es l'assistant d'onboarding d'ImmoPilot, un SaaS de gestion immobilière.
Tu aides les nouveaux utilisateurs à comprendre et utiliser la plateforme.
Sois concis, friendly, pratique. Réponds en français. Utilise des emojis modérément.

Modules disponibles :
- Location : gestion des biens, candidatures, dossiers locatifs (attribution, suivi, sortie)
- Vente : mandats, transactions, acquéreurs, clôtures
- Comptabilité : loyers, transactions, facturation, dépenses, relances, liaison bancaire
- Agenda : planification des visites, appels, signatures
- Accueil IA : standardiste vocal IA, tickets automatiques
- Emails IA : lecture, analyse et réponse automatique
- Paramètres : configuration agence, équipe

`;