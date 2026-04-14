import { DS } from "@/lib/designSystem";

/**
 * DesktopNav — Navigation desktop avec sidebar ou header
 * Visible seulement sur desktop (hidden sm:flex)
 * 
 * Utilisation:
 * <DesktopNav>
 *   <nav.link href="/">Accueil</nav.link>
 *   <nav.section title="Vente">
 *     <nav.link href="/vente/biens">Biens</nav.link>
 *   </nav.section>
 * </DesktopNav>
 */
export default function DesktopNav({ children, variant = "sidebar", className = "" }) {
  if (variant === "sidebar") {
    return (
      <nav className={`${DS.desktopOnly()} w-64 border-r border-border/50 bg-secondary/5 overflow-y-auto ${className}`}>
        <div className="divide-y divide-border/30">
          {children}
        </div>
      </nav>
    );
  }

  return (
    <nav className={`${DS.desktopOnly()} border-b border-border/50 bg-background shadow-sm ${className}`}>
      <div className="flex items-center gap-6 px-6 py-4 overflow-x-auto">
        {children}
      </div>
    </nav>
  );
}

/**
 * DesktopNav.Link — Lien de navigation desktop
 */
export function DesktopNavLink({ href, children, active = false, icon: Icon = null }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </a>
  );
}

/**
 * DesktopNav.Section — Section groupée dans la nav
 */
export function DesktopNavSection({ title, children }) {
  return (
    <div className="px-4 py-3 border-b border-border/30">
      <p className={`${DS.label()} text-xs uppercase tracking-wide text-muted-foreground mb-2`}>
        {title}
      </p>
      <div className="flex flex-col gap-1">
        {children}
      </div>
    </div>
  );
}