import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Biens à vendre", path: "/vente" },
  { label: "Biens à louer", path: "/location" },
  { label: "Estimation", path: "/estimation" },
  { label: "Contact", path: "/contact" },
  { label: "À propos", path: "/a-propos" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          Immo<span className="text-primary">Pilot</span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:block">
          <Button variant="outline" size="sm" className="rounded-full px-5">
            Connexion
          </Button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-foreground"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden bg-background border-b border-border animate-fade-in">
          <div className="px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm font-medium py-2 transition-colors ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button variant="outline" size="sm" className="rounded-full px-5 w-full mt-2">
              Connexion
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}