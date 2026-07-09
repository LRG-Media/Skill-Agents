````prompt
---
name: simplify-file-v2
version: 2.0.0
description: Simplifie la structure des divs en utilisant uniquement Tailwind CSS, sans ajouter de divs inutiles, en conservant les commentaires et le visuel identique
keywords: ["frontend", "jsx", "tailwind", "refactoring", "structure", "css"]
log_file: C:\Projects\ClientPortalLRG\.github\logs\simplify-jsx-structure.log
last_updated: 2026-02-25
---

# 🎨 Simplification Structure JSX avec Tailwind CSS - V2.0

## 📋 Objectif

Réduire la complexité de la structure des divs en utilisant **UNIQUEMENT Tailwind CSS** pour le layout et le styling, sans modifier l'apparence visuelle.

## ✅ Règles Obligatoires

### 1️⃣ Analyse la structure actuelle
- Identifie les divs inutiles ou imbriquées
- Repère les classes répétitives
- Comprends l'intention du layout (flexbox, grid, spacing, etc.)

### 2️⃣ Optimise avec Tailwind
- Utilise les utilitaires Tailwind pour remplacer les divs de "wrapper"
- Fusionne les classes quand c'est possible
- Applique les flex/grid directement aux conteneurs pertinents

### 3️⃣ Préserve absolument
- ✅ Les commentaires (conserve-les exactement)
- ✅ La fonctionnalité (pas de changement de behaviour)
- ✅ Le visuel (layout et spacing identiques)
- ✅ Les refs, états, useEffect, events

### 4️⃣ Ce qui doit disparaître
- Divs de "wrapper" inutiles
- Divs uniquement pour le spacing (utilise `gap`, `p`, `m` Tailwind)
- Divs uniquement pour le layout (utilise `flex`, `grid`, `flex-col` Tailwind)
- Niveaux d'imbrication excessifs

## 📊 Structure Avant/Après Exemple

**AVANT (Complexe)**
```jsx
<div className="container">
  <div className="wrapper">
    <div className="inner-wrapper">
      <h1>Title</h1>
    </div>
    <div className="spacing"></div>
    <div className="content-area">
      <p>Content</p>
    </div>
  </div>
</div>
```

**APRÈS (Simplifié)**
```jsx
<div className="flex flex-col gap-4 p-4">
  {/* Title and content */}
  <h1>Title</h1>
  <p>Content</p>
</div>
```

## 🔍 Vérification Finale

- [ ] Aucune div inutile
- [ ] Tailwind classes uniquement (pas de CSS custom pour structure)
- [ ] Tous les commentaires conservés
- [ ] Visuel identique
- [ ] Code plus lisible et maintenable

## 📝 Instruction

Fournis-moi un fichier JSX/TSX et je vais:
1. Analyser la structure
2. Identifier les divs à simplifier
3. Utiliser Tailwind pour le layout/styling
4. Conserver les commentaires
5. Vérifier que le visuel reste identique

## 📊 Logging & Tracking

**Une fois la vérification terminée et tout confirmé correct**, ajoute une ligne au fichier de log : `C:\Projects\ClientPortalLRG\.github\logs\simplify-jsx-structure.log`

Format attendu de l'entrée :
```
[YYYY-MM-DD HH:MM] - Simplification completed: <filename>
Status: ✅ All checks passed
```

Exemple :
```
[2026-02-25 14:30] - Simplification completed: Button.jsx
Status: ✅ All checks passed
```

````
