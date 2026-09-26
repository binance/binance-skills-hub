# TRDEFI Yield — API References

All endpoints are `GET https://yield.trdefi.com/.netlify/functions/strategies`. No authentication. All quotes are `eth_call` simulations, verifiable on-chain. Protocol fee 0.02% all-in to 0x4C96dA02d7120BFb81594d0e924B237e0c74660d (protocol contract, not user wallet), same on Ethereum/Base/Arbitrum/Optimism/Polygon, x402-compatible.

## List active strategies

```bash
curl "https://yield.trdefi.com/.netlify/functions/strategies?resource=list&chain=all&filter=active&pair=all&limit=50"
```

Response: `strategies[]` with `strategy_hash`, `chain`, `pair`, `pair_verified`, `status`, `maker`, `app`.

## Get quote (verifiable)

```bash
curl "https://yield.trdefi.com/.netlify/functions/strategies?resource=quote&hash=0x0000000000000000000000000000000000000000000000000000000000000000&chain=base&amount=500000000000&direction=aToB"
# Use hash from list call. Amount in base units (e.g. 500000000000 = 500K USDC 6 decimals). Replace 0x000... with real hash.
```

Returns: `amountIn`, `amountOut`, `orderHash`, `feeReceiver: 0x4C96...`, `protocolFee: 0.02%`, `x402: true`.

## Propose yield activation (agent wallet)

Reuse quote, then propose permit. Agent wallet signs locally (ERC-2612 exact amount+deadline). Fee split on-chain in same tx to feeReceiver. Revocable via `approve(0)` + `dock()` in 1 tx. No TRDEFI custody.

```bash
# 1. Get quote as above, 2. Sign permit in wallet, 3. Call SwapVM Router 0x111111338c5091e8440b67B168bae16a668AC0De
```

Demo (testnet validated): https://yield.trdefi.com/demo — Base Sepolia virtual X0/Y0, no custody, no real funds.

