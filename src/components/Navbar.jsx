import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgency } from "../hooks/useAgency";

const navLinks = [
  { label: "Acheter", path: "/vente" },
  { label: "Louer", path: "/location" },
  { label: "Estimation", path: "/estimation" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { agency } = useAgency();

  const name = agency?.name || "Agence Dupont Immobilier";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06]">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-base font-semibold tracking-tight text-foreground">
          {name}
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                location.pathname === link.path
                  ? "text-foreground"
                  : "text-foreground/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:block">
          <Link to="/admin" className="text-xs text-foreground/30 hover:text-foreground/60 transition-colors">
            Connexion
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-foreground"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-black/[0.06]">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm font-medium py-2.5 transition-colors ${
                  location.pathname === link.path
                    ? "text-foreground"
                    : "text-foreground/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-1 border-t border-black/[0.06]">
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-xs text-foreground/30">
                Connexion agents
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}