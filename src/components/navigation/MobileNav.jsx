import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DS } from "@/lib/designSystem";

/**
 * MobileNav — Navigation mobile avec hamburger menu
 * Visible seulement sur mobile (sm:hidden)
 * 
 * Utilisation:
 * <MobileNav brand="ImmoPilot">
 *   <nav.link href="/">Accueil</nav.link>
 *   <nav.link href="/location">Location</nav.link>
 * </MobileNav>
 */
export default function MobileNav({ brand = "Brand", children, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${DS.mobileOnly()} sticky top-0 z-40 bg-background border-b border-border/50 shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className={DS.h4()}>{brand}</div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border/50 bg-secondary/5">
          <div className="flex flex-col divide-y divide-border/30">
            {children}
          </div>
        </nav>
      )}
    </div>
  );
}

/**
 * MobileNav.Link — Lien de navigation mobile
 */
export function MobileNavLink({ href, children, onClick, active = false }) {
  const handleClick = (e) => {
    if (onClick) onClick(e);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`block px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-secondary/50"
      }`}
    >
      {children}
    </a>
  );
}