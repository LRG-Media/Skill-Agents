---
description: "Directives de developpement frontend pour l'application React - Version Consolidee"
applyTo: "client/src/**/*"
---

# Frontend Rules (Compact)

1. Keep business logic in backend; frontend handles UI and local state only.
2. Reuse existing components and feature patterns before creating new ones.
3. Use ConfirmationPopup for confirmations (no custom confirmation dialog).
4. Keep API services pure (no business calculations in services/pages/components).
5. After every frontend modification, run the client build and lint, then fix any syntax or lint errors before closing the task.

## Route and Permission Pattern

When adding a page route:
- Wrap with ConditionalRoute for feature flag gating.
- Wrap with AutoProtectedRoute for permission gating.
- Keep route/permission config synchronized (route config, permissions, sidebar/settings entries if applicable).

## Feature Pattern

Preferred pattern for feature pages:
- Thin page component that renders GenericFeaturePage with config.
- Feature hook manages list state, filters, pagination, CRUD state.
- API service handles transport and error mapping only.
- UI components stay presentational and stateless when possible.

## ConfirmationPopup (Critical)

Always import and use the shared modal:
- client/src/shared/components/modals/ConfirmationPopup.jsx

Do not:
- create custom confirmation modals for standard confirm flows
- use window.confirm or window.alert for app confirmations

## Toast Rules (Critical)

Toast message text must not include icons/emojis/SVG.
- Correct: plain text message + toast type (success/error/warning/info)
- Incorrect: message strings containing symbols such as checkmarks or warning emojis

## UI and Design Consistency

- Use existing theme tokens/classes and shared UI components.
- Keep pages responsive for desktop and mobile.
- Favor consistency with existing design system over local one-off styles.

## Data Handling and Performance

- Prefer memoization/callbacks only where they reduce real re-renders.
- Keep derived values in selectors/useMemo, not duplicated state.
- Avoid unnecessary list reloads after CRUD when local state update is sufficient.

## Frontend Validation Checklist

- Route works with feature toggle and permission rules.
- Confirmation actions use ConfirmationPopup.
- Toast content is plain text and typed.
- API payload/response handling matches backend contract.
- For localhost validation, follow the local-validation-orchestrator skill as the source of truth for server reuse and test flow.
- Client build passes after changes.
- Client lint passes after changes.
- Any syntax or lint errors are fixed before closing.
