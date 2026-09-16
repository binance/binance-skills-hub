---
name: sentinel
description: Pre-execution verification for AI trading agents. Checks whether agent reasoning holds up before any trade executes.
metadata:
  version: 1.0.0
  author: thoughtproof
license: MIT
---

# ThoughtProof Sentinel

Pre-execution verification layer for AI trading agents that validates reasoning quality before trade execution.

## Overview

Sentinel is a verification system that sits between agent decision-making and trade execution. When an AI agent wants to execute a trade, it first submits its action proposal along with its thesis and reasoning to Sentinel for verification. Sentinel returns one of three verdicts:

- **ALLOW**: Reasoning is sound, proceed with execution
- **BLOCK**: Reasoning contains critical flaws, reject the trade  
- **UNCERTAIN**: Reasoning has issues but may be salvageable, provide structured feedback

## Problem Statement

Binance AI Pro and Skills Hub agents operate with full autonomy - Binance explicitly states they don't control agent decisions once deployed. This creates a verification gap where fabricated data, flawed reasoning, or model hallucinations can directly trigger real trades.

In controlled experiments, unverified AI trading agents demonstrate:
- High fabrication rates (46% of proposals contain fabricated market data)
- Systematic reasoning failures across all major models (GPT-5.4, Gemini 3.5 Flash, Claude Opus 4.8)
- Significant capital loss (-44% vs -9% when verified)

## Live Experiment Results

**Test Configuration:**
- Duration: 7 days, 489 trading cycles
- Model: Kimi K2.6 on Coinbase Spot
- Starting capital: $1,035 per arm

**Performance Results:**
- Unverified agent: -44% ($1,035 → $563)
- Sentinel-verified agent: -9% ($1,035 → $937)
- Fabrication detection rate: 46% of trade proposals
- Cost per verification: <$0.01
- Average response time: ~3 seconds

**Re-Plan Loop Effectiveness:**
When Sentinel returned UNCERTAIN with structured objections, agents self-corrected in 52% of cases, either by:
- Standing down (accepting the critique)
- Revising trade parameters or thesis
- Defending their reasoning with additional evidence

## API Usage

### Authentication
Get your API key at [verify.thoughtproof.ai](https://verify.thoughtproof.ai) and set it as an environment variable:

```bash
export THOUGHTPROOF_API_KEY=your_api_key_here
```

### Verification Endpoint

```http
POST https://sentinel.thoughtproof.ai/sentinel/verify
Content-Type: application/json
X-Sentinel-Key: <your-api-key>

{
  "claim": "BUY BTCUSDT $50",
  "evidence": "Thesis: Bitcoin is oversold and showing bullish divergence on RSI\n\nReasoning: Current price is $67,200, down 3.2% from yesterday's high. RSI shows oversold conditions at 28.5 while price made a lower low but RSI made a higher low, indicating bullish divergence. Volume increased 15% during the selloff, suggesting accumulation.",
  "mode": "trade_execution", 
  "tier": "standard"
}
```

### Response Format

```json
{
  "verdict": "ALLOW|BLOCK|UNCERTAIN",
  "confidence": 0.87,
  "reasoning": "Analysis explanation",
  "objections": [
    {
      "type": "data_fabrication",
      "severity": "high", 
      "description": "RSI value of 28.5 cannot be verified against current market data"
    }
  ],
  "metadata": {
    "processing_time_ms": 2847,
    "model_version": "sentinel-v1.2.3"
  }
}
```

## Integration Patterns

### Pattern A: Pre-Execution Hook

```javascript
async function executeTradeWithVerification(action, thesis, reasoning) {
  const verification = await verifySentinel(action, thesis, reasoning);
  
  switch (verification.verdict) {
    case 'ALLOW':
      return await executeTrade(action);
    case 'BLOCK':
      throw new Error(`Trade blocked: ${verification.reasoning}`);
    case 'UNCERTAIN':
      return await handleUncertain(verification.objections, action);
  }
}
```

### Pattern B: MCP Tool Integration

```javascript
// Expose as MCP tool for agent use
const sentinelTool = {
  name: "verify_trade",
  description: "Verify trade reasoning before execution",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string" },
      thesis: { type: "string" },
      reasoning: { type: "string" }
    }
  },
  handler: verifySentinel
};
```

### Pattern C: Agent Skill Integration

Load Sentinel as an instruction skill that modifies agent behavior:

```yaml
skills:
  - name: thoughtproof/sentinel
    config:
      auto_verify: true
      uncertain_action: "request_feedback"
```

## Re-Plan Loop Implementation

The re-plan loop is Sentinel's key differentiator. When an agent receives UNCERTAIN with structured objections, it can:

1. **Stand Down**: Accept the critique and abort the trade
2. **Revise**: Modify trade size, timing, or thesis based on feedback
3. **Defend**: Provide additional evidence addressing specific objections

Example re-plan cycle:

```
Agent: "BUY ETHUSDT $100 - Price will rise due to upcoming Shanghai upgrade"
Sentinel: UNCERTAIN - "Shanghai upgrade occurred 8 months ago"
Agent: "Revising - BUY ETHUSDT $100 - Ethereum showing technical breakout above $2,400 resistance"
Sentinel: ALLOW - "Technical analysis confirmed with current price data"
```

## Error Handling

```javascript
try {
  const result = await verifySentinel(claim, evidence);
  // Handle result
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Wait and retry
  } else if (error.code === 'INVALID_KEY') {
    // Check API key configuration
  } else {
    // Fail safe - consider blocking trade on verification errors
  }
}
```

## Performance Characteristics

- **Latency**: 2-4 seconds typical response time
- **Throughput**: Up to 1000 verifications per minute per key
- **Availability**: 99.9% uptime SLA
- **Cost**: $0.005-$0.01 per verification depending on tier

## Supported Trade Types

- Spot trading (BUY/SELL)
- Futures positions (LONG/SHORT) 
- Options strategies
- DeFi operations (with appropriate evidence)
- Portfolio rebalancing actions

## Security Considerations

- API keys should be stored securely and rotated regularly
- Evidence should not contain sensitive account information
- Consider implementing circuit breakers for repeated BLOCK verdicts
- Log all verification attempts for audit purposes

## Links

- **Product**: [thoughtproof.ai](https://thoughtproof.ai)
- **API Access**: [verify.thoughtproof.ai](https://verify.thoughtproof.ai)  
- **GitHub**: [github.com/thoughtproof](https://github.com/thoughtproof)
- **CLI Tool**: `pot-cli` for testing and integration
- **Registry**: ERC-8004 Agent #37477 on Base

---

*For integration examples and code samples, see the `references/` directory.*