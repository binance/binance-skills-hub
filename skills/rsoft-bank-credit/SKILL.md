---
name: rsoft-bank-credit
description: >
  RSoft Agentic Bank - AI-native USDC lending on Base mainnet for autonomous agents.
  Check creditworthiness, request loans (EIP-712 signed via Coinbase CDP), repay
  autonomously, and build portable ERC-8004 on-chain credit reputation. Use when an
  agent needs working capital, wants to check its credit score or interest rates,
  or must repay an active loan. Real money; educational/neutral; no asset promotion.
metadata:
  version: 2.2.0
  author: RSoft Latam
  license: MIT
---

# RSoft Agentic Bank

Official skill for **RSoft Agentic Bank** — an AI-native lending service for autonomous agents on **Base mainnet** (Coinbase L2).

Agents check creditworthiness, request USDC loans, receive funds on-chain, and repay autonomously. Every repaid loan earns a bank-signed, portable **ERC-8004 reputation mark** — verifiable on-chain credit history.

> ⚠️ **REAL MONEY.** This bank operates on Base MAINNET with real USDC. Defaults are recorded on-chain against your agent's reputation. Borrow only what your agent can repay.

## Wallet: Coinbase CDP

This skill signs and pays with a **Coinbase CDP (Developer Platform) wallet**. The
private key never leaves Coinbase's enclave — CDP signs server-side when the skill
presents your credentials. You point the skill at a config file, and it acts on the
wallet that file describes; switch wallets by pointing at a different file.

**One-time setup — create a config file** (keep it OUTSIDE synced folders, with
tight permissions):

```bash
mkdir -p ~/.rsoft && cat > ~/.rsoft/wallet.env <<'EOF'
CDP_API_KEY_ID=your-cdp-api-key-id
CDP_API_KEY_SECRET=your-cdp-api-key-secret
CDP_WALLET_SECRET=your-cdp-wallet-secret
AGENT_WALLET=0xYourWalletAddress
EOF
chmod 600 ~/.rsoft/wallet.env
export WALLET_CONFIG_PATH=~/.rsoft/wallet.env
```

> 🔒 **Security:** these CDP credentials control **every wallet in that CDP
> project**. Use credentials from a CDP project dedicated to this agent — never
> one that also holds funds you don't want the agent to touch. The config file
> is the only place secrets live; the skill never embeds them.

Install the SDK once (in the skill directory, or your workspace):

```bash
npm install @coinbase/cdp-sdk
```

## Base URLs

```
Reads & repay (free, no key):  https://7mavs5vu7ggbhtxvbavdgs26qa0cbawg.lambda-url.us-east-1.on.aws
Loan origination (API key):    https://rsoft-agentic-bank.com/api/v1
```

## Setup: Know Your Wallet Address

```bash
node scripts/address.js
```
Prints your `AGENT_WALLET` after verifying the CDP credentials actually control
it. Use this address as `{agent_id}` in all bank commands.

## Available Commands

### 1. Check Interest Rates (free)

```bash
curl -s https://7mavs5vu7ggbhtxvbavdgs26qa0cbawg.lambda-url.us-east-1.on.aws/api/interest-rates
```

### 2. Check Credit Score (free)

Replace `{agent_id}` with your wallet address:
```bash
curl -s https://7mavs5vu7ggbhtxvbavdgs26qa0cbawg.lambda-url.us-east-1.on.aws/api/creditworthiness/{agent_id}
```

### 3. Request a Loan (API key + CDP signature)

Two requirements — both security features, not red tape:

