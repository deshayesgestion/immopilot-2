import { Phone } from "lucide-react";

// Barre sticky mobile — bouton appel 1 clic visible en permanence
export default function StickyMobileCTA({ agency }) {
  const phone = agency?.phone;
  const color = agency?.primary_color || "#4F46E5";
  if (!phone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden p-3 bg-white/95 backdrop-blur-sm border-t border-border/50 shadow-2xl">
      <a href={`tel:${phone.replace(/\s/g, "")}`}
        className="flex items-center justify-center gap-2 h-12 rounded-xl text-white font-bold text-sm w-full"
        style={{ background: color }}>
        <Phone className="w-5 h-5" />
        Appeler maintenant — {phone}
      </a>
    </div>
  );
}