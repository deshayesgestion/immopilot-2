import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize, BedDouble, Calendar, ArrowLeft, Heart, Share2, Loader2, Home, CheckCircle } from "lucide-react";
import AnimatedSection from "../components/AnimatedSection";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Property.filter({ id }, null, 1);
      if (data.length > 0) setProperty(data[0]);
      setLoading(false);
    };
    load();
  }, [id]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);

  const typeLabels = { maison: "Maison", appartement: "Appartement", terrain: "Terrain", local_commercial: "Local commercial", bureau: "Bureau" };
  const conditionLabels = { neuf: "Neuf", renove: "Rénové", bon_etat: "Bon état", a_renover: "À rénover" };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Bien introuvable.</p>
        <Link to="/vente">
          <Button variant="outline" className="rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour aux biens
          </Button>
        </Link>
      </div>
    );
  }

  const image = property.images?.[0];

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-6 pt-4">
            <Link to={property.transaction === "location" ? "/location" : "/vente"}>
              <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Retour
              </Button>
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          {image && (
            <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-secondary">
              <img src={image} alt={property.title} className="w-full h-full object-cover" />
            </div>
          )}
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <AnimatedSection delay={200} className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                  {typeLabels[property.type] || property.type}
                </span>
                <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                  {property.transaction === "location" ? "Location" : "Vente"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{property.title}</h1>
              <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{property.address || property.city}{property.postal_code ? ` (${property.postal_code})` : ""}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <Maximize className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{property.surface} m²</p>
                <p className="text-xs text-muted-foreground">Surface</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <BedDouble className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{property.rooms}</p>
                <p className="text-xs text-muted-foreground">Pièces</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center">
                <Home className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{conditionLabels[property.condition] || "—"}</p>
                <p className="text-xs text-muted-foreground">État</p>
              </div>
              {property.year_built && (
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">{property.year_built}</p>
                  <p className="text-xs text-muted-foreground">Construction</p>
                </div>
              )}
            </div>

            {property.description && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {property.features?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Caractéristiques</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 rounded-full text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="bg-card rounded-2xl border border-border/50 p-7 sticky top-24 space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">Prix</p>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(property.price)}
                  {property.transaction === "location" && <span className="text-base font-normal text-muted-foreground">/mois</span>}
                </p>
                {property.transaction === "location" && property.monthly_charges && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Charges : {formatPrice(property.monthly_charges)}/mois
                    {property.charges_included ? " (incluses)" : " (en sus)"}
                  </p>
                )}
              </div>

              {property.available_date && (
                <p className="text-sm text-muted-foreground">
                  Disponible à partir du {property.available_date}
                </p>
              )}

              <Link to="/contact">
                <Button size="lg" className="w-full rounded-full h-12 text-sm font-medium">
                  Contacter l'agence
                </Button>
              </Link>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full gap-2" onClick={() => setIsFav(!isFav)}>
                  <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                  Favoris
                </Button>
                <Button variant="outline" className="flex-1 rounded-full gap-2">
                  <Share2 className="w-4 h-4" />
                  Partager
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}