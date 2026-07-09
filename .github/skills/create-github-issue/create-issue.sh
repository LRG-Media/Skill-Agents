#!/bin/bash
# create-issue.sh — Script pour créer une issue GitHub avec pinned fields
# Usage: ./create-issue.sh --title "..." --type "Bug" --body "..." --priority "Medium"
#
# Requirements: gh CLI v2.94+, node.js, git

set -euo pipefail

# ── Default values ──
REPO=""
ISSUE_TYPE=""
PRIORITY=""
FEATURE=""
PROJECT="Roadmap"
TITLE=""
BODY=""
BODY_FILE=""

# ── Parse arguments ──
while [[ $# -gt 0 ]]; do
  case $1 in
    --title)     TITLE="$2";       shift 2 ;;
    --type)      ISSUE_TYPE="$2";  shift 2 ;;
    --body)      BODY="$2";        shift 2 ;;
    --body-file) BODY_FILE="$2";   shift 2 ;;
    --priority)  PRIORITY="$2";    shift 2 ;;
    --feature)   FEATURE="$2";     shift 2 ;;
    --project)   PROJECT="$2";     shift 2 ;;
    --repo)      REPO="$2";        shift 2 ;;
    -h|--help)
      echo "Usage: $0 --title \"...\" --type Bug|Improvements --body \"...\" --priority Urgent|High|Medium|Low [--body-file file.md] [--feature CRM|Finance|...] [--project Roadmap]"
      echo ""
      echo "  --body      Body text (for short bodies)"
      echo "  --body-file Path to a markdown file (for long bodies — PREFERRED)"
      exit 0
      ;;
    *) echo "❌ Unknown option: $1"; exit 1 ;;
  esac
done

# ── Validate required args ──
if [ -z "$TITLE" ]; then     echo "❌ --title is required";     exit 1; fi
if [ -z "$ISSUE_TYPE" ]; then echo "❌ --type is required (Bug|Improvements)"; exit 1; fi
if [ -z "$BODY" ] && [ -z "$BODY_FILE" ]; then echo "❌ --body or --body-file is required"; exit 1; fi
if [ -z "$PRIORITY" ]; then   echo "❌ --priority is required (Urgent|High|Medium|Low)"; exit 1; fi

# ── Resolve body from file if --body-file was provided ──
if [ -n "$BODY_FILE" ]; then
  if [ ! -f "$BODY_FILE" ]; then echo "❌ File not found: $BODY_FILE"; exit 1; fi
  BODY=$(cat "$BODY_FILE")
fi

# ── Auto-detect repo ──
if [ -z "$REPO" ]; then
  REPO=$(git remote get-url origin 2>/dev/null | sed -E 's#.*github\.com[:/](.+)\.git#\1#')
fi
if [ -z "$REPO" ]; then echo "❌ Cannot detect repo. Use --repo owner/name"; exit 1; fi

OWNER=$(echo "$REPO" | cut -d/ -f1)
REPO_NAME=$(echo "$REPO" | cut -d/ -f2)

echo "📋 Repo: $OWNER/$REPO_NAME"
echo "📋 Type: $ISSUE_TYPE | Priority: $PRIORITY | Project: $PROJECT"
[ -n "$FEATURE" ] && echo "📋 Feature: $FEATURE"

# ── Resolve pinned fields via GraphQL ──
echo "🔍 Resolving pinned fields..."

