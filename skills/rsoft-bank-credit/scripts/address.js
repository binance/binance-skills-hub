"use strict";
// Print the agent wallet address from the config. Verifies the CDP credentials
// actually control it (fails loudly if not) so a misconfigured file is caught
// before any money moves.
const { loadConfig, cdpClient } = require("./wallet-config");

(async () => {
  const cfg = loadConfig();
  const cdp = await cdpClient(cfg);
  const account = await cdp.evm.getAccount({ address: cfg.AGENT_WALLET });
  if (account.address.toLowerCase() !== cfg.AGENT_WALLET.toLowerCase()) {
    throw new Error(
      `Credentials do not control ${cfg.AGENT_WALLET} (resolved ${account.address})`
    );
  }
  console.log(account.address);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
