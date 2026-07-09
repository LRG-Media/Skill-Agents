---
name: file-cleanup
description: Analyse une feature pour identifier et SUPPRIMER tous les console.log
keywords: ["cleanup", "logging", "code-review", "backend"]
---

# 🧹 Nettoyage - Audit console.log

## Instruction

Analyse ce dossier/fichiers en détail pour identifier tous les **console.log** À SUPPRIMER dans le code backend que je t'ai transmis.

## Étapes d'analyse

1. **Scan complet** : Cherche tous les `console.log` dans la feature
2. **Localise chaque occurrence** : Affiche fichier + ligne + contexte
3. **Marque pour suppression** :
   - `console.log()` → À SUPPRIMER
   - `console.error()` → À SUPPRIMER
   - `console.warn()` → À SUPPRIMER
   - `console.info()` → À SUPPRIMER
4. **Rapport seulement** : N'écris pas de code pour le moment

## Output attendu

```
❌ CONSOLE.LOG À SUPPRIMER:

server/features/integrations/file1.js:45
console.log("Message") 
→ À SUPPRIMER (ligne 45)

server/features/integrations/file2.js:123  
console.error("Error")
→ À SUPPRIMER (ligne 123)
```

## Règles Backend

- ❌ **JAMAIS** `console.log` en production (interdit)
- ❌ **JAMAIS** `console.error()` en production (interdit)
- ❌ **JAMAIS** `console.warn()` en production (interdit)
- ✅ **TOUJOURS** SUPPRIMER les console.* 
- 😴 Les logs de débogage n'ont pas leur place en prod
