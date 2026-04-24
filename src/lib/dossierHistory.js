/**
 * Utilitaire centralisé pour historiser les actions dans un DossierLocatif
 */
import { base44 } from "@/api/base44Client";

export async function logAction(dossier, action, auteur = "Agent") {
  const entry = { date: new Date().toISOString(), action, auteur };
  const historique = [...(dossier.historique || []), entry];
  await base44.entities.DossierLocatif.update(dossier.id, { historique });
  return historique;
}

export function buildLogEntry(action, auteur = "Agent") {
  return { date: new Date().toISOString(), action, auteur };
}