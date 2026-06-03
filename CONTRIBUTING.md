# Contributing to Binance Skills Hub

Thanks for contributing to **Binance Skills Hub**.

## Table of Contents

- [Skills](#skills)
- [Trading Rules](#trading-rules)
- [Naming Convention](#naming-convention)
- [Project Structure](#project-structure)
  - [References](#references)
  - [Scripts](#scripts)

## Skills

Each contribution should be added as a separate skill under the `skills/` directory.

Skills should be:

- Clearly named
- Easy to review
- Well documented
- Self-contained where possible

Please keep implementations readable:

- Do **not** obfuscate code
- Do **not** require root access
- Keep external dependencies minimal and document them clearly

Each skill must include a **frontformatter** for Clawhub with these required fields:

- `name`
- `description`
- `version`
- `license`

Example:

```yaml
---
name: example-skill
description: Short summary of the skill
version: 0.1.0
license: MIT
---
```

## Trading Rules

Skills related to markets, tokens, wallets, or trading must follow these rules:

- Do **not** promote any coin, token, or asset
- Do **not** present any asset as guaranteed, safe, or recommended
- Do **not** include or share any valid wallet address

Content should remain neutral, factual, and educational.

## Naming Convention

Follow the naming style already used in the repository:

- Use lowercase
- Use hyphens (`-`) between words
- Do **not** use spaces or underscores
- Keep names short and descriptive

Examples:

- `market-analysis`
- `wallet-tracker`
- `token-listing-checker`

The skill folder name should match, or closely match, the `name` in the frontformatter.

## Project Structure

Add each skill in its own folder under `skills/`.

Example:

```text
skills/
└── example-skill/
    ├── README.md
    ├── skill.md
    ├── references/
    └── scripts/
```

### References

Use `references/` for supporting material related to the skill, such as:

- API notes
- Background documentation
- Examples
- Sample payloads

Keep references relevant, lightweight, and clearly named.

### Scripts

Use `scripts/` for helper scripts only when needed.

Scripts should be:

- Minimal
- Readable
- Documented
- Non-privileged

If a script is required to use or validate the skill, explain it in the skill `README.md`, including what it does, how to run it, and any dependencies.

Thanks for helping improve Binance Skills Hub.