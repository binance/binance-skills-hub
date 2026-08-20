# CLI Reference

## `decide`

```bash
node scripts/cli.mjs decide '<json_input>'
```

### Input Schema

All top-level keys are optional. Omit a key entirely when that data isn't available — do not
pass `null` placeholders or invented values.

| Key | Shape | Source |
|-----|-------|--------|
| `signal` | `{ direction: "buy"\|"sell", status: "active"\|"timeout"\|"completed", exitRate: number, smartMoneyCount: number }` | `trading-signal` `smart-money` |
| `rank` | `{ position: number, totalRanked: number }` | `crypto-market-rank` `smart-money-inflow` / `token-rank` |
| `audit` | Raw `data` object from the audit response (`hasResult`, `isSupported`, `riskLevel`, `riskLevelEnum`, `extraInfo.buyTax`, `extraInfo.sellTax`, `extraInfo.isVerified`) | `query-token-audit` |
| `weights` | `{ momentum?: number, flow?: number, risk?: number }`, default `{0.35, 0.25, 0.40}` | caller override, must sum to ~1.0 |

### Output Schema

```json
{
  "decision": "LEAN_BUY | NEUTRAL | LEAN_SELL | AVOID",
  "compositeScore": 0,
  "confidence": 20,
  "subscores": { "momentum": 0, "flow": 0, "risk": 0 },
  "rationale": ["...", "...", "..."],
  "riskVeto": false,
  "generatedAt": "ISO-8601 timestamp",
  "disclaimer": "..."
}
```

- `confidence` (20–80) scales with how many of `signal` / `rank` / an *available* `audit` were
  supplied — 20 with zero, up to 80 with all three. It never reaches 100; Aiko's inputs are
  themselves point-in-time snapshots from upstream skills, and confidence reflects that.
- `riskVeto: true` means `decision` is forced to `AVOID` regardless of `compositeScore`.
- Always print `disclaimer` verbatim alongside the decision.

### Scoring Formula (informative — see `scripts/cli.mjs` for the source of truth)

- **Momentum** (0–100): starts at 50; `+20` for `direction: "buy"`, `-20` for `"sell"`; `+10` /
  `-10` / `-5` for `status` active/timeout/completed; subtracts up to 25 as `exitRate` rises
  (high exit rate ⇒ opportunity likely already matured); adds up to 20 for `smartMoneyCount`
  (more independent wallets ⇒ more reliable signal).
- **Flow** (0–100): percentile of `position` within `totalRanked` — higher percentile (closer to
  #1) scores higher.
- **Risk** (0–100, inverted): `riskLevel` 0–1 → 85–95, 2–3 → 50–65, 4 → 15, 5 → 0. Capped at 40
  if unverified, capped at 40 if tax 5–10%, capped at 10 if tax > 10%. Missing/unavailable audit
  scores 30 (elevated, not neutral).
- **Composite** = weighted sum of the three subscores using `weights` (default 35/25/40 —
  risk weighted highest by design).
- **Bucket**: `riskVeto` → `AVOID`; zero input sources supplied → `NEUTRAL` (a composite pulled
  only by the risk score's conservative "unavailable" default is a statement about missing data,
  not a bearish read); else composite ≥ 70 → `LEAN_BUY` (or `NEUTRAL` if momentum direction is
  `"sell"`); composite < 45 → `LEAN_SELL` (or `NEUTRAL` if momentum direction is `"buy"`);
  otherwise `NEUTRAL`.

### Example

```bash
node scripts/cli.mjs decide '{
  "signal": {"direction":"buy","status":"active","exitRate":12,"smartMoneyCount":6},
  "rank": {"position":8,"totalRanked":200},
  "audit": {"hasResult":true,"isSupported":true,"riskLevel":1,"riskLevelEnum":"LOW","extraInfo":{"buyTax":"0","sellTax":"0","isVerified":true}}
}'
```

```json
{
  "decision": "LEAN_BUY",
  "compositeScore": 73,
  "confidence": 80,
  "subscores": { "momentum": 78, "flow": 96, "risk": 61 },
  "rationale": [
    "direction=buy status=active exitRate=12% smartMoneyCount=6",
    "rank 8/200",
    "riskLevel=LOW buyTax=0% sellTax=0%"
  ],
  "riskVeto": false,
  "generatedAt": "2026-08-20T00:00:00.000Z",
  "disclaimer": "Informational only — not investment, financial, or trading advice. Aiko does not execute trades; any action requires a separate, explicitly confirmed step in the appropriate skill (e.g. binance-agentic-wallet). DYOR."
}
```