ISSUE_TYPES_JSON=$(gh api graphql -f query='
query($o: String!, $n: String!) {
  repository(owner: $o, name: $n) {
    issueTypes(first: 10) {
      nodes {
        name
        pinnedFields {
          ... on IssueFieldSingleSelect {
            name
            id
            options { id name }
          }
          ... on IssueFieldDate {
            name
            id
          }
        }
      }
    }
  }
}' -F o="$OWNER" -F n="$REPO_NAME" 2>/dev/null)

# Extract IDs via node.js (Windows-compatible, no jq dependency)
PRIORITY_FIELD_ID=$(echo "$ISSUE_TYPES_JSON" | node -e "
  const chunks = [];
  process.stdin.on('data', c => chunks.push(c));
  process.stdin.on('end', () => {
    const d = JSON.parse(chunks.join(''));
    const t = d.data.repository.issueTypes.nodes.find(n => n.name === '$ISSUE_TYPE');
    const f = t ? t.pinnedFields.find(f => f.name === 'Priority') : null;
    console.log(f ? f.id : '');
  });
" 2>/dev/null)

OPTION_ID=$(echo "$ISSUE_TYPES_JSON" | node -e "
  const chunks = [];
  process.stdin.on('data', c => chunks.push(c));
  process.stdin.on('end', () => {
    const d = JSON.parse(chunks.join(''));
    const t = d.data.repository.issueTypes.nodes.find(n => n.name === '$ISSUE_TYPE');
    const f = t ? t.pinnedFields.find(f => f.name === 'Priority') : null;
    const o = f ? f.options.find(o => o.name === '$PRIORITY') : null;
    console.log(o ? o.id : '');
  });
" 2>/dev/null)

# Feature (optional)
FEATURE_FIELD_ID=""
FEATURE_OPTION_ID=""
if [ -n "$FEATURE" ]; then
  FEATURE_FIELD_ID=$(echo "$ISSUE_TYPES_JSON" | node -e "
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      const d = JSON.parse(chunks.join(''));
      const t = d.data.repository.issueTypes.nodes.find(n => n.name === '$ISSUE_TYPE');
      const f = t ? t.pinnedFields.find(f => f.name === 'Feature') : null;
      console.log(f ? f.id : '');
    });
  " 2>/dev/null)

  FEATURE_OPTION_ID=$(echo "$ISSUE_TYPES_JSON" | node -e "
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      const d = JSON.parse(chunks.join(''));
      const t = d.data.repository.issueTypes.nodes.find(n => n.name === '$ISSUE_TYPE');
      const f = t ? t.pinnedFields.find(f => f.name === 'Feature') : null;
      const o = f ? f.options.find(o => o.name === '$FEATURE') : null;
      console.log(o ? o.id : '');
    });
  " 2>/dev/null)
fi

# ── Verify resolution ──
if [ -z "$PRIORITY_FIELD_ID" ] || [ -z "$OPTION_ID" ]; then
  echo "⚠️  Cannot resolve Priority/$PRIORITY dynamically"
  echo "   → Check pinned fields in Settings > Issue Types"
  echo "   → Or assign manually from GitHub web UI"
  echo ""
fi

# ── Create body file ──
BODY_FILE=$(mktemp /tmp/issue-body-XXXXXX.md 2>/dev/null || mktemp)
echo "$BODY" > "$BODY_FILE"

# ── Create issue ──
echo "🔨 Creating issue..."
ISSUE_URL=$(gh issue create --repo "$REPO" \
  --title "$TITLE" \
  --body-file "$BODY_FILE" \
  --type "$ISSUE_TYPE" \
  --project "$PROJECT" 2>&1)

ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')
echo "✅ Issue created: $ISSUE_URL"

# ── Assign Priority via GraphQL ──
if [ -n "$PRIORITY_FIELD_ID" ] && [ -n "$OPTION_ID" ]; then
  echo "📌 Assigning Priority: $PRIORITY..."

  NODE_ID=$(gh api graphql -f query='
  query($o: String!, $n: String!, $num: Int!) {
    repository(owner: $o, name: $n) {
      issue(number: $num) { id }
    }
  }' -F o="$OWNER" -F n="$REPO_NAME" -F num="$ISSUE_NUMBER" 2>/dev/null | node -e "
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      const d = JSON.parse(chunks.join(''));
      console.log(d.data.repository.issue.id);
    });
  " 2>/dev/null)

  if [ -n "$NODE_ID" ]; then
    gh api graphql -f query='
    mutation($issueId: ID!, $fieldId: ID!, $optionId: ID!) {
      updateIssueFieldValue(input: {
        issueId: $issueId
        issueField: {
          fieldId: $fieldId
          singleSelectOptionId: $optionId
        }
      }) { issue { number } }
    }' --raw-field issueId="$NODE_ID" \
       --raw-field fieldId="$PRIORITY_FIELD_ID" \
       --raw-field optionId="$OPTION_ID" >/dev/null 2>&1

    echo "   ✅ Priority assigned: $PRIORITY"
  else
    echo "   ⚠️  Could not get Node ID for Priority assignment"
  fi
fi

# ── Assign Feature via GraphQL (optional) ──
if [ -n "$FEATURE" ] && [ -n "$FEATURE_FIELD_ID" ] && [ -n "$FEATURE_OPTION_ID" ]; then
  echo "📌 Assigning Feature: $FEATURE..."

  NODE_ID=$(gh api graphql -f query='
  query($o: String!, $n: String!, $num: Int!) {
    repository(owner: $o, name: $n) {
      issue(number: $num) { id }
    }
  }' -F o="$OWNER" -F n="$REPO_NAME" -F num="$ISSUE_NUMBER" 2>/dev/null | node -e "
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      const d = JSON.parse(chunks.join(''));
      console.log(d.data.repository.issue.id);
    });
  " 2>/dev/null)

  if [ -n "$NODE_ID" ]; then
    gh api graphql -f query='
    mutation($issueId: ID!, $fieldId: ID!, $optionId: ID!) {
      updateIssueFieldValue(input: {
        issueId: $issueId
        issueField: {
          fieldId: $fieldId
          singleSelectOptionId: $optionId
        }
      }) { issue { number } }
    }' --raw-field issueId="$NODE_ID" \
       --raw-field fieldId="$FEATURE_FIELD_ID" \
       --raw-field optionId="$FEATURE_OPTION_ID" >/dev/null 2>&1

    echo "   ✅ Feature assigned: $FEATURE"
  else
    echo "   ⚠️  Could not get Node ID for Feature assignment"
  fi
elif [ -n "$FEATURE" ]; then
  echo "⚠️  Feature '$FEATURE' not found in Issue Type options"
fi

# ── Cleanup ──
rm -f "$BODY_FILE"

# ── Done ──
echo ""
echo "🎉 Done! Issue #$ISSUE_NUMBER: $ISSUE_URL"
echo "$ISSUE_URL"
