import { Link } from "react-router-dom";
import { useAgency } from "../hooks/useAgency";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const { agency } = useAgency();
  const name = agency?.name || "Agence Dupont Immobilier";

  return (
    <footer className="border-t border-border/50 bg-[#0F0F10] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <p className="text-lg font-semibold">{name}</p>
            <p className="mt-3 text-sm text-white/40 leading-relaxed max-w-xs">
              {agency?.description?.slice(0, 120) || "Votre expert immobilier local, au service de vos projets depuis plus de 15 ans."}
              {(agency?.description?.length > 120) ? "..." : ""}
            </p>

            <div className="mt-6 space-y-2.5">
              {agency?.phone && (
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{agency.phone}</span>
                </div>
              )}
              {agency?.email && (
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{agency.email}</span>
                </div>
              )}
              {(agency?.address || agency?.city) && (
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{[agency?.address, agency?.city, agency?.postal_code].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Biens</h4>
            <div className="space-y-2.5">
              <Link to="/vente" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Acheter</Link>
              <Link to="/location" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Louer</Link>
              <Link to="/estimation" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Estimation</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <div className="space-y-2.5">
              <Link to="/contact" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Nous contacter</Link>
              <span className="block text-sm text-white/40">Mentions légales</span>
              <span className="block text-sm text-white/40">Politique de confidentialité</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} {name}. Tous droits réservés.
          </p>
          <p className="text-xs text-white/20">
            Carte professionnelle n° XXXXX — CCI de Paris
          </p>
        </div>
      </div>
    </footer>
  );
}