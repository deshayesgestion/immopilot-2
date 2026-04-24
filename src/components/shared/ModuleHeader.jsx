/**
 * ModuleHeader — Header unifié pour tous les modules admin
 * Inclut titre, sous-titre, KPIs inline, et quick actions en pills
 */
import QuickActionBar from "./QuickActionBar";
/* eslint-disable react/prop-types */

export default function ModuleHeader({ icon: Icon, iconBg, iconColor, title, subtitle, kpis = [], actions = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 p-4 space-y-4">
      {/* Title row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 ${iconBg} rounded-xl`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* KPIs inline */}
        {kpis.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap">
            {kpis.map((k, i) => (
              <div key={i} className="text-center">
                <p className={`text-lg font-bold ${k.color || "text-foreground"}`}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions pills */}
      {actions.length > 0 && (
        <QuickActionBar actions={actions} variant="pill" />
      )}
    </div>
  );
}