# Siebly Binance SDK skill

Instruction skill for AI coding agents that need to build or review Node.js and TypeScript integrations with the Binance REST and WebSocket APIs.

It uses the open-source, MIT-licensed [`binance`](https://www.npmjs.com/package/binance) npm package maintained by the Siebly team. The package is free to install from npm. This skill is documentation only. It does not bundle scripts, binaries, or API credentials.

This is a community skill. It is not an official Binance product, and it is not a replacement for the official `binance` CLI skill in this hub.

## Placement

```text
skills/
└── siebly-binance-sdk/
    ├── README.md
    ├── SKILL.md
    ├── LICENSE
    └── references/
        └── clients-and-docs.md
```

The folder belongs directly under `skills/`, not under `skills/binance/` or `skills/binance-web3/`, which are reserved for Binance-maintained skills.

## Files

| File | Purpose |
| --- | --- |
| `SKILL.md` | Agent instructions, frontmatter, workflow, and safety rules |
| `references/clients-and-docs.md` | REST and WebSocket client map, authentication notes, and documentation links |
| `LICENSE` | MIT licence for this skill folder |
| `README.md` | This file |

There is no `scripts/` directory. Generated application code should depend only on the published `binance` package and the project's existing runtime.

## How it works

1. An agent loads `SKILL.md` when the user asks for Binance application-code integration help in Node.js or TypeScript.
2. The agent reads `references/clients-and-docs.md` for constructor and documentation detail.
3. The agent installs `binance` from npm in the user's project, if it is not already present, and uses the matching client for the product group in scope.
4. Public market-data work stays unauthenticated. Private work reads keys from the environment. Order submission stays disabled until the user explicitly asks for a write-capable environment.

## Dependencies

The skill itself has no runtime dependencies.

Projects that follow the skill install:

```bash
npm install binance
```

Use the current version published on npm. As of 13 November 2026 (UTC), that version was `3.6.12`. Check npm at install time rather than hard-coding a stale pin.

The `binance` package's own runtime dependencies are listed on npm. This skill does not add further packages unless the host project already needs them (for example a local test runner).

## Use cases

- Teaching an agent how to call Binance public REST market-data endpoints from TypeScript.
- Adding a reconnecting public or user-data WebSocket consumer.
- Reviewing an existing Node.js Binance integration and pointing it at the correct SDK client.
- Scaffolding a read-only account check that loads keys from the environment.

## Licence

MIT. See [LICENSE](./LICENSE).
