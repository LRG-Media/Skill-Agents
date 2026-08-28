# Badge.jsx — Spécifications

Source : `client/src/shared/components/atoms/Badge.jsx`

## Variantes

10 couleurs × 4 tailles = **40 variantes**

## Couleurs

| Color | BG | Text | Border |
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

## Tailles

| Size | Padding H | Padding V | Font Size | Font Weight |
|---|---|---|---|---|
| `xs` | `6px` | `2px` | `12px` | Medium |
| `sm` | `8px` | `4px` | `12px` | Medium |
| `md` | `12px` | `6px` | `14px` | Medium |
| `lg` | `16px` | `8px` | `16px` | Medium |

## Layout

- `layoutMode`: `HORIZONTAL`
- `primaryAxisAlignItems`: `CENTER`
- `counterAxisAlignItems`: `CENTER`
- `cornerRadius`: `4` (rounded — ⚠️ PAS 9999)
- `strokeWeight`: `1`
- `layoutSizingHorizontal`: `HUG`
- `layoutSizingVertical`: `HUG`

## Grid de disposition

- Colonnes : lg → md → sm → xs (gauche à droite)
- Rangées : gray → blue → green → red → yellow → purple → pink → indigo → cyan → orange
- GAP colonnes : `16px`
- GAP rangées : `16px`

## ⚠️ Pièges fréquents

| Erreur | Correct |
|---|---|
| `cornerRadius: 9999` | `cornerRadius: 4` |
| `fontRegular` | `fontMedium` (weight 500) |
| 5 couleurs | 10 couleurs |
| `emerald` (nom) | `green` (nom du code) |
