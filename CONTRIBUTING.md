# Contributing to Binance Skills Hub

Thanks for contributing to Binance Skills Hub.

## Repository Structure

Each skill should live in its own folder and include a `SKILL.md` file.

Example:

```text
skills/<provider>/<skill-name>/SKILL.md
```

Optional docs (if needed):

- `README.md`
- `README.cn.md`
- `references/*`

## Required `SKILL.md` Frontmatter

Every `SKILL.md` must start with YAML frontmatter.

```yaml
---
name: <skill-name>
description: <what the skill does and when to use it>
metadata:
  version: "1.0.0"
  author: <your-github-username>
---
```

## Naming & Versioning

- `name`: use lowercase kebab-case (example: `query-token-info`)
- folder name should match skill `name` when practical
- `metadata.version`: use semantic versioning (`MAJOR.MINOR.PATCH`)

## Before Opening a PR

- [ ] Skill is in a dedicated folder under `skills/`
- [ ] `SKILL.md` exists and frontmatter fields are complete
- [ ] Description clearly states use cases and limits
- [ ] Example requests/responses are valid and readable
- [ ] No secrets, API keys, or private credentials in committed files
- [ ] Docs-only changes are clearly labeled in PR title/body

## Pull Request Tips

- Keep each PR focused and small (one logical change)
- Use a clear title (`docs: ...`, `feat: ...`, `fix: ...`)
- Explain what changed and why

Thank you for helping improve the Skills Hub.
