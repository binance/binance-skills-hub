# Preflight Checks

At the start of each conversation, run the following checks in order.

---

## 1. Skill Version Check

Check whether a newer version of this skill is available. `currentSkillVersion` is the value of `metadata.version` in this skill's SKILL.md frontmatter.

### Syntax

```bash
baw skill-check --skill-name binance-agentic-wallet --current-version ${currentSkillVersion} --json
```

### Response

```json
{
  "success": true,
  "data": {
    "needUpdateSkill": true,
    "latestSkillVersion": "x.y.z"
  }
}
```

- **`needUpdateSkill` = true** → prompt the user: "A new version of the Binance Agentic Wallet skill is available (current: {currentSkillVersion}, latest: {latestSkillVersion}). Would you like to update now?" If the user confirms, install the latest version from https://github.com/binance/binance-skills-hub, then **re-read this file** before continuing to step 2 (the updated skill may require a different CLI version).
- **`needUpdateSkill` = false**, or the request fails → proceed silently.

---

## 2. CLI Version Check

Verify that the `baw` CLI meets the required version. The `requiredCliVersion` is the value of `metadata.requiredCliVersion` in this skill's SKILL.md frontmatter.

### Syntax

```bash
baw cli-check --required-version ${requiredCliVersion} --json
```

### Response

```json
{
  "success": true,
  "data": {
    "currentCliVersion": "x.y.z",
    "needUpdateCli": false
  }
}
```

- **`baw` not found** → install the required version.
- **`needUpdateCli` = true** → upgrade to the required version.
- **`needUpdateCli` = false** → no action needed.

### Install / Upgrade the CLI

The `baw` CLI is distributed as the npm package `@binance/agentic-wallet`. Use the following command to install or upgrade the required CLI version:

```bash
npm install -g @binance/agentic-wallet@${requiredCliVersion}
```

---

## 3. Wallet Connection Check

Before starting any wallet operation (or loading task-specific guidance), verify the wallet is connected.

### Syntax

```bash
baw wallet status --json
```

### Response

```json
{ "success": true, "data": { "status": "CONNECTED" } }
```

- **`status` = `CONNECTED`** → proceed normally.
  - **Then check remaining session validity.** Run `baw wallet settings --json` and read `sessionExpireTime`. If it is within a few hours, tell the user up front — e.g. "Your wallet login expires around {time} (about {N}h from now); sessions last up to `maxSigninDuration` and also sign out after inactivity. If you'll be working past then, expect to re-sign-in." Sign-out is **silent** — the user otherwise only finds out when a later command fails. This is a general wallet courtesy, not campaign-specific; surface it once at the start, don't nag.
  - **Then check Developer Mode up front when the request will need it.** From the same `wallet settings` output, read `devMode.enabled` and `devMode.expiresAt`. If the user's request involves `contract-call` or `sign-message`, and Developer Mode is off or `expiresAt` is in the past, tell the user **now** to enable it in the Binance App (Agentic Wallet management page → Settings; see [wallet-setting.md](wallet-setting.md)) — before quoting, building, or previewing anything, so they don't discover it only at the last step. Tell them how: in the Binance App open the Agentic Wallet management page → Settings (top-right icon) → turn on **Developer Mode**, read and confirm the Risk Warning, then approve the signature request the App shows. The wallet's total balance must be under the Developer Mode balance cap, or enabling is refused (`351804`). Once on, it stays active for 7 days and each successful use extends it; after it expires the user enables it again the same way. For requests that don't need Developer Mode, say nothing about it. This early check does not replace the check right before `preview`: Developer Mode can expire or be switched off automatically (`351804`) mid-session, so re-check there as usual.
- **`status` = `UNCONNECTED`** (or not connected) → **stop here and get the user signed in first.** Do not keep reading large rule files, do not start explaining flows or strategy, and do not attempt any command that needs a wallet — the user will otherwise only discover the failure later when a call errors out, and assume the feature is broken.
  - If the user has **never created an Agentic Wallet** → direct them to create one in the Binance App / the relevant product page.
  - If they **have an AW but are not signed in on this device** → guide them through `baw auth signin` → `auth verify` (scan the QR in the Binance App).
