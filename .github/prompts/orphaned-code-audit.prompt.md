---
name: orphaned-code-audit
description: Analyse une feature pour identifier et SUPPRIMER tous les codes et scripts orphelins
keywords: ["cleanup", "orphaned-code", "dead-code", "code-review", "backend"]
---

# 🧹 Nettoyage - Audit Code Orphelin

## ⚠️ **EXIGENCE CRITIQUE - 100% DE CERTITUDE REQUISE**

**🚨 RÈGLE ABSOLUE**: Un code ne peut être marqué comme "orphelin à supprimer" QUE SI tu es à **100% certain** que c'est du code mort.

**Pas de suppositions. Pas d'"à 99%". Pas de "probablement".** 

✅ **100% CERTAIN** = Grep search retourne 0 résultats + tu as vérifié tous les chemins possibles + confirmé par test fonctionnel  
❌ **PAS CERTAIN** = Rapport uniquement (MEDIUM/LOW), pas de suppression

---

## Instruction

Analyse cette feature/dossier en détail pour identifier tous les **codes et scripts ORPHELINS** À SUPPRIMER.

⚡ **Les suppressions ne se font QUE pour du code 100% mort** ⚡


## Définition - Code Orphelin (100% MORT)

Le code orphelin est du code **ABSOLUMENT mort, inutilisé ou obsolète** qui doit être supprimé :

### ✅ **100% ORPHELIN (PEUT ÊTRE SUPPRIMÉ)**
- ✅ Fonction **jamais appelée** (Grep search = 0 résultats, vérifié avec patterns multiples)
- ✅ Import **déclaré mais 0 usage dans le fichier** (vérifié ligne par ligne)
- ✅ Classe **jamais instanciée** (Grep search = 0 résultats de new ClassName)
- ✅ Fichiers **en doublon identique** (hash SHA256 match)
- ✅ Routes **supprimées du routeur** mais code legacy conservé
- ✅ Exports **supprimés de index.js** et aucun import direct elsewhere
- ✅ Propriétés statiques **jamais utilisées** (Grep search multipass)
- ✅ Getters/setters **appelés seulement par du code orphelin**

