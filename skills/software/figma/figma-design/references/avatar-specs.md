# Avatar.jsx — Spécifications

Source : `client/src/shared/components/atoms/Avatar.jsx`

## Variantes

4 tailles × 1 = **4 variantes** (la couleur est déterministe par hash du nom)

## Tailles

| Size | Width | Height | Font Size | Font Weight | Sizing |
|---|---|---|---|---|---|
| `sm` | `24px` | `24px` | `12px` | Medium (500) | **FIXED** |
| `md` | `28px` | `28px` | `12px` | Medium (500) | **FIXED** |
| `lg` | `40px` | `40px` | `14px` | Medium (500) | **FIXED** |
| `xl` | `48px` | `48px` | `16px` | Medium (500) | **FIXED** |

> ⚠️ Toutes les tailles doivent être **CARRÉS** avec `primaryAxisSizingMode = 'FIXED'`

## Layout

- `layoutMode`: `VERTICAL`
- `primaryAxisAlignItems`: `CENTER`
- `counterAxisAlignItems`: `CENTER`
- `cornerRadius`: `9999` (rounded-full)
- `primaryAxisSizingMode`: **`FIXED`** ← CRITIQUE
- `counterAxisSizingMode`: **`FIXED`** ← CRITIQUE

## Couleurs (8 options, sélection par hash)

| Couleur | Hex | Tailwind Class |
|---|---|---|
| `blue` | `#3b82f6` | `bg-blue-500` |
| `green` | `#22c55e` | `bg-green-500` |
| `purple` | `#8b5cf6` | `bg-purple-500` |
| `orange` | `#f97316` | `bg-orange-500` |
| `red` | `#ef4444` | `bg-red-500` |
| `pink` | `#ec4899` | `bg-pink-500` |
| `indigo` | `#6366f1` | `bg-indigo-500` |
| `cyan` | `#06b6d4` | `bg-cyan-500` |

La couleur est sélectionnée par : `hash(name) % 8`

## Font

- Family: `Lato` (pas Inter)
- Weight: `Medium` (500) — pas Bold
- Color: `#ffffff` (toujours blanc)

## Texte

- Contenu: initiales (2 caractères max)
- Alignement: centre horizontal + vertical

## ⚠️ Pièges fréquents

| Erreur | Correct |
|---|---|
| `primaryAxisSizingMode: 'AUTO'` | `primaryAxisSizingMode: 'FIXED'` |
| Hauteur HUG (texte) | Hauteur = même valeur que largeur |
| Font Inter Bold | Font Lato Medium |
| Taille md = 32×32 | Taille md = 28×28 |
