---
title: Vibers Code Review
description: Human code review for AI-generated projects. Checks spec compliance, security (OWASP top 10), AI hallucinations, and submits PRs with fixes.
metadata:
  version: 1.0.0
  author: marsiandeployer
  tags:
    - code-review
    - security
    - github-actions
    - ai
---

# Vibers — Human Code Review for AI-Generated Projects

You push code. We review it against your spec, fix issues, and send a PR.

## Quick Start (3 steps)

### Step 1. Add collaborator

Go to your repo → Settings → Collaborators → Add **`marsiandeployer`**

### Step 2. Add GitHub Action

Create `.github/workflows/vibers.yml`:

```yaml
name: Vibers Code Review
on:
  push:
    branches: [main]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: marsiandeployer/vibers-action@v1
        with:
          spec_url: 'https://docs.google.com/document/d/YOUR_SPEC_ID/edit'
          telegram_contact: '@your_telegram'
```

### Step 3. Add commit rules to your AI agent

Add this to your `CLAUDE.md`, `.cursorrules`, or `AGENTS.md`:

```markdown
## Commit messages

Every commit MUST include a "How to test" section in the body:
- Live URL to open and verify the change
- Step-by-step what to click/check
- Expected result for each step
```

**Done.** Every push triggers a review. You'll get a PR with fixes within 24 hours.

## What We Check

- Spec compliance
- Security (OWASP top 10)
- AI hallucinations (fake APIs/imports)
- Logic bugs
- UI issues

## Links

- GitHub Action: [marsiandeployer/vibers-action](https://github.com/marsiandeployer/vibers-action)
- Landing: [vibers.onout.org](https://vibers.onout.org)
- Telegram: [@onoutnoxon](https://t.me/onoutnoxon)
