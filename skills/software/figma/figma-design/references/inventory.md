# Inventaire Complet — Composants & Variables Figma

> Fichier : `fKULPg8lsEa9Xi74IdoIAI`
> Page Components : `4:244`
> Dernière mise à jour : 2026-08-24

---

## Component Sets (18)

### Atoms

| Composant | ID | Variantes | Propriétés | Grid |
|---|---|---|---|---|
| `Button.jsx` | `26:297` | 24 | Color × Size | lg→md→sm→xs (colonnes), couleurs (rangées) |
| `Badge.jsx` | `53:164` | 40 | Color × Size | lg→md→sm→xs (colonnes), couleurs (rangées) |
| `Toggle.jsx` | `73:39` | 6 | Size × State | States (colonnes), sizes (rangées) |
| `Avatar.jsx` | `62:11` | 4 | Size | sm, md, lg, xl |
| `Loader.jsx` | `26:413` | 2 | Color | accent1, accent2 |
| `NavigableLink.jsx` | `26:426` | 3 | State | Default, Hover, Active |
| `DictationButton.jsx` | `26:433` | 2 | State | Inactive, Active |
| `IntegrationBadge.jsx` | `77:51` | 16 | Type × Size × Variant | default (gauche), icon (droite) |

### Fields

| Composant | Variantes | Propriétés | Notes |
|---|---|---|---|
| `TextField.jsx` | 3 | Size × State | sm only, Default/Error/WithValue |
| `EmailField.jsx` | 9 | Size × State | 3 sizes × 3 states, icon envelope |
| `PasswordField.jsx` | 6 | Size × State | 3 sizes × 2 states, 3 segments |
| `TextAreaField.jsx` | 1 | Size | sm only |
| `SelectField.jsx` | 2 | Size × State | Default, Open (dropdown) |
| `CheckboxField.jsx` | 2 | State | Unchecked, Checked |
| `RadioField.jsx` | 2 | State | Unselected, Selected |
| `ToggleField.jsx` | 2 | State | OFF, ON (switch) |
| `DateField.jsx` | 2 | State | Default, HasValue |
| `UploadField.jsx` | 2 | State | Empty (dropzone), Loaded (file list) |

### Autres

| Composant | Type | Notes |
|---|---|---|
| `SkeletonLoader.jsx` | Instance | 3 barres animées |
| `Dropdown.jsx` | Component | Portal dropdown pour formulaires |
| **`Icon.jsx`** | **Component Set** | **81 icônes SVG, variable `Name` (ex: `Name=Bell`)** |

---

## Variable Collections (3)

### Primitives (90 variables)

#### Couleurs灰度 (15)
| Variable | Hex | Utilisation |
|---|---|---|
| `color-white` | `#ffffff` | bg-primary light |
| `color-black` | `#000000` | — |
| `color-gray-50` | `#fbfbfb` | bg-secondary light |
| `color-gray-100` | `#f8f9fa` | bg-tertiary light |
| `color-gray-200` | `#f1f3f4` | bg-quaternary light |
| `color-gray-300` | `#e8eaed` | bg-quinary light |
| `color-gray-400` | `#dce4eb` | border light |
| `color-gray-500` | `#5f6368` | text-muted light |
| `color-gray-600` | `#a1a1aa` | text-muted dark |
| `color-gray-700` | `#1a1a1a` | text-primary light |
| `color-gray-800` | `#141414` | bg-secondary dark |
| `color-gray-900` | `#171717` | bg-tertiary dark |
| `color-gray-950` | `#212121` | bg-quaternary dark |
| `color-gray-975` | `#292929` | bg-quinary dark |
| `color-gray-dark-border` | `#454545` | border dark |

