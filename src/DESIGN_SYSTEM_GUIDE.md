# 🎨 Design System ImmoPilot — Guide Complet

**Status:** ✅ Production-Ready  
**Version:** 1.0  
**Last Updated:** 14 avril 2026

---

## 📋 Table des matières

1. [Tokens & Variables](#tokens--variables)
2. [Composants Wrapper](#composants-wrapper)
3. [Patterns Courants](#patterns-courants)
4. [Guidelines Mobile-First](#guidelines-mobile-first)
5. [Exemples d'utilisation](#exemples-dutilisation)
6. [Cohérence Visuelle](#cohérence-visuelle)

---

## Tokens & Variables

### Spacing (Marges & Paddings)

Utiliser les tokens de spacing pour maintenir une hiérarchie cohérente :

```javascript
--spacing-xs:   0.25rem   (4px)
--spacing-sm:   0.5rem    (8px)
--spacing-md:   1rem      (16px)
--spacing-lg:   1.5rem    (24px)
--spacing-xl:   2rem      (32px)
--spacing-2xl:  3rem      (48px)
```

**En Tailwind :**
```html
<!-- Padding -->
<div className="p-4">           <!-- 1rem -->
<div className="p-6 md:p-8">    <!-- Responsive -->

<!-- Margins -->
<div className="mb-6 md:mb-8">
<div className="mt-4 sm:mt-6">
```

### Shadows (Ombres)

```javascript
--shadow-sm:   0 1px 2px ...       (subtile, éléments légers)
--shadow-md:   0 4px 6px ...       (cartes, containers)
--shadow-lg:   0 10px 15px ...     (modales, overlays)
--shadow-xl:   0 20px 25px ...     (dropdowns importants)
```

**Utilisation :**
```html
<div className="shadow-sm">       <!-- Subtile -->
<div className="shadow-md hover:shadow-lg transition-shadow">  <!-- Interactive -->
```

### Border Radius (Arrondis)

```javascript
--border-radius-sm:   0.375rem   (6px)   — petit, inputs
--border-radius-md:   0.75rem    (12px)  — standard, cartes
--border-radius-lg:   1rem       (16px)  — gros containers
--border-radius-xl:   1.5rem     (24px)  — modales, hero sections
--border-radius-2xl:  2rem       (32px)  — très grand, special
```

**En Tailwind :**
```html
<div className="rounded">         <!-- default: 0.75rem -->
<div className="rounded-lg">      <!-- 1rem -->
<div className="rounded-full">    <!-- Cercles -->
```

### Transitions (Animations)

```javascript
--transition-fast:   150ms        (feedbacks rapides)
--transition-base:   300ms        (interactions standard)
--transition-slow:   500ms        (animations visuelles)
```

**Utilisation :**
```html
<button className="transition-all duration-300 hover:bg-primary/90">
```

---

## Composants Wrapper

### Layout

```javascript
import { DS } from "@/lib/designSystem";

// Conteneur avec max-width
<div className={DS.container()}>

// Page wrapper (bg + min-height)
<div className={DS.pageWrapper()}>

// Section avec spacing
<div className={DS.section()}>

// Area avec padding vertical
<div className={DS.contentArea()}>
```

### Cards

```javascript
// Card standard
<div className={DS.card()}>
  <div className={DS.cardPadding()}>
    Contenu
  </div>
</div>

// Card elevated (hover effect)
<div className={DS.card("elevated")}>

// Card interactive (clickable)
<div className={DS.card("interactive")}>

// Card subtle (background léger)
<div className={DS.card("subtle")}>
```

### Typography

```javascript
<h1 className={DS.h1()}>Titre principal</h1>
<h2 className={DS.h2()}>Sous-titre</h2>
<h3 className={DS.h3()}>Section</h3>

<p className={DS.body()}>Texte normal</p>
<p className={DS.bodyMuted()}>Texte grisé</p>
<label className={DS.label()}>Label form</label>
```

### Buttons

```javascript
// Bouton primaire
<button className={DS.button("primary", "md")}>
  Créer
</button>

// Bouton secondaire
<button className={DS.button("secondary", "md")}>
  Annuler
</button>

// Bouton outline
<button className={DS.button("outline", "md")}>
  Modifier
</button>

// Bouton ghost (minimal)
<button className={DS.button("ghost", "md")}>
  Lien
</button>

// Sizes: "sm", "md", "lg"
<button className={DS.button("primary", "lg")}>
  Grand bouton
</button>
```

### Forms

```javascript
// Input
<input className={DS.input()} placeholder="Votre nom..." />

// Select
<select className={DS.select()}>
  <option>Option 1</option>
</select>

// Textarea
<textarea className={DS.textarea()} />

// Form group wrapper
<div className={DS.formGroup()}>
  <label className={DS.label()}>Email</label>
  <input className={DS.input()} />
</div>
```

### Grids

```javascript
// Grid responsive (1 col mobile, 2 md, 3 lg)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Flex helpers
<div className={DS.flexBetween()}>   <!-- space-between -->
<div className={DS.flexCenter()}>    <!-- center -->
<div className={DS.flexColumn()}>    <!-- column layout -->
```

### Badges

```javascript
<span className={DS.badge()}>Default</span>
<span className={DS.badge("primary")}>Primary</span>
<span className={DS.badge("success")}>Réussi</span>
<span className={DS.badge("warning")}>Attention</span>
<span className={DS.badge("destructive")}>Erreur</span>
```

### États & Feedback

```javascript
// Loading spinner
<div className={DS.spinner()} />

// Alert box
<div className={DS.alertBox("success")}>
  Opération réussie !
</div>

// Autres types: "info", "warning", "error"
<div className={DS.alertBox("error")}>
  Une erreur s'est produite
</div>
```

---

## Patterns Courants

### Page Header

```javascript
import { ComponentPatterns } from "@/lib/designSystem";

const pageHeader = ComponentPatterns.pageHeader();

<div className={pageHeader.wrapper}>
  <h1 className={pageHeader.title}>Titre de la page</h1>
  <p className={pageHeader.description}>
    Description ou sous-titre
  </p>
</div>
```

### Form Field

```javascript
const formField = ComponentPatterns.formField();

<div className={formField.wrapper}>
  <label className={formField.label}>Email</label>
  <input className={DS.input()} />
  {error && <p className={formField.error}>{error}</p>}
</div>
```

### Card avec Header

```javascript
const card = ComponentPatterns.cardWithHeader();

<div className={card.wrapper}>
  <div className={card.header}>
    <h3 className={card.headerTitle}>Transactions</h3>
    <button>⋯</button>
  </div>
  <div className={card.content}>
    Contenu
  </div>
</div>
```

### List Item

```javascript
const item = ComponentPatterns.listItem();

<div className={item.wrapper}>
  <div className={item.icon}>
    <FileText className="w-4 h-4" />
  </div>
  <div className={item.content}>
    <p className={item.title}>Facture #123</p>
    <p className={item.subtitle}>15 avril 2026</p>
  </div>
  <div className={item.action}>
    <button>Voir</button>
  </div>
</div>
```

### Action Bar (Filtres + Boutons)

```javascript
const actionBar = ComponentPatterns.actionBar();

<div className={actionBar.wrapper}>
  <div className={actionBar.left}>
    <input className={DS.input()} placeholder="Rechercher..." />
    <select className={DS.select()}>
      <option>Tous les statuts</option>
    </select>
  </div>
  <div className={actionBar.right}>
    <button className={DS.button("secondary", "md")}>Exporter</button>
    <button className={DS.button("primary", "md")}>+ Créer</button>
  </div>
</div>
```

---

## Guidelines Mobile-First

### Responsive Text

Toujours adapter la taille du texte pour mobile :

```html
<!-- ❌ Ne pas faire -->
<p className="text-lg">Texte</p>

<!-- ✅ Faire -->
<p className="text-sm sm:text-base md:text-lg">Texte</p>

<!-- Ou utiliser le helper -->
<p className={DS.responsiveText("text-sm", "sm:text-base")}>
```

### Responsive Padding

Moins de padding sur mobile, plus sur desktop :

```html
<!-- ❌ Ne pas faire -->
<div className="p-8">Contenu</div>

<!-- ✅ Faire -->
<div className="p-4 sm:p-6 md:p-8">Contenu</div>

<!-- Ou utiliser le helper -->
<div className={DS.responsivePadding("p-4", "sm:p-6")}>
```

### Mobile Navigation

Utiliser `mobileOnly()` et `desktopOnly()` :

```html
<!-- Menu hamburger (mobile seulement) -->
<button className={DS.mobileOnly()}>☰</button>

<!-- Menu full (desktop seulement) -->
<nav className={DS.desktopOnly()}>
  <!-- Navigation menu -->
</nav>
```

### Touch-Friendly Buttons

Les boutons doivent être **au moins 44px de hauteur** sur mobile :

```html
<!-- ✅ Correct -->
<button className="py-3 px-4">
  44px minimum de hauteur
</button>

<!-- ✅ Ou utiliser la size "lg" -->
<button className={DS.button("primary", "lg")}>
```

### Eviter les Debordements

Jamais de `overflow-x` sur mobile :

```html
<!-- ❌ Ne pas faire -->
<div className="overflow-x-auto">

<!-- ✅ Faire : responsive tables -->
<div className="w-full overflow-x-auto">
  <!-- Sur mobile: scroll horizontal si nécessaire -->
</div>
```

---

## Exemples d'utilisation

### Page Simple

```jsx
import { DS, ComponentPatterns } from "@/lib/designSystem";

export default function MyPage() {
  const pageHeader = ComponentPatterns.pageHeader();
  const actionBar = ComponentPatterns.actionBar();

  return (
    <div className={DS.pageWrapper()}>
      <div className={DS.container()}>
        <div className={DS.contentArea()}>
          {/* Header */}
          <div className={pageHeader.wrapper}>
            <h1 className={pageHeader.title}>Mes Propriétés</h1>
            <p className={pageHeader.description}>
              Gérez vos biens immobiliers
            </p>
          </div>

          {/* Action bar */}
          <div className={actionBar.wrapper}>
            <div className={actionBar.left}>
              <input className={DS.input()} placeholder="Rechercher..." />
            </div>
            <div className={actionBar.right}>
              <button className={DS.button("primary", "lg")}>
                + Ajouter
              </button>
            </div>
          </div>

          {/* Grid de cartes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(prop => (
              <div key={prop.id} className={DS.card("interactive")}>
                <div className={DS.cardPadding()}>
                  <h3 className={DS.h4()}>{prop.title}</h3>
                  <p className={DS.bodyMuted()}>{prop.city}</p>
                  <button className={DS.button("primary", "md")}>
                    Voir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Form Complexe

```jsx
import { DS, ComponentPatterns } from "@/lib/designSystem";

export default function PropertyForm() {
  const formField = ComponentPatterns.formField();

  return (
    <div className={DS.card()}>
      <div className={DS.cardPadding()}>
        <h2 className={DS.h2()}>Créer une propriété</h2>

        <form className={DS.section("space-y-6")}>
          {/* Text field */}
          <div className={formField.wrapper}>
            <label className={formField.label()}>Titre</label>
            <input className={DS.input()} />
          </div>

          {/* Select field */}
          <div className={formField.wrapper}>
            <label className={formField.label()}>Type</label>
            <select className={DS.select()}>
              <option>Appartement</option>
              <option>Maison</option>
            </select>
          </div>

          {/* Textarea field */}
          <div className={formField.wrapper}>
            <label className={formField.label()}>Description</label>
            <textarea className={DS.textarea()} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button className={DS.button("secondary", "lg")}>
              Annuler
            </button>
            <button className={DS.button("primary", "lg")}>
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## Cohérence Visuelle

### Checklist avant de commiter

- [ ] Tous les espacements utilisent les tokens `--spacing-*`
- [ ] Les cartes utilisent `DS.card()`
- [ ] Les boutons utilisent `DS.button()`
- [ ] Les inputs utilisent `DS.input()` / `DS.select()` / `DS.textarea()`
- [ ] La typographie utilise `DS.h1()`, `DS.body()`, etc.
- [ ] Les pages incluent `responsive` (mobile-first)
- [ ] Aucun px utilisé directement (sauf exceptions)
- [ ] Transitions utilise `.transition-all` ou `DS.transition()`
- [ ] Ombres utilise les tokens `shadow-*`
- [ ] Arrondis utilise les tokens `rounded-*`

### Common Issues

**❌ Spacing inconsistant**
```html
<!-- Ne pas faire -->
<div className="mb-2 p-8 space-y-12">
```

**✅ Cohérent**
```html
<div className="mb-6 p-6 space-y-6">
```

**❌ Boutons sans taille**
```html
<button className="bg-blue-500 text-white px-4 py-2">
```

**✅ Utiliser le système**
```html
<button className={DS.button("primary", "md")}>
```

**❌ Pas de responsive**
```html
<h2 className="text-3xl">Titre</h2>
```

**✅ Mobile-first**
```html
<h2 className={DS.h2()}>Titre</h2>
<!-- Qui inclut: text-xl sm:text-2xl md:text-3xl -->
```

---

## Migration des Pages Existantes

Pour standardiser une page existante :

1. **Importer le Design System**
   ```javascript
   import { DS, ComponentPatterns } from "@/lib/designSystem";
   ```

2. **Remplacer les layouts**
   ```javascript
   // Avant
   <div className="max-w-6xl mx-auto p-8">
   
   // Après
   <div className={DS.container()}>
   ```

3. **Standardiser les cartes**
   ```javascript
   // Avant
   <div className="bg-white rounded-lg shadow p-6">
   
   // Après
   <div className={DS.card()}>
     <div className={DS.cardPadding()}>
   ```

4. **Typo consistent**
   ```javascript
   // Avant
   <h1 className="text-4xl font-bold">
   
   // Après
   <h1 className={DS.h1()}>
   ```

5. **Responsive obligatoire**
   - Vérifier tous les `className` pour mobile-first
   - Ajouter `sm:`, `md:`, `lg:` breakpoints où nécessaire

---

**Version:** 1.0  
**Mainteneur:** Base44 AI  
**Dernière mise à jour:** 14 avril 2026