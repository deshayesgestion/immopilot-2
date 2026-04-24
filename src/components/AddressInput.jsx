import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

export default function AddressInput({ value, onChange, required, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && value.length > 3) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const fetchSuggestions = async (query) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=fr`
      );
      const data = await response.json();
      setSuggestions(data.map((item) => ({
        id: item.place_id,
        address: item.display_name,
        city: item.address?.city || item.address?.town || "",
      })));
      setShowSuggestions(true);
    } catch (error) {
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleSelectSuggestion = (suggestion) => {
    onChange(suggestion.address);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl pl-10 pr-10"
          onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        />
        {loading && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground animate-spin" />}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors text-sm border-b border-border/50 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{suggestion.address}</p>
                  {suggestion.city && <p className="text-xs text-muted-foreground">{suggestion.city}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}