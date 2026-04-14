# 📦 Composants UI Réutilisables — Guide d'utilisation

**Status:** ✅ Prêt pour utilisation  
**Version:** 1.0  
**Foundation:** Design System (`lib/designSystem.js`)

---

## 🎯 Architecture

Les composants sont organisés par **catégorie** :

```
components/
├── layout/           # Structure globale
│   ├── Container.jsx       # Largeur max + padding
│   ├── PageLayout.jsx      # Wrapper page complet
│   └── Section.jsx         # Organisation blocs
├── ui/              # Composants visuels
│   ├── Card.jsx            # Cartes standardisées
│   └── Button.jsx          # Boutons responsive
├── forms/           # Formulaires
│   ├── FormGroup.jsx       # Wrapper champs
│   ├── Input.jsx           # Champs texte
│   ├── Select.jsx          # Dropdowns
│   └── Textarea.jsx        # Zones texte
└── navigation/      # Navigation
    ├── MobileNav.jsx       # Menu mobile (hamburger)
    └── DesktopNav.jsx      # Nav desktop (sidebar)
```

---

## 🔧 Composants Disponibles

### **Layout**

#### Container
Gère la largeur max et padding responsive.

```jsx
import Container from "@/components/layout/Container";

<Container maxWidth="max-w-6xl">
  Contenu centré et limité en largeur
</Container>
```

**Props:**
- `maxWidth` — classe Tailwind (défaut: `max-w-6xl`)
- `className` — classes supplémentaires

---

#### PageLayout
Wrapper complet pour toutes les pages (bg + structure + spacing).

```jsx
import PageLayout, { PageHeader, PageContent } from "@/components/layout/PageLayout";

<PageLayout>
  <PageHeader 
    title="Mes Propriétés"
    description="Gérez vos biens immobiliers"
    action={<button>+ Ajouter</button>}
  />
  <PageContent>
    Contenu principal
  </PageContent>
</PageLayout>
```

**Props:**
- `variant` — `default` | `secondary` | `muted` (fond)

**Sub-components:**
- `<PageHeader title="..." description="..." action={node} />`
- `<PageContent>...contenu...</PageContent>`

---

#### Section
Organise les blocs verticalement avec espacement cohérent.

```jsx
import Section, { SectionDivider } from "@/components/layout/Section";

<Section title="Informations générales" subtitle="Remplissez ces champs">
  {/* Contenu */}
</Section>

<SectionDivider />

<Section title="Section suivante">
  {/* Contenu */}
</Section>
```

**Props:**
- `title` — titre de la section
- `subtitle` — sous-titre optionnel
- `spacing` — classes espacement (défaut: `space-y-6`)

---

### **UI Components**

#### Card
Cartes standardisées avec variantes responsive.

```jsx
import Card, { CardHeader, CardContent, CardFooter, CardGrid } from "@/components/ui/Card";

// Simple
<Card>
  Contenu simple
</Card>

// Avec structure
<Card variant="elevated">
  <CardHeader 
    title="Titre"
    subtitle="Sous-titre"
    action={<button>⋯</button>}
  />
  <CardContent>
    Contenu principal
  </CardContent>
  <CardFooter>
    <button>Action</button>
  </CardFooter>
</Card>

// Grille de cartes
<CardGrid cols={{ sm: 1, md: 2, lg: 3 }}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</CardGrid>
```

**Variantes:**
- `default` — standard
- `elevated` — avec hover effect
- `interactive` — clickable
- `subtle` — background léger

---

#### Button
Boutons standardisés avec responsive sizing.

```jsx
import Button, { ButtonGroup } from "@/components/ui/Button";
import { Plus, Download } from "lucide-react";

// Simple
<Button>Créer</Button>

// Avec variantes
<Button variant="secondary">Annuler</Button>
<Button variant="outline">Modifier</Button>
<Button variant="ghost">Lien</Button>
<Button variant="destructive">Supprimer</Button>

// Avec icon
<Button icon={Plus} iconPosition="left">
  Ajouter
</Button>

// Loading
<Button loading>Traitement...</Button>

// Full width
<Button fullWidth>Action principale</Button>

// Groupé
<ButtonGroup orientation="horizontal">
  <Button variant="secondary">Annuler</Button>
  <Button>Valider</Button>
</ButtonGroup>
```

**Props:**
- `variant` — `primary` | `secondary` | `outline` | `ghost` | `destructive`
- `size` — `sm` | `md` | `lg`
- `loading` — affiche spinner
- `disabled` — état désactivé
- `fullWidth` — 100% de largeur
- `icon` — composant icône (Lucide)
- `iconPosition` — `left` | `right`

---

### **Formulaires**

#### FormGroup
Wrapper pour champs avec label et erreur.

```jsx
import FormGroup from "@/components/forms/FormGroup";
import Input from "@/components/forms/Input";

<FormGroup 
  label="Email" 
  required={true}
  error={errors.email}
>
  <Input 
    type="email" 
    placeholder="vous@example.com"
    error={!!errors.email}
  />
</FormGroup>
```

**Props:**
- `label` — texte du label
- `required` — affiche `*`
- `error` — message d'erreur
- `className` — classes supplémentaires

