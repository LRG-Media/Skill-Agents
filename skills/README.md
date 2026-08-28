# Agent Skills

Skills Copilot Chat pour le projet PortalWebApp. Chaque skill est un dossier avec un `SKILL.md` qui contient les instructions.

## Structure

```
.github/skills/
├── backend/                          Backend Node.js/Express/Prisma
│   ├── backend-custom-fields-integration/
│   ├── backend-feature-creator/
│   ├── backend-feature-structure/
│   ├── backend-psql-explorer/
│   ├── prisma-cli/
│   ├── prisma-client-api/
│   └── server-feature-optimization/
├── frontend/                         Frontend React/TypeScript
│   ├── frontend-api-call-patterns/
│   └── frontend-feature-structure/
├── cloud/                            Serveur cloud, DNS, WordPress
│   ├── cloud-dns-server/
│   ├── cloud-nginx-log-analyzer/
│   ├── cloud-ssh-server/
│   ├── cloud-wp-cli/
│   └── cloud-wp-media-cleanup/
├── figma/                            Design Figma
│   └── figma-design/
└── software/                         Gestion projet, Git, Copilot, Issues
    ├── changelog-updater/
    ├── create-github-issue/
    ├── portal-feature-architect/
    ├── push-changes-github/
    ├── route-permission-sync/
    ├── vscode-github-copilot-chat-management/
    └── zoho-books/
```

## Configuration VS Code

Dans **User settings** (`settings.json`) :

```json
"chat.agentSkillsLocations": {
    ".github/skills/cloud": true,
    ".github/skills/global": true,
    ".github/skills/software/figma": true,
    ".github/skills/software/github": true,
    ".github/skills/software/zoho": true,
    ".github/skills/web-portal/backend": true,
    ".github/skills/web-portal/frontend": true
}
```

> ⚠️ VS Code ne scanne PAS récursivement. Chaque sous-dossier doit être ajouté séparément.

## Utilisation

Dans le chat Copilot, taper `/` suivi du nom du skill :

```
/backend-feature-creator
/frontend-api-call-patterns
/cloud-ssh-server
/vscode-github-copilot-chat-management
```

## Ajouter un skill

1. Créer un dossier dans la catégorie appropriée
2. Ajouter un `SKILL.md` avec le frontmatter :

```yaml
---
name: mon-skill
description: "Description courte du skill"
---
```

3. Si c'est une nouvelle catégorie, ajouter le path dans les settings VS Code
