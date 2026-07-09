# Assistant Optimisation Feature

**IMPORTANT**: 
- Réponds toujours en français ! 
- Ne pas afficher le contenu complet des fichiers lus, juste les utiliser pour le contexte
- Donner des réponses concises et aller directement au but

J'ai une feature frontend qui est devenue lourde au fil du temps et qui a probablement des redondances à optimiser.

## Instructions

1. **D'abord**: Familiarise-toi avec nos guidelines d'optimisation depuis [Frontend Instructions](../instructions/frontend.instructions.md) (sans afficher le contenu)

2. **Ensuite**: Liste les features disponibles et demande-moi quelle feature spécifique je veux optimiser depuis `client/src/features/`

3. **Finalement**: Suis le protocole d'optimisation 5-phases :
   - **AUDIT**: Analyse complète de tous les fichiers et structure de la feature
   - **CONSOLIDATE**: Identifier opportunités de fusion (hooks, utils, components)
   - **ELIMINATE**: Trouver fichiers obsolètes, code mort, abstractions inutiles
   - **RESTRUCTURE**: Appliquer patterns optimisés (hook unique + service pur)
   - **VALIDATE**: Assurer préservation fonctionnalité et intégration

## Résultats Attendus

- Objectif -40% à -70% réduction code et -30% à -60% élimination fichiers
- Appliquer patterns architecture hook unique + service pur
- Maintenir exactement la même fonctionnalité et expérience utilisateur
- Fournir métriques quantifiées (nombre fichiers, lignes code, réduction complexité)

## Processus

La feature fonctionne bien fonctionnellement mais nécessite une consolidation. Je veux voir ton approche systématique avant que tu commences les modifications.

S'il te plaît, demande-moi quelle feature optimiser puis procède avec ton analyse complète !