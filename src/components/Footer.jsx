import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              Immo<span className="text-primary">Pilot</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              L'immobilier réinventé par l'intelligence artificielle.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Produit</h4>
            <div className="space-y-2.5">
              <Link to="/vente" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Biens à vendre</Link>
              <Link to="/location" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Biens à louer</Link>
              <Link to="/estimation" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Estimation IA</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Entreprise</h4>
            <div className="space-y-2.5">
              <Link to="/a-propos" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">À propos</Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Légal</h4>
            <div className="space-y-2.5">
              <span className="block text-sm text-muted-foreground">Mentions légales</span>
              <span className="block text-sm text-muted-foreground">Politique de confidentialité</span>
              <span className="block text-sm text-muted-foreground">CGU</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 ImmoPilot. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground">
            Propulsé par l'intelligence artificielle
          </p>
        </div>
      </div>
    </footer>
  );
}