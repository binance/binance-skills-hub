# Integration Example: Node.js Trading Agent

This example shows how to integrate ThoughtProof Sentinel into a Node.js/TypeScript trading agent for Binance.

## Setup

```bash
npm install axios dotenv
```

## Environment Configuration

```bash
# .env
THOUGHTPROOF_API_KEY=sk_live_a1b2c3d4...
BINANCE_API_KEY=your_binance_key
BINANCE_SECRET=your_binance_secret
```

## Complete Implementation

```typescript
import axios from 'axios';
import { Spot } from '@binance/connector';

interface SentinelVerification {
  verdict: 'ALLOW' | 'BLOCK' | 'UNCERTAIN';
  confidence: number;
  reasoning: string;
  objections?: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  metadata?: {
    processing_time_ms: number;
    model_version: string;
  };
}

interface TradeProposal {
  action: string;  // e.g., "BUY BTCUSDT 0.001"
  thesis: string;  // Market analysis
  reasoning: string; // Supporting evidence
}

class SentinelTradingAgent {
  private binance: Spot;
  private sentinelApiKey: string;
  private sentinelEndpoint = 'https://sentinel.thoughtproof.ai/sentinel/verify';

  constructor() {
    this.binance = new Spot(
      process.env.BINANCE_API_KEY!,
      process.env.BINANCE_SECRET!,
      { baseURL: 'https://api.binance.com' }
    );
    this.sentinelApiKey = process.env.THOUGHTPROOF_API_KEY!;
  }

  /**
   * Verify a trade proposal with ThoughtProof Sentinel
   */
  async verifySentinel(proposal: TradeProposal): Promise<SentinelVerification> {
    try {
      const response = await axios.post(
        this.sentinelEndpoint,
        {
          claim: proposal.action,
          evidence: `Thesis: ${proposal.thesis}\n\nReasoning: ${proposal.reasoning}`,
          mode: 'trade_execution',
          tier: 'standard'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Sentinel-Key': this.sentinelApiKey
          },
          timeout: 10000 // 10 second timeout
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Wait before retrying.');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Check THOUGHTPROOF_API_KEY.');
        }
      }
      throw new Error(`Sentinel verification failed: ${error.message}`);
    }
  }

  /**
   * Execute a verified trade on Binance
   */
  async executeVerifiedTrade(proposal: TradeProposal): Promise<any> {
    console.log(`🔍 Verifying trade proposal: ${proposal.action}`);
    
    // Step 1: Verify with Sentinel
    const verification = await this.verifySentinel(proposal);
    
    console.log(`✅ Sentinel verdict: ${verification.verdict} (confidence: ${verification.confidence})`);
    console.log(`📝 Reasoning: ${verification.reasoning}`);

    // Step 2: Handle verdict
    switch (verification.verdict) {
      case 'ALLOW':
        return await this.executeTrade(proposal.action);
        
      case 'BLOCK':
        console.log(`❌ Trade blocked by Sentinel`);
        throw new Error(`Trade blocked: ${verification.reasoning}`);
        
      case 'UNCERTAIN':
        console.log(`⚠️  Uncertain verdict with ${verification.objections?.length || 0} objections`);
        return await this.handleUncertain(verification, proposal);
    }
  }

  /**
   * Handle uncertain verdicts with re-plan loop
   */
  async handleUncertain(
    verification: SentinelVerification, 
    originalProposal: TradeProposal
  ): Promise<any> {
    console.log('🔄 Entering re-plan loop...');
    
    // Log specific objections
    verification.objections?.forEach((objection, i) => {
      console.log(`   ${i + 1}. [${objection.severity}] ${objection.type}: ${objection.description}`);
    });

    // In a real agent, you would:
    // 1. Send objections to the AI model for re-planning
    // 2. Generate a revised proposal addressing the objections
    // 3. Re-verify the revised proposal
    
    // For this example, we'll demonstrate standing down
    console.log('🛑 Standing down - accepting Sentinel critique');
    throw new Error('Trade aborted after uncertain verification');
  }

  /**
   * Parse and execute trade action on Binance
   */
  async executeTrade(action: string): Promise<any> {
    // Parse action string: "BUY BTCUSDT 0.001"
    const [side, symbol, quantity] = action.split(' ');
    
    console.log(`🚀 Executing ${side} ${quantity} ${symbol}`);
    
    try {
      if (side.toUpperCase() === 'BUY') {
        const result = await this.binance.newOrder(symbol, 'BUY', 'MARKET', {
          quantity: quantity
        });
        console.log('✅ Buy order executed:', result.data);
        return result.data;
      } else if (side.toUpperCase() === 'SELL') {
        const result = await this.binance.newOrder(symbol, 'SELL', 'MARKET', {
          quantity: quantity
        });
        console.log('✅ Sell order executed:', result.data);
        return result.data;
      }
    } catch (error) {
      console.error('❌ Trade execution failed:', error);
      throw error;
    }
  }

  /**
   * Example trading strategy with Sentinel verification
   */
  async runTradingStrategy(): Promise<void> {
    // Example: Simple mean reversion strategy
    try {
      // Get current price data
      const ticker = await this.binance.tickerPrice('BTCUSDT');
      const currentPrice = parseFloat(ticker.data.price);
      
      // Simple strategy logic (replace with your own)
      if (currentPrice < 65000) {
        const proposal: TradeProposal = {
          action: 'BUY BTCUSDT 0.001',
          thesis: 'Bitcoin is oversold and approaching key support level',
          reasoning: `Current BTC price is $${currentPrice}, which is below the $65,000 support level. Historical data shows this level has held 3 times in the past month. RSI indicators suggest oversold conditions.`
        };

        await this.executeVerifiedTrade(proposal);
      }
      
    } catch (error) {
      console.error('Strategy execution failed:', error.message);
    }
  }
}

// Usage example
async function main() {
  const agent = new SentinelTradingAgent();
  
  // Run strategy once
  await agent.runTradingStrategy();
  
  // Or set up periodic execution
  setInterval(async () => {
    try {
      await agent.runTradingStrategy();
    } catch (error) {
      console.error('Periodic strategy run failed:', error.message);
    }
  }, 60000); // Run every minute
}

// Error handling wrapper
main().catch(console.error);
```

