import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAgency } from "../hooks/useAgency";

const navLinks = [
  { label: "Acheter", path: "/vente" },
  { label: "Louer", path: "/location" },
  { label: "Estimation", path: "/estimation" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { agency } = useAgency();
  const isHome = location.pathname === "/";
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const name = agency?.name || "Agence Dupont Immobilier";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      transparent
        ? "bg-transparent border-b border-white/10"
        : "bg-white/95 backdrop-blur-xl border-b border-black/[0.06] shadow-sm"
    }`}>
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className={`text-base font-semibold tracking-tight transition-colors ${transparent ? "text-white" : "text-foreground"}`}
        >
          {name}
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors ${
                transparent
                  ? location.pathname === link.path ? "text-white" : "text-white/70 hover:text-white"
                  : location.pathname === link.path ? "text-foreground" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center">
          <Link
            to="/admin"
            className={`text-xs font-medium transition-all px-3.5 py-1.5 rounded-full border ${
              transparent
                ? "text-white/80 border-white/30 hover:text-white hover:border-white/60 hover:bg-white/10"
                : "text-foreground/50 border-border hover:text-foreground hover:border-foreground/30"
            }`}
          >
            Connexion
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`lg:hidden p-2 transition-colors ${transparent ? "text-white" : "text-foreground"}`}
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
                  location.pathname === link.path ? "text-foreground" : "text-foreground/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-1 border-t border-black/[0.06]">
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-xs text-foreground/40 font-medium">
                Connexion agents
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}