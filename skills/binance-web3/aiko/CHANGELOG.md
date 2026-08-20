# Changelog

## 0.1.0 - 2026-08-20

- Initial release: `decide` command fusing `trading-signal` momentum, `crypto-market-rank` flow,
  and `query-token-audit` risk into one composite decision, confidence score, and rationale.
- Risk veto: `riskLevel >= 4` or tax > 10% forces `AVOID` regardless of other inputs.
- No network calls, no credentials — pure scoring over caller-supplied data.
