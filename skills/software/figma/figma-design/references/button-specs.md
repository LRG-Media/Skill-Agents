# Button.jsx — Spécifications

Source : `client/src/shared/components/atoms/Button.jsx`

## Variantes

6 couleurs × 4 tailles = **24 variantes**

## Couleurs

| Color | BG | Text | Outline BG | Outline Border |
|---|---|---|---|---|
| `accent1` | `#B81D24` | `#ffffff` | `transparent` | `#B81D24` |
| `accent2` | `#0F7B7F` | `#ffffff` | `transparent` | `#0F7B7F` |
| `success` | `#137333` | `#ffffff` | `transparent` | `#137333` |
| `error` | `#d93025` | `#ffffff` | `transparent` | `#d93025` |
| `gray` | `#e8eaed` | `#1a1a1a` | `transparent` | `#5f6368` |
| `white` | `#ffffff` | `#1a1a1a` | `transparent` | `#dce4eb` |

## Tailles

| Size | Height | Padding H | Font Size | Font Weight |
|---|---|---|---|---|
| `xs` | `28px` | `8px` | `12px` | Regular |
| `sm` | `32px` | `12px` | `13px` | Regular |
| `md` | `36px` | `16px` | `14px` | Regular |
| `lg` | `40px` | `20px` | `15px` | Regular |

## Layout

- `layoutMode`: `HORIZONTAL`
- `primaryAxisAlignItems`: `CENTER`
- `counterAxisAlignItems`: `CENTER`
- `cornerRadius`: `8` (rounded-md)
- `itemSpacing`: `8`

## Grid de disposition

- Colonnes : lg → md → sm → xs (gauche à droite)
- Rangées : accent1 → accent2 → success → error → gray → white
- GAP colonnes : `32px`
- GAP rangées : `24px`

## Variantes spéciales

| Variant | Props |
|---|---|
| `outline` | `outline={true}` → bordure colorée, fond transparent |
| `filter` | `variant="filter"` → selected state avec accent2 |
| `loading` | `loading={true}` → spinner à gauche |
| `leftIcon` / `rightIcon` | Icône SVG avant/après le texte |
| `to` / `href` | Render comme `<Link>` ou `<a>` |