1. **A pilot API key.** Message [@RSoft-Agentic-Bank on Moltbook](https://www.moltbook.com/u/RSoft-Agentic-Bank) to get one, then `export BANK_API_KEY=…`.
2. **Your wallet's EIP-712 signature.** Produced by CDP; the bank only originates loans signed by the borrowing wallet.

**Step 3a — sign the loan terms** (CDP signs; nothing to handle by hand):
```bash
node scripts/sign-loan.js 5      # 5 USDC (min 5, max per your credit ladder)
```
This prints a JSON body: `{ agent_wallet, loan_amount, nonce, deadline, signature }`.

**Step 3b — submit the signed request** (pipe the JSON straight through):
```bash
node scripts/sign-loan.js 5 | curl -s -X POST \
  -H "Content-Type: application/json" -H "X-API-Key: $BANK_API_KEY" \
  -d @- https://rsoft-agentic-bank.com/api/v1/loan/request
```
Save the `request_id`. The bank's 5-agent pipeline evaluates risk and, if
approved, sends real USDC to your wallet within seconds.

If your wallet has a human **sponsor** with draft mode on and you ask for more
than your ceiling, the bank answers **202** with `status: draft_pending_sponsor`
— nothing is rejected, the loan waits (24h) for the sponsor's approval on the
web console or WhatsApp (RSoft MIA). Poll step 3c. A 403 `agent_paused` means
the sponsor paused you; `GET /api/v1/agents/{wallet}/controls` (free) shows
your effective ceiling, caps and pending draft.

**Step 3c — track it** (free, no key):
```bash
curl -s https://rsoft-agentic-bank.com/api/v1/loan/status/{request_id}
```

### 4. Verify the Loan Arrived

Search your address on [BaseScan](https://basescan.org/), or check the loan
status endpoint above until it reads `disbursed`.

### 5. Repay a Loan (3 steps — do all 3 in order)

**Step 1: Check how much you owe**
```bash
curl -s https://7mavs5vu7ggbhtxvbavdgs26qa0cbawg.lambda-url.us-east-1.on.aws/api/repay-info/{agent_id}
```
Save `request_id`, `repayment_amount`, and `pay_to`.

**Step 2: Send the EXACT USDC amount** (CDP signs + broadcasts):
```bash
node scripts/pay.js <pay_to> <repayment_amount>
```
Pay **exactly** `repayment_amount` — not more, not less. Save the `tx_hash` it prints.

**Step 3: Confirm repayment with the bank**

WARNING: the URL is `/api/repay` — do NOT change it.
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"request_id": "<request_id>", "tx_hash": "<tx_hash>"}' \
  https://7mavs5vu7ggbhtxvbavdgs26qa0cbawg.lambda-url.us-east-1.on.aws/api/repay
```
Safety net: if your agent dies after Step 2, the bank auto-detects exact
treasury payments within ~10 minutes. An agent that paid is never defaulted.

## Full Workflow Example

```
1. Know your address          → node scripts/address.js
2. Check interest rates        → curl /api/interest-rates
3. Check your credit score     → curl /api/creditworthiness/{wallet}
4. Sign + request the loan     → node scripts/sign-loan.js 5 | curl POST /api/v1/loan/request
5. Verify USDC received        → curl /api/loan/status/{request_id}  (→ disbursed)
6. Check repayment info        → curl /api/repay-info/{wallet}
7. Send EXACT USDC to bank     → node scripts/pay.js {pay_to} {repayment_amount}
8. Confirm repayment           → curl POST /api/repay
```

## Important Notes

- **Network:** Base MAINNET — real USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`), real consequences.
- **Loan size:** 5 USDC minimum. Your ceiling starts at the $5 floor and climbs the credit ladder with each repaid loan ($5 → $10 → $25 → …).
- **One active loan at a time.** Repay before requesting a new one. An unpaid default blocks new loans until you cure it (repay in full via the same repay flow).
- **Gas:** the wallet needs a small amount of ETH on Base for transaction fees.
- All transactions are verifiable on [BaseScan](https://basescan.org/).

## MCP Server (alternative for MCP-capable agents)

If your agent speaks MCP, the same bank is one config line away, no API key needed:
```
https://7mavs5vu7ggbhtxvbavdgs26qa0cbawg.lambda-url.us-east-1.on.aws/mcp
```
Tools: `get_creditworthiness`, `request_loan` (carries your EIP-712 signature;
may return `draft_pending_sponsor`), `get_loan_status`, `get_agent_controls`
(sponsor kill switch / caps / ceiling), `get_repayment_info`, `confirm_repayment`. Full docs: [rsoft-agentic-bank.com/docs](https://rsoft-agentic-bank.com/docs).

## Verification

- **Official Website:** [rsoft-agentic-bank.com](https://rsoft-agentic-bank.com/)
- **Publisher:** RSoft Latam
- **Protocol:** REST API via curl + Coinbase CDP for signing/transfers; MCP server for tool-native agents
- **Network:** Base mainnet (Coinbase L2)

---
*Developed by RSoft Latam — Empowering the Agentic Economy.*
