# BNB Agent Safety

An installable Binance Skills Hub / MCP companion skill for combining Insight
decision-input checks with PriorSeal bounded authorization and execution
evidence on BNB Smart Chain.

Connect the two remote MCP servers in [`mcp.json`](mcp.json), then invoke the
skill before a BNB agent proposes or executes a high-value action. Keep wallet
signing and transaction submission in the host wallet skill, such as Binance
Agentic Wallet.

Discovery is free. Insight checks and PriorSeal stateful operations may require
the deployment's API key, agent credits, or x402 payment. Never put those
credentials in the skill or an agent prompt.

The live service capability responses are authoritative for supported chains,
protocols, proof modes, payment rails, and exact tool names. This skill does
not expand either product's reviewed protocol coverage.