### ❌ **PAS ORPHELIN (À CONSERVER)**
- ❌ Fonctions génériques (peut-être appelées dynamiquement)
- ❌ Utilitaires publics (peut-être utilisés par d'autres services/portals)
- ❌ Pattern templates (utilisés comme reference pour new code)
- ❌ Code avec au moins 1 grep match (même si indirect)
- ❌ Exports encore présents dans index.js
- ❌ Code utilisé par des tests (même si tests ne sont pas run en prod)
- ❌ Code legacy documenté comme "à conserver pour compatibilité backward"

---

## Étapes d'analyse

### **1️⃣ Identifier les orphelins**

```bash
# Pour CHAQUE fichier:
- Vérifier les imports/exports inutilisés
- Chercher les fonctions never called (grep -r "functionName")
- Repérer les blocs commentés (#region, /* ... */)
- Noter les fichiers dupliqués/redondants
```

### **2️⃣ Localiser chaque occurrence**

```
Format:
- Fichier complet
- Numéro de ligne
- Type d'orphelin (UNUSED_FUNCTION, DEAD_CODE, etc.)
- Contexte (10-20 lignes autour)
```

### **3️⃣ Marquer pour suppression**

Categories (avec certitude):
- 🟥 **CRITICAL**: **100% CERTAIN** - Doublon identique, fichier jamais importé (multi-grep), très ancien + confirmé par test
- 🟨 **HIGH**: **95%+ CERTAIN** - 0 appels trouvés (multi-grep), export supprimé de index.js, vérifié usages croisés
- 🟧 **MEDIUM**: **50-95% CERTAIN** - Pas sûr à 100%, à clarifier avec équipe ou tester
- 🟩 **LOW**: **BESOIN CLARIFICATION** - Possible usage indirect, pattern template, ou simplement doute

### **4️⃣ Rapport STRICT avec chaîne de preuve**

- ❌ **NE SUPPRIME JAMAIS sans 100% de certitude**
- ✅ **RAPPORTE uniquement** les orphelins trouvés avec **preuves concrètes**
- 📋 **Pour chaque candidat orphelin, inclure**:
  - Chaque grep search exécuté (et le résultat: 0)
  - Tous les chemins d'usage possibles vérifiés
  - Résultats de tests end-to-end si applicable
  - Confirmation que `index.js` n'exporte plus (si applicable)
- 🎯 **Propose un ordre de suppression** (CRITICAL → HIGH → MEDIUM/LOW = À CLARIFIER)

---

## Output attendu

```
🧹 AUDIT CODE ORPHELIN:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟥 ORPHELINS CRITIQUES (À SUPPRIMER EN PRIORITÉ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server/features/email/services/oldEmailService.js (FICHIER ENTIER)
→ Raison: Doublonné par emailService.js, jamais importé

server/features/tasks/utils/deprecatedHelpers.js:45-120
→ Raison: Bloc commenté depuis 2023, fonction remplacée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟨 ORPHELINS PROBABLES (À VÉRIFIER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server/features/projects/models/Project.js:234-250
Fonction: oldCalculateProjectStatus()
→ Raison: Grep search montre 0 appels dans le projet

server/features/contacts/services/ContactService.js:1-5
Imports: { oldCRMSync } from './deprecated.js'
→ Raison: Import présent mais jamais utilisé dans le fichier

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟧 DOUTES À CLARIFIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server/features/settings/controllers/SettingsController.js:89
Export: legacySettingsEndpoint()
→ Raison: Pas d'appel trouvé, MAIS présent dans exports (vérifier routes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RÉSUMÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Orphelins critiques:    2 fichiers/sections
Orphelins probables:    3 imports/fonctions
À clarifier:            1 export
Total lignes à checker: ~150 lignes
```

---

## 🔍 Critères de détection (avec preuve CONCRÈTE)

### **🟥 CRITICAL - 100% CERTAIN (Suppression immédiate)**
✅ **TOUS ces points confirmés**:
- Fichiers **jamais importés** (Grep: `import.*filename|require.*filename` = 0)
- Blocs **commentés depuis 1+ ans** + aucun TODO referencé
- Doublons **hash identique** confirmé (SHA256 match)
- Fichiers en `deprecated/`, `old/`, `backup/` dont on a prouvé la non-utilisation
- **Preuve E2E**: Code compilé et app fonctionne IDENTIQUE avant/après suppression

### **🟨 HIGH - 95%+ CERTAIN**
✅ **TOUS ces points confirmés**:
- Fonction: Grep search multipass avec patterns différents = 0 résultats
- Import: vérifié qu'aucune variable du module importé n'est utilisée
- Variable: Grep search montre 0 lectures/écritures after déclaration
- Classe: Grep search `new ClassName|ClassName.` = 0 résultats
- **Preuve**: Export supprimé de index.js s'il y en avait un
- **Preuve E2E**: Tests passent, routes répondent correctement

### **🟧 MEDIUM - 50-95% PROBABLE (À CLARIFIER)**
⚠️ **Au moins 1 point INCERTAIN**:
- Export présent mais usage **indirect possible** (pas prouvé 0)
- Fonction **appelée dynamiquement possible** (eval/require avec variable)
- Code **légacy encore en production** (pas sûr si utilisé)
- Peut-être utilisé par **d'autres services** externes (pas accès au code)
- Seul 1 grep search fait, d'autres patterns non vérifiés

### **🟩 LOW - BESOIN CLARIFICATION**
❌ **Doutes restants**:
- Code commenté récemment (peut-être debug temporaire)
- Commentaires obsolètes mais logique active
- Pattern template (utilité future possible)
- Pourrait être utilisé par des API tierces

---

## 🎯 Techniques de détection

1. **Grep search** - Vérifier si une fonction est appelée
   ```bash
   grep -r "functionName" server/features/
   # Si 0 résultat → probablement orphelin
   ```

2. **Imports inutilisés** - Chercher les imports non utilisés
   ```bash
   grep -n "^import\|^const.*require" file.js
   # Vérifier chaque import dans le code du fichier
   ```

3. **Fichiers dupliqués** - Chercher les fichiers similaires
   ```bash
   # Comparer tailles/contenus de fichiers
   ```

4. **Blocs commentés** - Chercher les `/* ... */` ou `// ...` en masse
   ```bash
   grep -n "^[ ]*//.*TODO\|^[ ]*/\*" file.js
   ```

5. **Analyse dépendances** - Chercher les imports depuis le fichier
   ```bash
   grep -r "from.*filename\|require.*filename" server/
   ```

---

## ✅ Règles Backend

- ❌ **JAMAIS** laisser du code mort en production
- ✅ **TOUJOURS** vérifier avec grep avant de supprimer
- ✅ **NETTOYER** les imports inutilisés
- ✅ **DOCUMENTER** avant suppression (pourquoi c'était là)
- 😴 Le code non utilisé = gaspillage de maintenance

---

## 📝 Template de rapport

```markdown
# 🧹 Audit Code Orphelin - [DOSSIER]

## Stats
- Total fichiers scannés: X
- Orphelins trouvés: Y
- Lignes de code mort: Z

## Critiques (à supprimer immédiatement)
- [ ] Fichier X
- [ ] Fonction Y ligne Z

## Probables (à vérifier)
- [ ] Fonction X (0 appels trouvés)
- [ ] Import Y (déclaré, jamais utilisé)

## Doutes
- [ ] Export X (à clarifier)

## Ordre de suppression
1. CRITICAL (X fichiers/sections)
2. HIGH (Y fonctions/imports)
3. MEDIUM (Z exports)
```

---

## ⚠️ Points d'attention (OBLIGATOIRES AVANT SUPPRESSION)

### **Avant de marquer comme CRITICAL ou HIGH:**
- ✅ **Faire MINIMUM 5 grep searches différentes** (patterns variés)
  ```bash
  grep -r "functionName" server/
  grep -r "from.*functionName" .
  grep -r "require.*functionName" .
  grep -r "functionName(" .
  grep -r "functionName }" .  # destructuring
  ```
- ✅ **Vérifier les imports croisés** (A → B → C usage chains)
- ✅ **Attention aux dynamiques** (`require(variable)`, `import(variable)`, `eval()`)
- ✅ **Vérifier index.js/barrel exports** - Si exporté, autre code peut l'importer
- ✅ **Vérifier les tests** - Même si tests ne run en prod, usage confirme qu'on utilise
- ✅ **Vérifier les commentaires** - Avec TODO/FIXME peut indiquer usage futur
- ✅ **Documenter le WHY** avant de supprimer (historique git aide)
- ✅ **Tester après suppression** - Compiler + run end-to-end + vérifier logs

### **Interdictions absolues:**
- ❌ **NE PAS supposer** ("je pense que c'est orphelin")
- ❌ **NE PAS ignorer un grep match** (même indirect, c'est une preuve d'usage)
- ❌ **NE PAS supprimer sans test E2E** (même si 100% certain)
- ❌ **NE PAS laisser imports orphelins** après suppression du code
- ❌ **NE PAS supprimer du code utilisé par d'autres portals** (LRG + COMUSE)

---

## 🚀 Prochaines étapes

1. ✅ **Générer le rapport d'audit** avec preuves concrètes
2. ✅ **Trier par certitude** (CRITICAL 100% → HIGH 95% → MEDIUM?? → LOW??)
3. ✅ **Valider avec équipe** OBLIGATOIRE pour HIGH et au-dessus
4. ✅ **Supprimer par passes** (CRITICAL seulement d'abord, test E2E après)
5. ✅ **Tester fonctionnellement** après chaque passe (frontend + backend + logs)
6. ✅ **S'il y a doute → conserver le code** (maintenance > micro-optimisation)
