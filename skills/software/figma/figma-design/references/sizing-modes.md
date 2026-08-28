# Sizing Modes — Guide complet

> Le piège silencieux de `resize()` dans Figma

## Le problème

Quand un composant a `layoutMode: 'VERTICAL'` ou `'HORIZONTAL'`, `resize()` est **ignoré silencieusement** sur l'axe en mode `AUTO`. Figma ne throw jamais d'erreur.

## Comment ça marche

### layoutMode: 'VERTICAL'

| Axe | Mode par défaut | resize() |
|---|---|---|
| Largeur (counterAxis) | **FIXED** | ✅ Fonctionne |
| Hauteur (primaryAxis) | **AUTO (HUG)** | ❌ Ignoré |

### layoutMode: 'HORIZONTAL'

| Axe | Mode par défaut | resize() |
|---|---|---|
| Largeur (primaryAxis) | **AUTO (HUG)** | ❌ Ignoré |
| Hauteur (counterAxis) | **FIXED** | ✅ Fonctionne |

## Matrice de décision

| Type de composant | primaryAxis | counterAxis | Exemples |
|---|---|---|---|
| **Carré** | FIXED | FIXED | Avatar, Icon, Spinner |
| **Bouton** | FIXED ou AUTO | HUG | Button (hauteur fixe, largeur texte) |
| **Badge** | HUG | HUG | Badge (s'adapte au contenu) |
| **Carte** | HUG | FIXED | Card (largeur fixe, hauteur variable) |
| **Input** | FIXED | FILL | TextField (hauteur fixe, largeur parent) |
| **Écran** | FIXED | FIXED | Frame d'écran (1920×1080) |

## Pattern sûr — Composant carré

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

## Pattern sûr — Composant à largeur fixe

```js
const v = figma.createComponent();
v.layoutMode = 'VERTICAL';
v.itemSpacing = 8;

v.appendChild(child);

// Largeur fixe, hauteur s'adapte au contenu
v.primaryAxisSizingMode = 'AUTO';   // hauteur = hug (OK ici)
v.counterAxisSizingMode = 'FIXED';  // largeur = fixe
v.resize(320, 100); // Seule la largeur est respectée
```

## Vérification post-création

```js
// Audit sizing modes
function auditSizing(node) {
  if (node.type === 'COMPONENT') {
    const issues = [];
    if (node.primaryAxisSizingMode === 'AUTO' && node.layoutMode === 'VERTICAL') {
      issues.push(`${node.name}: primaryAxis en AUTO (hauteur HUG)`);
    }
    if (node.counterAxisSizingMode === 'AUTO' && node.layoutMode === 'HORIZONTAL') {
      issues.push(`${node.name}: counterAxis en AUTO (largeur HUG)`);
    }
    return issues;
  }
  return [];
}

// Vérifier tous les composants d'un set
const set = figma.getNodeById('26:297');
set.children.forEach(c => {
  const issues = auditSizing(c);
  if (issues.length > 0) console.warn('⚠️', issues);
});
```

## Erreurs courantes

| Erreur | Symptôme | Solution |
|---|---|---|
| Avatar rectangular | 24×14 au lieu de 24×24 | `primaryAxisSizingMode = 'FIXED'` + `resize()` |
| Button trop étroit | Largeur = largeur du texte uniquement | `counterAxisSizingMode = 'FIXED'` + padding |
| Input qui se réduit | Largeur mínimale au lieu de FILL | `counterAxisSizingMode = 'FILL'` |
| Carte qui déborde | Hauteur = hauteur du contenu | `primaryAxisSizingMode = 'FIXED'` + hauteur max |
