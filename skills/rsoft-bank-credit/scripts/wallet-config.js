"use strict";
// Shared config loader for the RSoft Agentic Bank skill (CDP mode).
//
// Reads the CDP credentials + agent wallet from a config file whose path is
// given by WALLET_CONFIG_PATH (or the first CLI arg). The file is plain
// KEY=VALUE lines (a dotenv-style file). Keeping creds in a file the operator
// controls — instead of baking them into the skill — lets an agent switch the
// wallet it borrows from by pointing at a different config, and keeps secrets
// out of the skill and out of shell history.
//
// Required keys in the config file:
//   CDP_API_KEY_ID
//   CDP_API_KEY_SECRET
//   CDP_WALLET_SECRET
//   AGENT_WALLET          (0x… address the CDP credentials control)
const fs = require("fs");

function loadConfig() {
  const path = process.env.WALLET_CONFIG_PATH || process.argv[2];
  if (!path) {
    throw new Error(
      "No wallet config. Set WALLET_CONFIG_PATH to a file with CDP_API_KEY_ID, " +
        "CDP_API_KEY_SECRET, CDP_WALLET_SECRET and AGENT_WALLET."
    );
  }
  if (!fs.existsSync(path)) throw new Error(`Wallet config not found at: ${path}`);

  const cfg = {};
  for (const raw of fs.readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    cfg[key] = val;
  }

  const required = ["CDP_API_KEY_ID", "CDP_API_KEY_SECRET", "CDP_WALLET_SECRET", "AGENT_WALLET"];
  const missing = required.filter((k) => !cfg[k]);
  if (missing.length) throw new Error(`Config file missing: ${missing.join(", ")}`);
  return cfg;
}

// cdp-sdk pulls in `jose`, which is ESM-only. A plain require() of the SDK can
// fail ("require() of ES Module ... not supported") depending on how Node
// resolves it in the caller's context. A dynamic import() loads the ESM graph
// correctly everywhere, so this is async.
async function cdpClient(cfg) {
  const { CdpClient } = await import("@coinbase/cdp-sdk");
  return new CdpClient({
    apiKeyId: cfg.CDP_API_KEY_ID,
    apiKeySecret: cfg.CDP_API_KEY_SECRET,
    walletSecret: cfg.CDP_WALLET_SECRET,
  });
}

module.exports = { loadConfig, cdpClient };
