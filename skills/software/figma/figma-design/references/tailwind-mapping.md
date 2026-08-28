# Mapping CSS ↔ Figma ↔ Tailwind — Variables exactes

> Source : `client/src/app/index.css` + Figma Collection "Color" + "Primitives" + "Typography"

---

## 1. Variables sémantiques (CSS → Figma → Tailwind)

### Backgrounds

| CSS Variable | Figma Variable | Figma Primitive | Hex Light | Hex Dark | Tailwind Class |
|---|---|---|---|---|---|
| `--background` | `color-bg-primary` | `color-white` / `color-gray-700` | `#ffffff` | `#1a1a1a` | `bg-background` |
| `--background-2` | `color-bg-secondary` | `color-gray-50` / `color-gray-800` | `#fbfbfb` | `#141414` | `bg-background-2` |
| `--background-3` | `color-bg-tertiary` | `color-gray-100` / `color-gray-900` | `#f8f9fa` | `#171717` | `bg-background-3` |
| `--background-4` | `color-bg-quaternary` | `color-gray-200` / `color-gray-950` | `#f1f3f4` | `#212121` | `bg-background-4` |
| `--background-5` | `color-bg-quinary` | `color-gray-300` / `color-gray-975` | `#e8eaed` | `#292929` | `bg-background-5` |

### Text & Border

| CSS Variable | Figma Variable | Figma Primitive | Hex Light | Hex Dark | Tailwind Class |
|---|---|---|---|---|---|
| `--text` | `color-text-primary` | `color-gray-700` / `color-white` | `#1a1a1a` | `#ffffff` | `text-text-main` |
| `--muted` | `color-text-muted` | `color-gray-500` / `color-gray-600` | `#5f6368` | `#a1a1aa` | `text-muted` |
| `--border` | `color-border-default` | `color-gray-400` / `color-gray-dark-border` | `#dce4eb` | `#454545` | `border-border` |

### Accents

| CSS Variable | Figma Variable | Figma Primitive | Hex Light | Hex Dark | Tailwind Class |
|---|---|---|---|---|---|
| `--accent1` | `color-accent-primary` | `color-accent1-light` / `color-accent1-dark` | `#B81D24` | `#CE0812` | `bg-accent1` / `text-accent1` |
| `--accent2` | `color-accent-secondary` | `color-accent2-light` / `color-accent2-dark` | `#0F7B7F` | `#12A8AD` | `bg-accent2` / `text-accent2` |
| `--success` | `color-success` | `color-success-light` / `color-success-dark` | `#137333` | `#22c55e` | `bg-success` |
| `--warning` | `color-warning` | `color-warning-light` / `color-warning-dark` | `#ea8600` | `#facc15` | `bg-warning` |
| `--error` | `color-error` | `color-error-light` / `color-error-dark` | `#d93025` | `#dc2626` | `bg-error` |

---

## 2. Primitives Figma — Couleurs灰度 (pas Tailwind standard !)

> ⚠️ Les gray du projet sont **custom**, ils ne correspondent PAS aux gray standards de Tailwind.

| Figma Variable | Hex | Utilisation |
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
| `color-gray-700` | `#1a1a1a` | text-primary light / bg-primary dark |
| `color-gray-800` | `#141414` | bg-secondary dark |
| `color-gray-900` | `#171717` | bg-tertiary dark |
| `color-gray-950` | `#212121` | bg-quaternary dark |
| `color-gray-975` | `#292929` | bg-quinary dark |
| `color-gray-dark-border` | `#454545` | border dark |

---

## 3. Primitives Figma — Accents

| Figma Variable | Hex | Correspondance |
|---|---|---|
| `color-accent1-light` | `#b81d24` | `--accent1` |
| `color-accent1-dark` | `#ce0812` | `--accent1-dark` |
| `color-accent1-lrg-light` | `#d32129` | — |
| `color-accent1-lrg-dark` | `#c50711` | — |
| `color-accent2-light` | `#0f7b7f` | `--accent2` |
| `color-accent2-dark` | `#12a8ad` | `--accent2-dark` |
| `color-accent2-lrg-light` | `#128487` | — |
| `color-accent2-lrg-dark` | `#12898b` | — |
| `color-success-light` | `#137333` | `--success` |
| `color-success-dark` | `#22c55e` | — |
| `color-warning-light` | `#ea8600` | `--warning` |
| `color-warning-dark` | `#facc15` | — |
| `color-error-light` | `#d93025` | `--error` |
| `color-error-dark` | `#dc2626` | — |

---

## 4. Primitives Figma — Badges

| Figma Variable | Hex |
|---|---|
| `color-badge-red` | `#dc2626` |
| `color-badge-purple` | `#7c3aed` |
| `color-badge-blue` | `#2563eb` |
| `color-badge-emerald` | `#059669` |
| `color-badge-gray` | `#6b7280` |

---

## 5. Primitives Figma — Portals