---

#### Input
Champ texte standardisé.

```jsx
import Input from "@/components/forms/Input";

<Input 
  type="text"
  placeholder="Votre nom..."
  size="md"
  error={false}
/>
```

**Props:**
- `size` — `sm` | `md` (défaut)
- `error` — state erreur (border rouge)
- Tous les attributs HTML standard

---

#### Select
Dropdown standardisé.

```jsx
import Select from "@/components/forms/Select";

<Select error={false}>
  <option value="">Choisir...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>
```

**Props:**
- `error` — state erreur

---

#### Textarea
Zone texte standardisée.

```jsx
import Textarea from "@/components/forms/Textarea";

<Textarea 
  placeholder="Votre message..."
  rows={4}
  error={false}
/>
```

**Props:**
- `rows` — nombre de lignes (défaut: 4)
- `error` — state erreur

---

### **Navigation**

#### MobileNav
Menu mobile avec hamburger (visible mobile seulement).

```jsx
import MobileNav, { MobileNavLink } from "@/components/navigation/MobileNav";

<MobileNav brand="ImmoPilot">
  <MobileNavLink href="/" active={pathname === "/"}>
    Accueil
  </MobileNavLink>
  <MobileNavLink href="/location">
    Location
  </MobileNavLink>
</MobileNav>
```

**Props:**
- `brand` — logo/texte marque

**Sub-components:**
- `<MobileNavLink href="..." active={bool}>...text...</MobileNavLink>`

---

#### DesktopNav
Navigation desktop (sidebar ou header).

```jsx
import DesktopNav, { DesktopNavLink, DesktopNavSection } from "@/components/navigation/DesktopNav";
import { Home, Building2, FileText } from "lucide-react";

<DesktopNav variant="sidebar">
  <DesktopNavLink href="/" icon={Home} active={pathname === "/"}>
    Accueil
  </DesktopNavLink>
  
  <DesktopNavSection title="Gestion">
    <DesktopNavLink href="/location" icon={Building2}>
      Location
    </DesktopNavLink>
    <DesktopNavLink href="/comptabilite" icon={FileText}>
      Comptabilité
    </DesktopNavLink>
  </DesktopNavSection>
</DesktopNav>
```

**Props:**
- `variant` — `sidebar` (défaut) | `header`

**Sub-components:**
- `<DesktopNavLink href="..." icon={IconComponent} active={bool}>...text...</DesktopNavLink>`
- `<DesktopNavSection title="...">...liens...</DesktopNavSection>`

---

## 📱 Responsive Behavior

Tous les composants sont **mobile-first** :

| Propriété | Mobile (< 640px) | Tablet (640-1024px) | Desktop (> 1024px) |
|-----------|------------------|---------------------|-------------------|
| Padding | `p-4` | `p-5` | `p-6` |
| Gap | `gap-4` | `gap-5` | `gap-6` |
| Font Size | `text-sm` | `text-base` | `text-base` |
| Button Size | `md` | `md` | `lg` optionnel |
| Card Grid | 1 col | 2 cols | 3 cols |

---

## ✅ Checklist d'Utilisation

Avant de refactoriser une page :

- [ ] Importer `PageLayout` + `PageHeader` + `PageContent`
- [ ] Remplacer les `<div>` de layout par `Container`
- [ ] Utiliser `Card` pour tous les conteneurs
- [ ] Remplacer les boutons custom par `Button`
- [ ] Utiliser `FormGroup` + `Input` pour les formes
- [ ] Ajouter `MobileNav` + `DesktopNav` si nécessaire
- [ ] Vérifier la responsiveness sur mobile (< 640px)
- [ ] Tester sur desktop et vérifier le spacing

---

## 🚀 Pattern Complet (Exemple)

```jsx
import PageLayout, { PageHeader, PageContent } from "@/components/layout/PageLayout";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import Card, { CardGrid } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FormGroup from "@/components/forms/FormGroup";
import Input from "@/components/forms/Input";

export default function PropertiesPage() {
  return (
    <PageLayout>
      <PageHeader 
        title="Mes Propriétés"
        description="Gérez vos biens immobiliers"
        action={<Button icon={Plus}>Ajouter</Button>}
      />
      
      <PageContent>
        <Section title="Filtres">
          <Input placeholder="Rechercher..." />
        </Section>

        <Section title="Propriétés">
          <CardGrid cols={{ sm: 1, md: 2, lg: 3 }}>
            {properties.map(prop => (
              <Card key={prop.id} variant="interactive">
                <h3 className="font-semibold mb-2">{prop.title}</h3>
                <p className="text-sm text-muted-foreground">{prop.city}</p>
                <Button className="mt-4" fullWidth>
                  Voir détails
                </Button>
              </Card>
            ))}
          </CardGrid>
        </Section>
      </PageContent>
    </PageLayout>
  );
}
```

---

## 📝 Prochaines Étapes

1. ✅ Composants créés
2. ⏭️ Appliquer aux pages publiques (Home, About, Contact)
3. ⏭️ Refactor Dashboard admin
4. ⏭️ Appliquer aux modules principaux

---

**Tous les composants sont prêts à l'emploi !** 🚀