---
name: figma-design
description: "Créer, modifier et organiser des designs dans Figma. Pages, components, variables, icons, collections. Utiliser pour toute opération d'écriture dans un fichier Figma."
---

# Figma Design — Skill complet

## Prérequis

- **Toujours** charger `figma-use` avant d'appeler `use_figma`
- Toujours passer `skillNames: "figma-use"` dans chaque appel
- **TOUJOURS** utiliser l'auto-layout (`layoutMode: 'VERTICAL'` ou `'HORIZONTAL'`) sur **toute** frame créée — sans exception

---

## 1. Créer une page

### Couleur d'arrière-plan par défaut : `#E5E5E5`

```js
const newPage = figma.createPage();
newPage.name = 'Screens';
newPage.backgrounds = [{ type: 'SOLID', color: { r: 0.898, g: 0.898, b: 0.898 } }];
```

---

## 2. Règles ABSOLUES sur le positionnement

### ⛔ JAMAIS d'absolute positioning

- **Ne JAMAIS** laisser `layoutPositioning = 'ABSOLUTE'` sur un enfant
- **Ne JAMAIS** créer des frames sans auto-layout (`layoutMode = 'NONE'` n'est toléré que pour les component sets)
- **TOUJOURS** activer `layoutMode = 'VERTICAL'` ou `'HORIZONTAL'` sur chaque frame créée — c'est la règle #1
- Les component sets themselves doivent avoir `layoutMode: 'NONE'`, mais leurs **children** doivent avoir `layoutPositioning: 'AUTO'`

### ✅ Toujours vérifier après création

```js
// Vérifier qu'aucun child n'est en absolute
const absChildren = node.children.filter(c => c.layoutPositioning === 'ABSOLUTE');
if (absChildren.length > 0) {
  absChildren.forEach(c => { c.layoutPositioning = 'AUTO'; });
}
```

### ✅ Pattern de création sûr

```js
// 1. Créer le parent avec auto-layout
const frame = figma.createFrame();
frame.name = 'MonComposant';
frame.layoutMode = 'VERTICAL'; // ou HORIZONTAL
frame.itemSpacing = 8;

// 2. Ajouter les enfants (ils seront en AUTO par défaut)
const child = figma.createText();
frame.appendChild(child);

// 3. Vérifier
frame.children.forEach(c => {
  if (c.layoutPositioning === 'ABSOLUTE') c.layoutPositioning = 'AUTO';
});
```

---

## 3. Sizing Modes — Le piège silencieux de `resize()`

### ⚠️ Règle critique

`resize()` est **IGNORÉ silencieusement** quand le sizing mode est `AUTO`.
Figma ne throw jamais d'erreur — il passe en HUG sans prévenir.

### Comment ça marche

Quand `layoutMode = 'VERTICAL'` :
- `counterAxis` = Largeur → **FIXED** par défaut → ✅ resize() marche
- `primaryAxis` = Hauteur → **AUTO** par défaut → ❌ resize() ignoré

Quand `layoutMode = 'HORIZONTAL'` :
- `primaryAxis` = Largeur → **AUTO** par défaut → ❌ resize() ignoré
- `counterAxis` = Hauteur → **FIXED** par défaut → ✅ resize() marche

### Matrice de décision

| Type | primaryAxis | counterAxis | Quand l'utiliser |
|---|---|---|---|
| **Carré** | FIXED | FIXED | Icônes, avatars, spinners — dimensions identiques X=Y |
| **Largeur fixe** | FIXED | HUG | Boutons, tags — hauteur fixe, largeur selon contenu |
| **Hug total** | HUG | HUG | Badges, labels — s'adaptent entièrement au contenu |
| **Largeur remplie** | HUG | FIXED | Cartes, panneaux — largeur du parent, hauteur variable |
| **FILL** | FIXED | FILL | Inputs, textareas — hauteur fixe, largeur = parent |

### Pattern sûr pour composants carrés

```js
const v = figma.createComponent();
v.layoutMode = 'VERTICAL';
v.primaryAxisAlignItems = 'CENTER';
v.counterAxisAlignItems = 'CENTER';

v.appendChild(child);

// ⚠️ OBLIGATOIRE avant resize() :
v.primaryAxisSizingMode = 'FIXED';
v.counterAxisSizingMode = 'FIXED';

v.resize(dim, dim); // Maintenant ça marche
```

### Vérification post-création

```js
// Vérifier que resize() a bien été appliqué
component.children.forEach(c => {
  if (c.primaryAxisSizingMode === 'AUTO') {
    console.warn(`${c.name}: hauteur en HUG, probablement pas carré`);
  }
});
```

---

## 4. Component Sets avec variantes

### Pattern correct

```js
// Créer les variantes
const variants = [];
['small', 'medium', 'large'].forEach(size => {
  const v = figma.createComponent();
  v.name = `Size=${size}`;
  v.layoutMode = 'HORIZONTAL';
  v.primaryAxisAlignItems = 'CENTER';
  // ... configurer
  variants.push(v);
});

// Combiner en component set
const set = figma.combineAsVariants(variants, parentFrame);
set.name = 'MonComposant.jsx';
set.layoutMode = 'NONE'; // OK pour les component sets

// ⚠️ IMPORTANT: Repositionner les enfants manuellement
const GAP = 32;
variants.forEach((v, i) => {
  v.x = i * (120 + GAP);
  v.y = 0;
  v.layoutPositioning = 'AUTO'; // JAMAIS ABSOLUTE
});
```

### Vérification post-création

```js
// Vérifier tous les component sets
const allSets = figma.root.findAll(n => n.type === 'COMPONENT_SET');
allSets.forEach(s => {
  s.children.forEach(c => {
    if (c.layoutPositioning === 'ABSOLUTE') {
      c.layoutPositioning = 'AUTO';
    }
  });
});
```

### ⚠️ Re-fix les tailles APRÈS `combineAsVariants`

`combineAsVariants` **redimensionne les enfants** pour s'adapter au layout du component set. Les tailles définies avant sont cassées.

```js
// ❌ ERREUR : les tailles sont cassées après combine
variants.forEach(v => v.resize(w, h));
const set = figma.combineAsVariants(variants, parent);
// → Les enfants ont des tailles imprévues

// ✅ CORRECT : re-fix APRÈS combine
const set = figma.combineAsVariants(variants, parent);
set.layoutMode = 'NONE';
variants.forEach(v => {
  v.primaryAxisSizingMode = 'FIXED';
  v.counterAxisSizingMode = 'FIXED';
  v.resize(w, h); // maintenant ça marche
  v.layoutPositioning = 'AUTO';
});
```

### ⚠️ Éléments absolus = fond de l'élément visible

Si un élément React est `position: absolute` + `z-index` par-dessus un autre, il ne doit **PAS** être un enfant séparé dans Figma. Il doit être le **fond** de l'élément visible.

```
❌ 3 éléments : Slider(bg) + Tab1(transparent) + Tab2(transparent)
✅ 2 éléments : Tab-Active(bg) + Tab-Inactive(transparent)
```

**Règle** : Un élément qui overlap un autre dans le DOM React = le fond de l'élément dans Figma, pas un layer séparé.

### ⚠️ Pas de `STRETCH` en alignment

`STRETCH` n'est pas une valeur valide pour `counterAxisAlignItems` ou `primaryAxisAlignItems`.

```js
// ❌ ERREUR
container.counterAxisAlignItems = 'STRETCH';

// ✅ CORRECT — utiliser le sizing à la place
child.layoutSizingHorizontal = 'FILL'; // pour remplir la largeur
child.layoutSizingVertical = 'FILL';   // pour remplir la hauteur
```

### ⚠️ `ABSOLUTE` nécessite un parent auto-layout

`layoutPositioning = 'ABSOLUTE'` ne peut être défini que sur un enfant d'un frame qui a `layoutMode !== 'NONE'`.

```js
// ❌ ERREUR si le parent est un component set (layoutMode: NONE)
child.layoutPositioning = 'ABSOLUTE';

// ✅ CORRECT : créer l'élément dans un parent auto-layout AVANT combineAsVariants
const grid = figma.createFrame();
grid.layoutMode = 'HORIZONTAL'; // auto-layout activé
const slider = figma.createFrame();
slider.layoutPositioning = 'ABSOLUTE'; // OK car grid a auto-layout
grid.appendChild(slider);
```

---

## 5. Récupérer les variables et collections

### Lister toutes les collections

```js
const collections = figma.variables.getLocalVariableCollections();
collections.forEach(col => {
  console.log(col.name, col.modes, col.variableIds.length);
});
```

### Lire les variables d'une collection

```js
const vars = {};
figma.variables.getLocalVariables().forEach(v => {
  const val = Object.values(v.valuesByMode)[0];
  if (val && typeof val === 'object' && 'r' in val) {
    vars[v.name] = val; // Couleur
  } else if (typeof val === 'number') {
    vars[v.name] = val; // Spacing, radius, etc.
  }
});
```

### Utiliser les variables dans les composants

```js
// Créer une variable collection
const collection = figma.variables.createVariableCollection('Design Tokens');

// Créer des modes (Light/Dark)
const lightMode = collection.modes[0].modeId;
const darkMode = collection.addMode('Dark');

// Créer des variables
const bgVar = figma.variables.createVariable('color-bg', collection.id, 'COLOR');
bgVar.setValueForMode(lightMode, { r: 1, g: 1, b: 1 });
bgVar.setValueForMode(darkMode, { r: 0.1, g: 0.1, b: 0.1 });

// Utiliser une variable dans un fill
frame.setBoundVariable('fillColor', bgVar.id);
```

---

## 6. Récupérer les icônes et collections

### Lister les icônes d'une page

```js
const iconsPage = figma.root.children.find(p => p.name === 'Icons');
if (iconsPage) {
  iconsPage.children.forEach(icon => {
    console.log(icon.name, icon.id, icon.width, icon.height);
  });
}
```

### Récupérer les métadonnées d'un node

```js
// Via get_metadata (Figma MCP)
// Retourne le XML avec tous les nodes enfants, positions, types

// Via get_design_context (Figma MCP)
// Retourne le code de référence, screenshot, et métadonnées
```

### Récupérer les libraries disponibles

```js
// Via get_libraries (Figma MCP)
// Retourne les libraries ajoutées et disponibles
// Chaque library a un libraryKey pour scoped search
```

### Chercher dans le design system

```js
// Via search_design_system (Figma MCP)
// Retourne les composants, variables, et styles correspondants
// Chaque résultat a un componentKey/key pour import via $fig
```

---

## 7. Organiser les frames

### Grille par catégorie

```js
const COLS = 4;
const COL_W = 1920;
const ROW_H = 1080;
const GAP_X = 200;
const GAP_Y = 150;

items.forEach((item, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  item.x = col * (COL_W + GAP_X);
  item.y = row * (ROW_H + GAP_Y);
});
```

### Fill container

```js
// Pour que les enfants remplissent leur parent
child.layoutSizingHorizontal = 'FILL';
child.layoutSizingVertical = 'FILL';

// Le parent DOIT avoir auto-layout activé
parent.layoutMode = 'VERTICAL'; // ou HORIZONTAL
```

---

## 8. Créer un composant depuis le code source

### Workflow complet (10 étapes)

```
1. Lire le fichier .jsx du composant (shared/components/atoms/...)
2. Extraire specs : couleurs (hex), tailles (padding/font), radius, font-weight
3. Chercher les variables Figma existantes (search_design_system)
4. Créer la page si nécessaire (background #E5E5E5)
5. Créer un frame temporaire sur la même page que la cible
6. Créer les variantes dans le frame temp (composants avec auto-layout)
7. combineAsVariants → grid (rangées=couleurs, colonnes=tailles lg→md→sm→xs)
8. Déplacer le component set dans la section cible
9. Supprimer le frame temp
10. Vérification : auto-layout ✅, pas d'absolute ✅, hug contents ✅
```

### Piège courant : combineAsVariants

```js
// ❌ ERREUR : "Grouped nodes must be in the same page as the parent"
const set = figma.combineAsVariants(variants, otherPageFrame);

// ✅ CORRECT : créer un frame temp sur la MÊME PAGE
const tempFrame = figma.createFrame();
tempFrame.name = '_temp';
tempFrame.fills = [];
screensPage.appendChild(tempFrame);

variants.forEach(v => tempFrame.appendChild(v));
const set = figma.combineAsVariants(variants, tempFrame);

// Déplacer puis supprimer le temp
atoms.appendChild(set);
tempFrame.remove();
```

### Grid des variantes : toujours grand→petit

```js
// Colonnes = tailles (du plus grand au plus petit)
// Rangées = couleurs (ou autre dimension)
const dim2 = ['lg', 'md', 'sm', 'xs'];  // colonnes
const dim1 = ['primary', 'secondary', 'danger'];  // rangées
const COL_W = 160, ROW_H = 48, GAP = 32, ROW_GAP = 24;

variants.forEach(v => {
  const match = v.name.match(/(\w+)=(\w+), (\w+)=(\w+)/);
  if (match) {
    const ri = dim1.indexOf(match[2]);
    const ci = dim2.indexOf(match[4]);
    v.x = ci * (COL_W + GAP);
    v.y = ri * (ROW_H + ROW_GAP);
  }
});
```

### Hug contents sur les enfants

```js
// Tous les children doivent être HUG (pas FIXED)
component.children.forEach(c => {
  c.layoutSizingHorizontal = 'HUG';
  c.layoutSizingVertical = 'HUG';
});
```

---

## 9. Audit et fix récursif auto-layout

### Script de scan complet

```js
function fullAudit(root) {
  const issues = { noLayout: [], absolute: [], fixedChildren: [] };

  function scan(node) {
    if (node.type === 'FRAME') {
      // 1. Frames sans auto-layout
      if (!node.layoutMode || node.layoutMode === 'NONE') {
        // Toléré uniquement pour les component sets
        if (node.type !== 'COMPONENT_SET') {
          issues.noLayout.push(node);
        }
      }
    }

    // 2. Children en absolute
    if ('layoutPositioning' in node && node.layoutPositioning === 'ABSOLUTE') {
      issues.absolute.push(node);
    }

    // 3. Children FIXED dans un parent auto-layout (sauf si c'est voulu)
    if (node.parent?.layoutMode && node.parent.layoutMode !== 'NONE') {
      if (node.layoutSizingHorizontal === 'FIXED') {
        issues.fixedChildren.push(node);
      }
    }

    if ('children' in node) node.children.forEach(scan);
  }

  scan(root);
  return issues;
}

// Fix automatique
function autoFix(issues) {
  // Activer auto-layout sur les frames sans
  issues.noLayout.forEach(n => {
    n.layoutMode = 'VERTICAL';
    n.itemSpacing = 8;
  });

  // Passer les absolute en AUTO
  issues.absolute.forEach(n => {
    n.layoutPositioning = 'AUTO';
  });
}
```

---

## 10. Résumé des règles

| Règle | Description |
|---|---|
| 🔄 **Toujours auto-layout** | **CHAQUE** frame créée DOIT avoir `layoutMode: 'VERTICAL'` ou `'HORIZONTAL'` |
| ⛔ Pas d'absolute | Jamais `layoutPositioning = 'ABSOLUTE'` sur les enfants |
| ⚠️ **Sizing FIXED** | Avant `resize()`, FORCER `primaryAxisSizingMode = 'FIXED'` — sinon ignoré silencieusement |
| ⚠️ **Re-fix après combine** | `combineAsVariants` casse les tailles — toujours re-fix APRÈS |
| ⚠️ **Absolu = fond** | Un élément `absolute` qui overlap = le fond de l'élément visible, pas un layer séparé |
| ⚠️ **Pas de STRETCH** | Utiliser `layoutSizingHorizontal = 'FILL'` au lieu de `counterAxisAlignItems = 'STRETCH'` |
| ⚠️ **Instances pour écrans** | Toujours utiliser `createInstanceOfComponent()` depuis les component sets, jamais recréer manuellement |
| ⚠️ **Lire le JSX cible** | Ne jamais se baser sur un écran similaire — lire le fichier `.jsx` exact |
| ⚠️ **Labels + notes exacts** | Recopier les props `label` et `note` du code, pas deviner |
| ⚠️ **Pas de wrapper** | Mirorer la hiérarchie `<div>` du code, pas ajouter de frames inutiles |
| ⚠️ **Enfants remplis** | Vérifier qu'aucun frame conteneur n'est vide après création |
| ⚠️ **Grid = parent** | La largeur totale des enfants grid doit correspondre au parent |
| ✅ Lire le code | Toujours lire le .jsx source avant de créer un composant Figma |
| ✅ Grid lg→xs | Organiser les variantes : colonnes = tailles du plus grand au plus petit |
| ✅ Hug contents | Les children des component sets doivent être `HUG`, pas `FIXED` |
| ✅ Temp frame | Utiliser un frame temporaire sur la même page pour `combineAsVariants` |
| ✅ Variables | Utiliser les variables existantes avant de créer des literals |
| ✅ FILL | Utiliser `layoutSizingHorizontal: 'FILL'` pour remplir le parent |
| ✅ Vérifier après | Scanner auto-layout + absolute + sizing + hug après chaque création |

---

## Références

Voir les fichiers dans `references/` :
- [tailwind-mapping.md](references/tailwind-mapping.md) — Mapping CSS ↔ Figma ↔ Tailwind (hex exacts)
- [button-specs.md](references/button-specs.md) — Spécifications du composant Button
- [badge-specs.md](references/badge-specs.md) — Spécifications du composant Badge
- [workflow-checklist.md](references/workflow-checklist.md) — Checklist de création de composant
- [avatar-specs.md](references/avatar-specs.md) — Spécifications du composant Avatar (sizing carré)
- [sizing-modes.md](references/sizing-modes.md) — Guide complet des sizing modes Figma
- [inventory.md](references/inventory.md) — Inventaire complet des composants et variables Figma

---

## 11. Inventaire des composants et variables Figma

> Dernière mise à jour : 2026-08-24
> Fichier : `fKULPg8lsEa9Xi74IdoIAI` — Page Components (4:244)

### Component Sets (18)

| Composant | Type | Variantes | Propriétés |
|---|---|---|---|
| **Button.jsx** | Atoms | 24 | Color (6) × Size (4) |
| **Badge.jsx** | Atoms | 40 | Color (10) × Size (4) |
| **Toggle.jsx** | Atoms | 6 | Size (3) × State (2) |
| **Avatar.jsx** | Atoms | 4 | Size (4) |
| **Loader.jsx** | Atoms | 2 | Color (2) |
| **NavigableLink.jsx** | Atoms | 3 | State (3) |
| **DictationButton.jsx** | Atoms | 2 | State (2) |
| **IntegrationBadge.jsx** | Atoms | 16 | Type (4) × Size (2) × Variant (2) |
| **TextField.jsx** | Fields | 3 | Size (3) × State (3) |
| **EmailField.jsx** | Fields | 9 | Size (3) × State (3) |
| **PasswordField.jsx** | Fields | 6 | Size (3) × State (2) |
| **TextAreaField.jsx** | Fields | 1 | Size (1) |
| **SelectField.jsx** | Fields | 2 | Size (1) × State (2) |
| **CheckboxField.jsx** | Fields | 2 | State (2) |
| **RadioField.jsx** | Fields | 2 | State (2) |
| **ToggleField.jsx** | Fields | 2 | State (2) |
| **DateField.jsx** | Fields | 2 | State (2) |
| **UploadField.jsx** | Fields | 2 | State (2) |

**Total : 18 component sets, 137 variantes**

### Instances

| Composant | Type |
|---|---|
| **SkeletonLoader.jsx** | Instance (3 barres animées) |
| **Dropdown.jsx** | Component (portal dropdown) |
| **Icon.jsx** | Component Set — 81 icônes SVG, variable `Name` |

### Variable Collections (3)

#### Primitives (90 variables, 1 mode "Value")

| Catégorie | Variables | Exemples |
|---|---|---|
| **Couleurs灰度** | 15 | `color-white` → `color-gray-975`, `color-gray-dark-border` |
| **Couleurs accent** | 14 | `color-accent1-light/dark`, `color-accent2-light/dark`, `color-accent1/20`, `color-accent2/20` |
| **Couleurs badges** | 5 | `color-badge-red`, `color-badge-blue`, `color-badge-emerald`, `color-badge-purple`, `color-badge-gray` |
| **Couleurs portals** | 6 | `color-portal-comuse-*`, `color-portal-demo-*` |
| **Spacing** | 32 | `spacing-0` → `spacing-96` (4px par unité) |
| **Radius** | 7 | `radius-none` → `radius-full` (0, 4, 8, 12, 16, 24, 9999) |

#### Color (13 variables, 2 modes : Light/Dark)

| Variable | Light | Dark |
|---|---|---|
| `color-bg-primary` | `color-white` | `color-gray-700` |
| `color-bg-secondary` | `color-gray-50` | `color-gray-800` |
| `color-bg-tertiary` | `color-gray-100` | `color-gray-900` |
| `color-bg-quaternary` | `color-gray-200` | `color-gray-950` |
| `color-bg-quinary` | `color-gray-300` | `color-gray-975` |
| `color-text-primary` | `color-gray-700` | `color-white` |
| `color-text-muted` | `color-gray-500` | `color-gray-600` |
| `color-border-default` | `color-gray-400` | `color-gray-dark-border` |
| `color-accent-primary` | `color-accent1-light` | `color-accent1-dark` |
| `color-accent-secondary` | `color-accent2-light` | `color-accent2-dark` |
| `color-success` | `color-success-light` | `color-success-dark` |
| `color-warning` | `color-warning-light` | `color-warning-dark` |
| `color-error` | `color-error-light` | `color-error-dark` |

#### Typography (19 variables, 1 mode "Value")

| Variable | Valeur |
|---|---|
| `font-family` | `Lato` |
| `font-size-xs` → `font-size-5xl` | 12, 14, 16, 18, 20, 24, 30, 36, 48 |
| `font-weight-thin` → `font-weight-black` | 100, 300, 400, 600, 700, 900 |
| `line-height-tight/normal/relaxed` | 1.25, 1.5, 1.75 |

### Mapping CSS ↔ Figma (rapide)

```
CSS: --background      ↔ Figma: color-bg-primary       ↔ Tailwind: bg-background
CSS: --background-2    ↔ Figma: color-bg-secondary      ↔ Tailwind: bg-background-2
CSS: --background-3    ↔ Figma: color-bg-tertiary       ↔ Tailwind: bg-background-3
CSS: --background-4    ↔ Figma: color-bg-quaternary     ↔ Tailwind: bg-background-4
CSS: --background-5    ↔ Figma: color-bg-quinary        ↔ Tailwind: bg-background-5
CSS: --text            ↔ Figma: color-text-primary      ↔ Tailwind: text-text-main
CSS: --muted           ↔ Figma: color-text-muted        ↔ Tailwind: text-muted
CSS: --border          ↔ Figma: color-border-default    ↔ Tailwind: border-border
CSS: --accent1         ↔ Figma: color-accent-primary    ↔ Tailwind: bg-accent1
CSS: --accent2         ↔ Figma: color-accent-secondary  ↔ Tailwind: bg-accent2
CSS: --success         ↔ Figma: color-success           ↔ Tailwind: bg-success
CSS: --warning         ↔ Figma: color-warning           ↔ Tailwind: bg-warning
CSS: --error           ↔ Figma: color-error             ↔ Tailwind: bg-error
```

---

## 12. Créer un écran (page complète)

### Règle d'or : utiliser les instances

Quand on recrée un écran (Login, Dashboard, etc.) dans Figma, on doit **TOUJOURS** utiliser les `instances` des composants existants sur la page Components, jamais recréer les éléments manuellement.

### Pattern

```js
// 1. Trouver le composant sur la page Components
const compPage = figma.root.children.find(p => p.name === 'Components');
const emailComp = compPage.children.find(
  n => n.type === 'COMPONENT_SET' && n.name === 'EmailField.jsx'
);
const targetVariant = emailComp?.children.find(
  v => v.name === 'Size=md, State=Default'
);

// 2. Créer une instance dans l'écran
const emailInstance = figma.createInstanceOfComponent(targetVariant);
emailInstance.resize(520, 67); // largeur du formulaire

// 3. Positionner dans le layout
formSection.appendChild(emailInstance);
```

### Composants disponibles pour les écrans

| Composant | Instance pour |
|---|---|
| `Icon.jsx` | Icônes (81 variantes, variable `Name`) |
| `EmailField.jsx` | Champs email (login, settings) |
| `PasswordField.jsx` | Champs mot de passe (login) |
| `Button.jsx` | Boutons d'action |
| `Badge.jsx` | Badges de statut |
| `Toggle.jsx` | Theme toggle, tab toggle |
| `TextField.jsx` | Champs texte génériques |
| `SelectField.jsx` | Dropdowns |
| `CheckboxField.jsx` | Checkboxes |

### ⚠️ Erreur courante

```
❌ Recréer manuellement un email field avec des frames
✅ Utiliser figma.createInstanceOfComponent(variant) depuis le component set
```

### ⚠️ Lire le code JSX AVANT de construire

Ne **JAMAIS** construire un écran en se basant sur un écran similaire (ex: Login pour Register). Toujours lire le fichier `.jsx` cible et identifier la **structure exacte** des enfants, les labels, les notes, et les props.

### ⚠️ Vérifier les props `label` et `note`

Les labels dans le code ont souvent des **props spécifiques** (ex: `label="Adresse e-mail"` vs `label="Email"`). Les `note` props ajoutent du texte sous le champ (ex: "Minimum 8 caractères..."). Les recopier **exactement** dans Figma.

### ⚠️ Pas de wrapper inutile

Ne **JAMAIS** créer un frame wrapper (`Root`, `Container`) si le JSX n'en a pas. La structure Figma doit **mirorer exactement** la hiérarchie des `<div>` du code.

### ⚠️ Vérifier que tous les enfants sont remplis

Après avoir créé un frame conteneur (ex: `NameRow`), **vérifier** que tous les enfants attendus sont bien présents. Un frame vide signifie un oubli.

### ⚠️ Grid = largeur exacte du parent

Quand le code utilise un `grid-cols-6`, la largeur totale des enfants doit correspondre à la largeur du parent. Ne pas arrondir ou estimer les hauteurs — laisser le parent hug sa hauteur.