| Figma Variable | Hex | Portal |
|---|---|---|
| `color-portal-comuse-primary` | `#375b71` | Comuse |
| `color-portal-comuse-secondary` | `#423771` | Comuse |
| `color-portal-comuse-accent` | `#059669` | Comuse |
| `color-portal-demo-primary` | `#0f766e` | Demo |
| `color-portal-demo-secondary` | `#0b5fff` | Demo |
| `color-portal-demo-accent` | `#f59e0b` | Demo |

---

## 6. Couleurs Badge (code source : `Badge.jsx`)

| Color | BG (`*-100`) | Texte (`*-700`) | Bordure (`*-300`) |
|---|---|---|---|
| `gray` | `#f3f4f6` | `#374151` | `#d1d5db` |
| `blue` | `#dbeafe` | `#1d4ed8` | `#93c5fd` |
| `green` | `#dcfce7` | `#15803d` | `#86efac` |
| `red` | `#fee2e2` | `#dc2626` | `#fca5a5` |
| `yellow` | `#fef9c3` | `#a16207` | `#fde047` |
| `purple` | `#f3e8ff` | `#7e22ce` | `#c4b5fd` |
| `pink` | `#fce7f3` | `#be185d` | `#f9a8d4` |
| `indigo` | `#e0e7ff` | `#4338ca` | `#a5b4fc` |
| `cyan` | `#cffafe` | `#0e7490` | `#67e8f9` |
| `orange` | `#fff7ed` | `#c2410c` | `#fdba74` |
| `accent1` | `rgba(accent1, 0.2)` | `accent1` | `rgba(accent1, 0.3)` |
| `accent2` | `rgba(accent2, 0.2)` | `accent2` | `rgba(accent2, 0.3)` |

---

## 7. Typography (Figma Collection "Typography")

| Figma Variable | Valeur | Tailwind |
|---|---|---|
| `font-family` | `Lato` | `--font-sans` |
| `font-size-xs` | `12` | `text-xs` |
| `font-size-sm` | `14` | `text-sm` |
| `font-size-base` | `16` | `text-base` |
| `font-size-lg` | `18` | `text-lg` |
| `font-size-xl` | `20` | `text-xl` |
| `font-size-2xl` | `24` | `text-2xl` |
| `font-size-3xl` | `30` | `text-3xl` |
| `font-size-4xl` | `36` | `text-4xl` |
| `font-size-5xl` | `48` | `text-5xl` |
| `font-weight-thin` | `100` | `font-thin` |
| `font-weight-light` | `300` | `font-light` |
| `font-weight-regular` | `400` | `font-normal` |
| `font-weight-semibold` | `600` | `font-semibold` |
| `font-weight-bold` | `700` | `font-bold` |
| `font-weight-black` | `900` | `font-black` |
| `line-height-tight` | `1.25` | `leading-tight` |
| `line-height-normal` | `1.5` | `leading-normal` |
| `line-height-relaxed` | `1.75` | `leading-relaxed` |

> ⚠️ **Manque dans Figma** : `font-weight-medium` (`500`) — utilisé dans le code comme `font-medium`

---

## 8. Spacing (Figma Collection "Primitives")

Mapping direct : `spacing-{n}` = `{n * 4}px`

| Figma Variable | Valeur | Tailwind |
|---|---|---|
| `spacing-0` | `0` | `p-0` / `m-0` |
| `spacing-0-5` | `2` | `p-0.5` / `m-0.5` |
| `spacing-1` | `4` | `p-1` / `m-1` |
| `spacing-1-5` | `6` | `p-1.5` / `m-1.5` |
| `spacing-2` | `8` | `p-2` / `m-2` |
| `spacing-2-5` | `10` | `p-2.5` / `m-2.5` |
| `spacing-3` | `12` | `p-3` / `m-3` |
| `spacing-4` | `16` | `p-4` / `m-4` |
| `spacing-5` | `20` | `p-5` / `m-5` |
| `spacing-6` | `24` | `p-6` / `m-6` |
| `spacing-8` | `32` | `p-8` / `m-8` |
| `spacing-10` | `40` | `p-10` / `m-10` |
| `spacing-12` | `48` | `p-12` / `m-12` |
| `spacing-16` | `64` | `p-16` / `m-16` |
| `spacing-20` | `80` | `p-20` / `m-20` |
| `spacing-24` | `96` | `p-24` / `m-24` |

---

## 9. Border Radius (Figma Collection "Primitives")

| Figma Variable | Valeur | Tailwind |
|---|---|---|
| `radius-none` | `0` | `rounded-none` |
| `radius-sm` | `4` | `rounded` |
| `radius-md` | `8` | `rounded-md` |
| `radius-lg` | `12` | `rounded-lg` |
| `radius-xl` | `16` | `rounded-xl` |
| `radius-2xl` | `24` | — |
| `radius-full` | `9999` | `rounded-full` |

---

## 10. Font Family

| Source | Family |
|---|---|
| CSS `--font-sans` | `Lato, sans-serif` |
| Figma `font-family` | `Lato` |
| Fallback Tailwind | `Inter, system-ui, sans-serif` |

---

## 11. Quick Reference — Variable Name Cross-Reference

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
