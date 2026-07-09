---
description: "Backend development guidelines for ClientPortal LRG Node.js/Express application"
applyTo: "server/**/*"
---

# Backend Rules (Compact)

1. Use Logger only in backend code. Never use console methods.
2. Keep API payload and response keys in snake_case.
3. Use real data and a fresh auth token for protected endpoint tests.
4. PowerShell commands must be one line and use ; (never &&).
5. After backend tests/changes, check server/logs/app.log.
6. Keep changes minimal and aligned with existing patterns.

## Feature Structure

Use the existing local feature layout first.

Backend features may be either:
- flat, with a few files at the feature root when the feature is small
- layered, with subfolders when the feature has enough files to justify them

Keep responsibilities separated within the structure that already exists locally:
- controllers/: HTTP handling only
- services/: business logic and integrations
- models/: schemas and entities
- routes/: route wiring and middleware
- utils/: helper functions

Do not introduce a new folder just to satisfy a generic template.

## Inter-Feature Architecture (Critical)

- Inter-feature integration must happen service-to-service.
- Controllers must call only their local feature services.
- Never connect a controller directly to an external feature service.
- Never connect a controller directly to an external feature controller.
- Never connect controllers controller-to-controller across features.
- If feature A needs data/action from feature B, expose a local service method in feature A that delegates to feature B service.

## API Response Standardization (Critical)

responseOptimizer is applied globally in server.js.
- Controllers should use res.successResponse, res.listResponse, res.errorResponse.
- Services should return pure business data (no response formatting).
- Routes must not import responseOptimizer manually unless they explicitly compose a route middleware stack that requires it and the local pattern already does so.

## snake_case Convention (Critical)

All API fields must be snake_case.
- Booleans: is_active, has_complete_profile
- Timestamps: created_at, updated_at, deleted_at
- Foreign keys: user_id, account_id, contact_id
- Counts: comments_count, subtasks_count

Never mix camelCase and snake_case in the same API response.

## Security and Permissions

- Protect routes with authenticateToken and requirePermission.
- Reuse existing feature permission middlewares when available.
- Keep role/access filtering in services, not in UI.
- Log denied access and security-relevant actions with Logger.

## Prisma and Database Workflow (Critical)

For server/prisma updates:
1. Edit source schema definitions in feature model schema files (for generated flows).
2. Generate prisma schema/client using project scripts.
3. Apply schema/migrations to DB.
4. Validate endpoint behavior with real API calls.

Rules:
- Prefer safe, additive migrations unless explicitly asked for destructive changes.
- Respect portal isolation; never mix data across portals.
- Add indexes for frequently filtered or joined columns.

## Documentation Alignment

- If a README or reference doc conflicts with the current feature tree, follow the actual feature tree and treat the doc as stale until updated.
- Prefer updating instructions and docs to match the repo instead of renaming stable code paths without explicit request.

## Logging and Validation

- Log key operations (start, success, error) with contextual metadata.
- Use centralized error handling and standardized API errors.
- Validate changed endpoints end-to-end and then inspect app.log.
- For localhost validation, follow the local-validation-orchestrator skill as the source of truth for server reuse and test flow.

## Testing Checklist

- Fresh token retrieved from the active portal config.
- Protected endpoint tested with Authorization header.
- Response shape verified in snake_case.
- app.log reviewed for regressions after tests.
