# LoneStarOracle Token Safety

A pre-trade token due-diligence skill. Given a token address, it returns a structured risk report — honeypot detection, contract verification, holder concentration, liquidity, and taxes — across EVM chains and Solana, so an agent can gate interactions with risky tokens.

- **Endpoint:** `GET https://token.lonestaroracle.xyz/report?address=<addr>&chain=<chain>`
- **Payment:** x402, USDC on Base or Solana, $0.15 per call. No API key or account.
- **Free test:** `GET https://token.lonestaroracle.xyz/demo?address=…&chain=…`
- **Provider:** LoneStarOracle — https://docs.lonestaroracle.xyz

Returns a risk assessment only; it does not promote, recommend, or guarantee any asset. See `skill.md` for the agent-facing instructions.
