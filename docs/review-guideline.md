# Skills Hub Review Guideline

This document helps reviewers evaluate skill contribution PRs consistently.

## 1) Structural Checks

- Skill lives under `skills/<provider>/<skill-name>/`
- `SKILL.md` is present
- Frontmatter includes:
  - `name`
  - `description`
  - `metadata.version`
  - `metadata.author`

## 2) Content Quality Checks

- Description clearly states use cases and boundaries
- Instructions are actionable and specific
- Examples are coherent and likely runnable
- Terminology is consistent across files (`SKILL.md`, README, references)

## 3) Security & Safety Checks

- No committed API keys, secrets, tokens, private endpoints, or credentials
- No instructions that bypass auth/safety controls
- Risky actions include explicit user-confirmation guidance when needed

## 4) Duplication & Scope Checks

- Skill does not duplicate an existing skill without clear added value
- Scope is focused (single purpose preferred)
- PR size is reviewable; unrelated changes are avoided

## 5) Decision Guidance

### Approve when

- Structure and frontmatter are correct
- Content is clear, safe, and useful
- No obvious duplication or hidden risk

### Request changes when

- Required metadata is missing
- Instructions are vague/inaccurate
- Security concerns or secret leakage risk exists

### Close when

- Contribution is clearly out-of-scope
- Submission is duplicate with no meaningful improvement

---

Tip: prioritize small, high-quality PRs to keep queue throughput healthy.
