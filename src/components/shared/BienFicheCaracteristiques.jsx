const OPTS = [
  { key: "balcon", label: "Balcon" },
  { key: "terrasse", label: "Terrasse" },
  { key: "jardin", label: "Jardin" },
  { key: "garage", label: "Garage" },
  { key: "parking", label: "Parking" },
  { key: "cave", label: "Cave" },
  { key: "meuble", label: "Meublé" },
  { key: "ascenseur", label: "Ascenseur" },
];

const DPE_COLORS = { A: "bg-green-600", B: "bg-green-400", C: "bg-yellow-400", D: "bg-orange-400", E: "bg-orange-500", F: "bg-red-500", G: "bg-red-700" };

export default function BienFicheCaracteristiques({ form, set }) {
  return (
    <div className="space-y-5">
      {/* Superficie & pièces */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="label-field">Surface (m²)</label>
          <input
            type="number"
            value={form.surface || ""}
            onChange={e => set("surface", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="65"
            className="field-input"
          />
        </div>
        <div>
          <label className="label-field">Nb. pièces</label>
          <input
            type="number"
            value={form.nb_pieces || ""}
            onChange={e => set("nb_pieces", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="3"
            className="field-input"
          />
        </div>
        <div>
          <label className="label-field">Étage</label>
          <input
            type="text"
            value={form.etage || ""}
            onChange={e => set("etage", e.target.value)}
            placeholder="2ème"
            className="field-input"
          />
        </div>
      </div>

      {/* Chauffage + DPE */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Chauffage</label>
          <select value={form.chauffage || ""} onChange={e => set("chauffage", e.target.value)} className="field-input">
            <option value="">— Non renseigné</option>
            <option value="gaz">Gaz</option>
            <option value="electrique">Électrique</option>
            <option value="pompe_chaleur">Pompe à chaleur</option>
            <option value="fioul">Fioul</option>
            <option value="bois">Bois</option>
            <option value="collectif">Collectif</option>
          </select>
        </div>
        <div>
          <label className="label-field">DPE</label>
          <select value={form.dpe || ""} onChange={e => set("dpe", e.target.value)} className="field-input">
            <option value="">— Non renseigné</option>
            {["A","B","C","D","E","F","G"].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {form.dpe && (
            <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-white text-xs font-bold ${DPE_COLORS[form.dpe]}`}>
              DPE {form.dpe}
            </div>
          )}
        </div>
      </div>

      {/* Équipements booléens */}
      <div>
        <label className="label-field mb-2">Équipements & options</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {OPTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set(key, !form[key])}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form[key]
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${form[key] ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                {form[key] && <span className="text-white text-[10px] font-bold">✓</span>}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}