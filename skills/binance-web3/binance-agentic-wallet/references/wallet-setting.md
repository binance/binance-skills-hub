# Wallet Settings

View the wallet's current security configuration. Settings can only be changed in the Binance App — this command is read-only.

## `wallet settings`

### Syntax

```bash
baw wallet settings --json
```

### Parameters

No command-specific parameters.

### Example

```bash
baw wallet settings --json
```

### Response

```json
{
  "success": true,
  "data": {
    "maxSigninDuration": "48h",
    "inactiveSignoutDuration": "24h",
    "dailyLimit": 50000,
    "abnormalTxnHandling": "AutoReject",
    "tradeAllTokens": false,
    "quotaUsed": 0,
    "quotaLeft": 50000,
    "quotaDate": "2026-04-03",
    "inactiveSignOutTime": "2026-04-04T06:32:05+08:00",
    "sessionExpireTime": "2026-04-04T06:32:05+08:00"
  }
}
```

Returns the current security settings:
- **maxSigninDuration** — The maximum time the Agentic Wallet can stay signed in before the Agent is automatically signed out.
- **inactiveSignoutDuration** — The Agent will be signed out after this period of inactivity, regardless of the Max Sign-In Duration. Currently fixed at 24 hours and not user-configurable.
- **dailyLimit** — maximum total transaction value allowed in a 24-hour period.
- **abnormalTxnHandling** — How the wallet handles transactions flagged as high-risk or with abnormal price impact. Only two values are possible:
    - `AutoReject` — automatically block abnormal transactions without prompting the user.
    - `NeedConfirmation` — send a double-confirm request to the Binance App and wait for the user to approve or reject.
- **tradeAllTokens** — whether the wallet can trade any token or only those on the allowed list.

The response also includes current status information:
- **quotaUsed** — how much of the daily limit (in USD) has been consumed so far today.
- **quotaLeft** — remaining daily limit (in USD) available for transactions today.
- **quotaDate** — the date these quota figures apply to.
- **inactiveSignOutTime** - when the agent will sign out due to the inactive signout duration settings.
- **sessionExpireTime** — when the current session will expire and the wallet will automatically sign out.

### Changing Settings

Settings cannot be changed via the CLI. To update them, follow these steps in the Binance App:

1. Open the **Binance Wallet App**.
2. Navigate to the **Agentic Wallet** management page.
3. Tap the **settings icon** in the top-right corner to enter wallet Settings.
4. Adjust the desired security settings.

When a transaction is rejected because of a security policy (e.g., token not on the allowed list, daily limit exceeded), use `wallet settings` to explain the restriction and guide the user to the App to make adjustments.
