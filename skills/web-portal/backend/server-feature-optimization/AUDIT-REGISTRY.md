# Audit Registry — server-feature-optimization

Suivi des analyses effectuées. Ce fichier est **automatiquement mis à jour** après chaque audit.
Ne pas le modifier manuellement — le skill gère l'ajout et la mise à jour.

## Comment utiliser

- **Avant d'auditer** : vérifier si la feature est déjà listée et quand elle a été analysée
- **Si analysée < 30 jours** : proposer un `quick win` au lieu d'un audit complet (sauf si l'utilisateur demande un audit complet)
- **Si analysée > 90 jours** : recommander un ré-audit complet
- **Après un audit** : ajouter ou mettre à jour l'entrée dans ce fichier

---

## Toutes les Features du projet

| Feature | Dernier audit | Score | Violations | Agent | Notes |
|---------|--------------|-------|------------|-------|-------|
| `communication/chats` | — | — | — | — | Non audité |
| `communication/emails` | — | — | — | — | Non audité |
| `communication/notes` | 2026-08-13 | 8/10 | 4 critiques, 5 warnings | Copilot | Audit complet — transactions manquantes, pas de fenêtrage getAccountNotesWithRelated, ActivityLogManager absent |
| `communication/notifications` | — | — | — | — | Non audité |
| `crm/accounts` | — | — | — | — | Non audité |
| `crm/contacts` | — | — | — | — | Non audité |
| `crm/leads` | — | — | — | — | Non audité |
| `finances/invoices` | — | — | — | — | Non audité |
| `finances/line-items` | — | — | — | — | Non audité |
| `finances/payment` | — | — | — | — | Non audité |
| `finances/quotes` | — | — | — | — | Non audité |
| `finances/subscription` | — | — | — | — | Non audité |
| `project-management/appointments` | — | — | — | — | Non audité |
| `project-management/projects` | — | — | — | — | Non audité |
| `project-management/tasks` | — | — | — | — | Non audité |
| `project-management/time-tracking` | — | — | — | — | Non audité |
| `system/auth` | — | — | — | — | Non audité |
| `system/backups` | — | — | — | — | Non audité |
| `system/custom-fields` | — | — | — | — | Non audité |
| `system/feedbacks` | — | — | — | — | Non audité |
| `system/files` | — | — | — | — | Non audité |
| `system/integrations` | — | — | — | — | Non audité |
| `system/scheduler` | — | — | — | — | Non audité |
| `system/settings` | — | — | — | — | Non audité |
| `system/tags` | — | — | — | — | Non audité |
| `system/users` | — | — | — | — | Non audité |
| `system/workflows` | — | — | — | — | Non audité |
| `portal-specific/comuse/inspections` | — | — | — | — | Non audité |
| `portal-specific/lrgmedia/site-health` | — | — | — | — | Non audité |
| `portal-specific/terrains_mauricie/estates` | — | — | — | — | Non audité |
| `portal-specific/terrains_mauricie/properties` | — | — | — | — | Non audité |
