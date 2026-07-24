# ClientPortal LRG - Lean Rules

## 1) Communication & Output Format (Strict)

- **Zéro réflexion à voix haute :** Ne jamais afficher le processus de réflexion, d'analyse ou de Chain of Thought (CoT). Ne jamais afficher les messages de correction interne (ex: "Let me retry with the correct agent name", "should be used as X not Y"). Corriger silencieusement en arrière-plan.
- **Zéro politesse & Fluff :** Supprimer les intros ("Voici le code..."), les salutations et les conclusions ("N'hésitez pas...").
- **Code direct :** Aller directement au but. Fournir uniquement les blocs de code modifiés ou la réponse technique exacte.
- **Aucune explication non sollicitée :** Ne pas expliquer le code écrit, sauf si explicitement demandé par l'utilisateur.
- **Partiel vs Complet :** Ne jamais réécrire un fichier complet pour quelques lignes modifiées. Utiliser `// ... code existant ...` pour tronquer.
- **Une pensée par ligne :** Être ultra-concis. Poser **une seule** question courte uniquement si tu es totalement bloqué (*blocked*).

## 2) Core engineering rules

- Use real data only (no synthetic IDs).
- Keep changes minimal and atomic.
- Reuse existing patterns before adding new ones.
- Validate end-to-end after implementation.
- Read server app.log after tests or code changes.
- Treat local repo conventions as the source of truth when they conflict with generic examples in docs.

## 3) Area requirements

- Backend: Logger only (no console), snake_case API responses.
- Frontend: no business logic in UI; use ConfirmationPopup.
- API work: always test protected routes with a fresh token.

## 4) Bash & Terminal rules

- Use `&&` to chain sequential commands safely. Avoid execution if a previous command fails.
- API test commands (e.g., `curl`, `httpie`) must be structured on a single line.
- Commands must start directly with the executable binary, avoiding shell wrapper relics or interactive prompt headers.

## 5) Fresh token workflow (required)

1. Determine active portal (URL/domain, npm context, then user input).
2. Load portal config: portal-configs/<portal>.json.
3. Read email/password from test_credentials.
4. Read API base URL from deployment.environment.development.api_url.
5. Login and extract token from first existing key:
  - data.access_token
  - data.token
  - access_token
  - token
6. Call protected routes with Authorization: Bearer <token>.
7. If no token, inspect login response shape; if no test_credentials, ask user credentials.

## 6) Token budget and context control

- Keep prompts/replies short to minimize context weight.
- Use targeted search and read only necessary lines.
- Use only tools that directly advance the task.
- Avoid duplicate reads, unrelated batches, and empty tool calls.
- Do not restate long plans or already confirmed context.

## 7) Instruction hierarchy

- Prefer the most specific instruction file that matches the touched path.
- If a feature is already structured locally, follow that local structure before applying a generic template.
- Treat reference docs as guidance unless they explicitly state they are normative.

## 8) Subagent usage (simple edits)

- Prefer one focused subagent call for simple file edits.
- **Toujours** passer `model: "MiMo V2.5 (customendpoint)"` dans chaque appel `runSubagent`. Ne jamais omettre ce paramètre.
- Ne pas confondre `model` (le LLM) avec `agentName` (l'agent expert).
- Keep prompts narrow; consolidate result in main agent.
