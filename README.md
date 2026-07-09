# GitHub Custom Configuration

Configurations Copilot réutilisables pour tous mes projets.

## Structure

```
.github/
├── copilot-instructions.md        # Instructions globales Copilot
├── instructions/                   # Instructions par domaine
│   ├── backend.instructions.md
│   ├── frontend.instructions.md
│   ├── scripts.instructions.md
│   └── server-features-services.instructions.md
├── skills/                         # Skills métier
│   ├── backend-feature-structure/
│   ├── changelog-updater/
│   ├── create-github-issue/
│   ├── frontend-feature-structure/
│   ├── local-db-query/
│   ├── lrgmedia-ssh-recon/
│   ├── portal-feature-architect/
│   ├── push-changes-github/
│   └── route-permission-sync/
├── agents/                         # Agents personnalisés
│   └── lrgmedia-ssh-auditor.md
├── chatmodes/                      # Modes de chat
│   └── Features-Analysis.chatmode.md
└── prompts/                        # Prompts réutilisables
    ├── controller-format-compliance.prompt.md
    ├── file-cleanup.prompt.md
    ├── optimize-feature-assistant.prompt.md
    ├── orphaned-code-audit.prompt.md
    ├── reponsive.prompt.md
    ├── resume-projet.prompt.md
    ├── simplify-jsx-structure-v2.0.prompt.md
    └── validation-schemas.prompt.md
```

## Utilisation

Dans un projet existant, sym-link ou copiez le `.github/` correspondant :

```bash
# Symlink (recommandé)
ln -s /path/to/GitHub-Custom-Configuration/.github .github

# Ou copie sélective
cp -r /path/to/GitHub-Custom-Configuration/.github/skills ./skills
cp -r /path/to/GitHub-Custom-Configuration/.github/instructions ./instructions
```
