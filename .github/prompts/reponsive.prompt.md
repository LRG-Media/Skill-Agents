## 📱 **DIRECTIVE RESPONSIVE - TAILWIND CSS**

**Règle Mobile-First avec `md:` uniquement:**

```
✅ FAIRE:
- Styles par défaut = mobile
- Utiliser UNIQUEMENT md: pour desktop
- Exemple: text-lg md:text-2xl

❌ NE PAS FAIRE:
- Ne JAMAIS utiliser sm: (640px)
- Ne PAS utiliser lg:, xl:, etc.
- Ne PAS mélanger sm: et md:
```

**Structure Standard:**
```tailwind
className="[mobile styles] md:[desktop styles]"
```

**Exemples:**
```jsx
// ✅ CORRECT
<div className="p-4 md:p-8">
<h1 className="text-lg md:text-3xl">
<div className="w-full md:w-[800px]">
<button className="text-sm md:text-base">

// ❌ INCORRECT
<div className="p-2 sm:p-4 md:p-8"> ❌ sm: interdit
<h1 className="text-xs sm:text-lg md:text-2xl lg:text-3xl"> ❌ sm: et lg: interdits
```

**Appliqué partout dans le projet** (sauf si autre règle spécifiée)