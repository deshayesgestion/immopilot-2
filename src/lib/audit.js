import { base44 } from "@/api/base44Client";

/**
 * Log an action in the AuditLog entity.
 * Call this after any significant create / update / delete operation.
 *
 * Usage:
 *   import { logAction } from "@/lib/audit";
 *   await logAction("create", "Property", id, p.title);
 *   await logAction("update", "Lead", id, lead.name, { before: old, after: next });
 *   await logAction("delete", "Lead", id, lead.name);
 */
export async function logAction(action, entity, entityId = null, entityLabel = null, changes = null, details = null) {
  try {
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      user_email: user?.email || "inconnu",
      user_name: user?.full_name || user?.email || "inconnu",
      user_role: user?.role || "inconnu",
      action,
      entity,
      entity_id: entityId,
      entity_label: entityLabel,
      changes: changes || undefined,
      details: details || undefined,
    });
  } catch {
    // Non-blocking: audit errors should never break the app
  }
}