#### Couleurs accent (14)
| Variable | Hex | Alpha |
|---|---|---|
| `color-accent1-light` | `#b81d24` | 100% |
| `color-accent1-dark` | `#ce0812` | 100% |
| `color-accent1-lrg-light` | `#d32129` | 100% |
| `color-accent1-lrg-dark` | `#c50711` | 100% |
| `color-accent2-light` | `#0f7b7f` | 100% |
| `color-accent2-dark` | `#12a8ad` | 100% |
| `color-accent2-lrg-light` | `#128487` | 100% |
| `color-accent2-lrg-dark` | `#12898b` | 100% |
| `color-accent1/10` | `#b81d24` | 10% |
| `color-accent1/20` | `#b81d24` | 20% |
| `color-accent1/30` | `#b81d24` | 30% |
| `color-accent1/40` | `#b81d24` | 40% |
| `color-accent2/10` | `#0f7b7f` | 10% |
| `color-accent2/20` | `#0f7b7f` | 20% |
| `color-accent2/30` | `#0f7b7f` | 30% |
| `color-accent2/40` | `#0f7b7f` | 40% |

#### Couleurs status (6)
| Variable | Hex (Light) | Hex (Dark) |
|---|---|---|
| `color-success-light` | `#137333` | — |
| `color-success-dark` | `#22c55e` | — |
| `color-warning-light` | `#ea8600` | — |
| `color-warning-dark` | `#facc15` | — |
| `color-error-light` | `#d93025` | — |
| `color-error-dark` | `#dc2626` | — |

#### Couleurs badges (5)
| Variable | Hex |
|---|---|
| `color-badge-red` | `#dc2626` |
| `color-badge-purple` | `#7c3aed` |
| `color-badge-blue` | `#2563eb` |
| `color-badge-emerald` | `#059669` |
| `color-badge-gray` | `#6b7280` |

#### Couleurs portals (6)
| Variable | Hex | Portal |
|---|---|---|
| `color-portal-comuse-primary` | `#375b71` | Comuse |
| `color-portal-comuse-secondary` | `#423771` | Comuse |
| `color-portal-comuse-accent` | `#059669` | Comuse |
| `color-portal-demo-primary` | `#0f766e` | Demo |
| `color-portal-demo-secondary` | `#0b5fff` | Demo |
| `color-portal-demo-accent` | `#f59e0b` | Demo |

#### Spacing (32)
`spacing-0` (0px) → `spacing-96` (384px), pas de 4px

#### Radius (7)
| Variable | Valeur | Tailwind |
|---|---|---|
| `radius-none` | 0 | `rounded-none` |
| `radius-sm` | 4 | `rounded` |
| `radius-md` | 8 | `rounded-md` |
| `radius-lg` | 12 | `rounded-lg` |
| `radius-xl` | 16 | `rounded-xl` |
| `radius-2xl` | 24 | — |
| `radius-full` | 9999 | `rounded-full` |

### Color (13 variables, Light/Dark)

Toutes les variables sont des **alias** vers les Primitives.
Voir le mapping dans `tailwind-mapping.md`.

### Typography (19 variables)

| Variable | Valeur |
|---|---|
| `font-family` | `Lato` |
| `font-size-xs` | 12 |
| `font-size-sm` | 14 |
| `font-size-base` | 16 |
| `font-size-lg` | 18 |
| `font-size-xl` | 20 |
| `font-size-2xl` | 24 |
| `font-size-3xl` | 30 |
| `font-size-4xl` | 36 |
| `font-size-5xl` | 48 |
| `font-weight-thin` | 100 |
| `font-weight-light` | 300 |
| `font-weight-regular` | 400 |
| `font-weight-semibold` | 600 |
| `font-weight-bold` | 700 |
| `font-weight-black` | 900 |
| `line-height-tight` | 1.25 |
| `line-height-normal` | 1.5 |
| `line-height-relaxed` | 1.75 |

> ⚠️ Manque : `font-weight-medium` (500) — utilisé dans le code

---

## Pages du fichier

| Page | ID | Contenu |
|---|---|---|
| Cover | `0:1` | Page de couverture |
| Icons | `4:246` | 82 icônes SVG |
| Components | `4:244` | 18 component sets + 2 autres |
| Screens | `27:6` | Frames d'écrans (1920×1080) |
