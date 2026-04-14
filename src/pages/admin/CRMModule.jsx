import { ModuleGuard } from '@/hooks/useTenantConfig';

export default function CRMModule() {
  return (
    <ModuleGuard module="crm">
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">CRM</h1>
        <p className="text-muted-foreground">Module CRM disponible pour ce tenant</p>
        {/* Contenu CRM ici */}
      </div>
    </ModuleGuard>
  );
}