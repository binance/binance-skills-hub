# Agent ID Claim Status (`wallet agent-id`)

Check whether the connected account has successfully claimed an Agent ID — a `.ai` space id domain (e.g. `alice.ai`) — and show the claimed domain when it exists.

## When to use

- The user asks "did I claim my .ai name / Agent ID?", "what's my Agent ID domain?", or wants the `.ai` domain bound to this wallet.
- Some tokens can only be bought by Agent ID holders. When the user wants to buy one, check with this command first. This is the only supported pre-check. Do not infer eligibility from balances or addresses.

## Command

```bash
baw wallet agent-id [--json]
```

No parameters. Requires `auth signin` — the userId comes from the wallet session, never from the client.

## Output

Text mode (claimed):

```
Claimed: Yes
Agent ID: alice.ai
```

Text mode (not claimed):

```
Claimed: No
This wallet has not claimed an .ai space id yet.
Claim one in the Binance App (Web3 wallet -> Agent ID)
to get your own .ai domain.
```

JSON mode:

```json
{
  "success": true,
  "data": {
    "claimed": true,
    "handle": "alice",
    "agentId": "alice.ai"
  }
}
```

| Field | Meaning |
|-------|---------|
| `claimed` | `true` when the account has a successfully claimed Agent ID |
| `handle` | The claimed handle (only when `claimed=true`), e.g. `alice` |
| `agentId` | The full `.ai` domain (only when `claimed=true`), e.g. `alice.ai` |

## Reading the result

- **`claimed=false` covers**: never claimed, claim in flight (submitted but not yet confirmed on-chain), failed/expired claims, and accounts with no agent wallet yet. If the user says they just completed a claim, don't loop on this command — on-chain confirmation itself takes tens of seconds and the result may additionally lag up to 60s by cache. Suggest re-checking in a minute.
- **Service error (CLI code `20003008`)**: the Agent ID backend is temporarily unavailable. This is an error, NOT "not claimed" — retry later; do not tell the user they lack an Agent ID based on this code.
- Do not use this command in a polling loop to track an in-flight claim; call it once to answer "claimed or not".

## Notes for the agent

- If `claimed=false` and the user wants an Agent ID: claiming happens in the Binance App (Web3 wallet → Agent ID), not via the CLI. For the step-by-step claim flow and rules (name format, one per user, free apart from the BNB network fee), read the [Agent ID claim FAQ](https://web3.binance.com/en/dev-docs/products/agentic-wallet/ai-pro#came-from-the-agent-id-campaign).
- If `claimed=true` and the user asks what the domain resolves to: the `.ai` domain resolves to this wallet's address (see [domain-resolve.md](domain-resolve.md) for the resolve command and supported suffixes).
