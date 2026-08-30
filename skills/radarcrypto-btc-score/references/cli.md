# cli.mjs

Helper script for the `radarcrypto-btc-score` skill.

## What it does

Fetches `https://radarcrypto.com.br/api/indicators.json` and prints the composite BTC
score, its five sub-scores and the underlying indicators in a readable form.

## Requirements

Node >= 18. No dependencies, no install step, no privileged access.

## Commands

| Command | Output |
|---------|--------|
| `node scripts/cli.mjs score` | Composite score, zone, signal label, price |
| `node scripts/cli.mjs subscores` | Score plus the five weighted dimensions |
| `node scripts/cli.mjs indicators` | Score plus every raw indicator field |
| `node scripts/cli.mjs full` | All of the above |
| `node scripts/cli.mjs json` | Raw JSON, unformatted, for piping |

Defaults to `score` when no command is given.

## Configuration

`RADARCRYPTO_API` overrides the endpoint URL.

```bash
RADARCRYPTO_API=https://example.com/indicators.json node scripts/cli.mjs full
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Network or API error (message on stderr) |
| 2 | Unknown command |

## Sample output

```
BTC Score: 61/100  .  NEUTRO (40-69)
Sinal: AGUARDAR
Preco: $78,686  +1.33%
Atualizado: 2026-08-30T13:32:06Z  (engine 4.0)

Sub-scores:
  tendencia                70
  derivativos              53
  momentum                 68
  fluxo                    57
  risco                    41
```
