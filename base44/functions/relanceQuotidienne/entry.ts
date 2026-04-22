import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * relanceQuotidienne — Déclencheur quotidien planifié pour les relances automatiques
 * Appelé chaque matin à 8h par l'automation planifiée
 * Délègue à relanceAutomatique
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const result = await base44.asServiceRole.functions.invoke('relanceAutomatique', {
      dry_run: false,
      manual: false,
    });

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: result?.data || result,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});