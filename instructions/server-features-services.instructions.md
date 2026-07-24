---
description: "Règles pour server/features et les services partagés: integrations, files, activity log, Logger, notes"
applyTo: "server/features/**/*"
---

# Server Features and Services Rules

## Scope

- Applies to every file under `server/features`, especially service files such as `*.service.js` and classes like `ChatSocketService.js`.
- Treat feature services as the place for domain orchestration; keep controllers thin.

## Mandatory Service Ownership

### Integrations

- Any feature needing reads or writes in the integrations table must go through `server/features/system/integrations/services/integrations.global.service.js` via `ResourceIntegrationService`.
- Do not call `prisma.integrations` directly from feature code.
- Do not import token managers or integration managers directly in feature services when the same work is available through `ResourceIntegrationService`.
- If a new integration use case appears in 2 or more feature services, add or extend a method in `ResourceIntegrationService` first.

### Files

- Any feature needing reads or writes in the files table must go through `server/features/system/files/files.global.service.js` via `FilesService`.
- Do not call `prisma.files` directly from feature code.
- Prefer extending `FilesService` when file logic is reused by multiple services.

### Activity Logs

- Any business event that must be audited should use `server/shared/logging/ActivityLogManager.js`.
- Use `ActivityLogManager.logEvent(eventType, resourceType, resourceId, { actorId, description, metadata })`.
- Use it for create, update, delete, link, unlink, sync, and other domain state transitions.

### Operational Logs

- Use `server/shared/logging/Logger.js` for server logs.
- Do not use `console.*` in backend feature code.
- `Logger` is for operational, debug, and error logs, not audit history.

### Notes

- Any note read/write flow should use `server/features/communication/notes/note.service.js`.
- Resource services should delegate note retrieval through `NoteService.getNotesByResource(...)`.
- Do not duplicate note queries in feature services.

## Service Design Rules

- Controllers call only local feature services.
- Feature services may call shared/global services and local feature services, but never controllers.
- If the same integration, file, note, or log logic appears in multiple services, centralize it instead of copying Prisma calls.
- Prefer one reusable method in the owning shared/global service over feature-local duplication.
- Keep direct DB access inside the owning shared/global service unless a read-only existence check cannot reasonably be modeled there.
- When a path in this file conflicts with the repo tree, update the path before using it as a rule.

## Known Cross-Feature Reuse

- `ResourceIntegrationService` is reused by projects, properties, estates, inspections, accounts, contact-related services, and project models.
- `FilesService` is reused by project and property workflows.
- `ActivityLogManager` is reused by project, task, appointment, auth, contact, account, settings, users, email, and workflow services.
- `NoteService` is reused by project, lead, contact, account, appointment, task, time tracking, estate, and property services.

## Default Rule

- If a feature service needs one of these concerns, use the shared or global service first; only add feature-local logic when the shared service cannot express the use case.