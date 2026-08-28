# Workflow — Création de composant Figma

## Checklist complète (10 étapes)

### Phase 1 : Analyse

- [ ] **1.** Lire le fichier `.jsx` source du composant
- [ ] **2.** Extraire les specs visuelles :
  - [ ] Couleurs (noms + hex exacts)
  - [ ] Tailles (padding, font-size, height)
  - [ ] Border radius
  - [ ] Font weight
  - [ ] Variantes (combinaisons)
- [ ] **3.** Vérifier les variables Figma existantes (`search_design_system`)

### Phase 2 : Création

- [ ] **4.** Créer/accéder à la page cible (background `#E5E5E5`)
- [ ] **5.** Créer un frame **temporaire** sur la même page
- [ ] **6.** Créer les variantes dans le frame temp :
  - [ ] Chaque variante = composant (`figma.createComponent()`)
  - [ ] `layoutMode` = `VERTICAL` ou `HORIZONTAL` (jamais NONE)
  - [ ] `layoutPositioning` = `AUTO` (jamais ABSOLUTE)
  - [ ] Appliquer les couleurs/tailles du code exact
- [ ] **7.** `combineAsVariants()` dans le frame temp
- [ ] **8.** Grid : rangées = couleur, colonnes = tailles `lg → md → sm → xs`

### Phase 3 : Finalisation

- [ ] **9.** Déplacer le component set dans la section cible
- [ ] **10.** Supprimer le frame temp
- [ ] **11.** Vérifications finales :
  - [ ] ✅ Tous les children ont `layoutPositioning: 'AUTO'`
  - [ ] ✅ Tous les children ont `layoutSizingHorizontal: 'HUG'`
  - [ ] ✅ Aucune frame sans `layoutMode` (hors component set)
  - [ ] ✅ Les noms de variantes matchent le code (`Color=X, Size=Y`)

## Erreurs courantes et solutions

| Erreur | Cause | Solution |
|---|---|---|
| "Grouped nodes must be in the same page" | `combineAsVariants` avec parent d'une autre page | Créer un frame temp sur la même page |
| Children empilés à (0,0) | Pas de repositionnement après `combineAsVariants` | Appliquer le grid manuellement |
| Badge fully rounded | Copié `rounded-full` au lieu de `rounded` | Vérifier le mapping Tailwind → 4px |
| Couleurs manquantes | Pas lu le fichier source complet | Lire TOUT le fichier avant de commencer |
| Absolute positioning | Créé sans auto-layout | Toujours `layoutMode = 'VERTICAL'` |

## Script d'audit rapide

```js
// À exécuter APRÈS chaque création de composant
function auditComponent(setId) {
  const set = figma.getNodeById(setId);
  const problems = [];

  set.children.forEach(c => {
    if (c.layoutPositioning === 'ABSOLUTE') problems.push(`${c.name}: absolute`);
    if (c.layoutSizingHorizontal !== 'HUG') problems.push(`${c.name}: not HUG`);
  });

  if (problems.length === 0) console.log('✅ All clear');
  else console.log('⚠️', problems);
}
```