## Advanced Re-Plan Loop Implementation

For a more sophisticated re-plan loop that actually uses AI to address objections:

```typescript
/**
 * Advanced uncertain handling with AI re-planning
 */
async handleUncertainWithAI(
  verification: SentinelVerification,
  originalProposal: TradeProposal
): Promise<any> {
  const objectionsSummary = verification.objections
    ?.map(obj => `${obj.type}: ${obj.description}`)
    .join('\n') || '';

  // Send to your AI model (OpenAI, Claude, etc.)
  const revisedProposal = await this.generateRevisedProposal(
    originalProposal,
    objectionsSummary
  );

  if (revisedProposal) {
    console.log('🔄 Retrying with revised proposal...');
    return await this.executeVerifiedTrade(revisedProposal);
  } else {
    console.log('🛑 Unable to address objections, standing down');
    throw new Error('Trade aborted after failed re-planning');
  }
}

async generateRevisedProposal(
  original: TradeProposal, 
  objections: string
): Promise<TradeProposal | null> {
  // Integrate with your AI model here
  // This would send the original proposal + objections to the model
  // and ask it to generate a revised version that addresses the issues
  
  // Placeholder implementation
  return null;
}
```

## Testing

```typescript
// Test with a known problematic proposal
const testProposal: TradeProposal = {
  action: 'BUY ETHUSDT 1.0',
  thesis: 'Ethereum will moon because of the Shanghai upgrade',
  reasoning: 'The Shanghai upgrade will happen next week and unlock staking withdrawals, causing massive demand.'
};

// This should return BLOCK or UNCERTAIN because Shanghai upgrade already happened
const agent = new SentinelTradingAgent();
agent.executeVerifiedTrade(testProposal).catch(console.error);
```

## Configuration Options

```typescript
// Configure Sentinel behavior
interface SentinelConfig {
  tier: 'standard' | 'premium';
  mode: 'trade_execution' | 'portfolio_analysis';
  timeout: number;
  retryAttempts: number;
  failSafe: 'block' | 'allow' | 'log_only';
}

const config: SentinelConfig = {
  tier: 'standard',
  mode: 'trade_execution', 
  timeout: 10000,
  retryAttempts: 3,
  failSafe: 'block' // Block trades if Sentinel is unavailable
};
```

This integration example demonstrates a production-ready implementation that includes proper error handling, the re-plan loop, and realistic trading logic suitable for Binance Skills Hub agents.