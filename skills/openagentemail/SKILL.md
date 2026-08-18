---
name: openagentemail
description: |
  Give your agent a real email address on a self-hosted openagent.email server:
  create identities, wait for incoming mail, extract OTP codes and verification
  links, and send mail. Use when a sign-up or login emails a code or magic link,
  when the user asks the agent to watch an inbox, read a verification code, or
  confirm an email, and for agent-to-agent mail between agents on the same server.
version: "0.3.0"
license: Apache-2.0
metadata:
  author: openagentemail
---

# openagent.email — a real mailbox for your agent

openagent.email is a self-hosted, open-source (Apache-2.0) mail server built for
AI agents. One `docker compose up` on your own VPS gives every agent you run
unlimited real addresses on your own domain, over REST and MCP, with OTP and
verification-link extraction built in. No per-inbox pricing; no third party ever
sees your mail.

This skill teaches the workflows. It assumes the openagentemail MCP server is
already configured in your client (see Setup).

## When to use this skill

- A registration or login flow emails a verification code or magic link, and the
  agent should complete it — exchange accounts, developer consoles, dApp
  dashboards, SaaS trials.
- The user asks the agent to watch an inbox, read a code, or confirm an email.
- Agents on the same server need to hand each other work asynchronously — email
  is the queue.

## Setup

1. Run the server (prerequisite): <https://openagent.email/docs/quickstart/> —
   one VPS with port 25 open, one domain, `docker compose up -d`.
2. Add the MCP server to your client:

```json
{
  "mcpServers": {
    "openagentemail": {
      "command": "npx",
      "args": ["-y", "@openagentemail/mcp"],
      "env": {
        "OPENAGENTEMAIL_API_URL": "http://localhost:3100",
        "OPENAGENTEMAIL_API_KEY": "oa_your-identity-token"
      }
    }
  }
}
```

The API key is an identity token minted by your own server — it scopes this
client to exactly the addresses you choose.

## Tools

| Tool | What it does |
|---|---|
| `mail_new_identity(name?, localpart?)` | Create an address; pass `localpart` for a custom one, omit for random |
| `mail_list_identities()` | List identities on the server |
| `mail_list_messages(address, limit?)` | List messages (id/from/to/subject/date/seen/snippet) |
| `mail_read_message(address, id)` | Full message with `otp:{codes:[],links:[]}` already extracted |
| `mail_wait_for(address, fromContains?, subjectContains?, timeoutSec?)` | Long-poll: returns the moment a matching mail lands |
| `mail_send(address, to, subject, text, html?)` | Send from an identity |
| `mail_mark_seen(address, id, seen?)` | Mark read/unread |

## The sign-up playbook

Every email-based sign-up is the same five steps:

1. **Create an identity** for the job — one per site or purpose, so the account
   is easy to revoke later: `mail_new_identity(localpart: "okx")`.
2. **Start the sign-up** on the website and give it that address. Some flows the
   agent can drive itself through a browser; some the user does by hand. Either
   way the mailbox is the agent's.
3. **Wait for the email** instead of polling:
   `mail_wait_for(address, subjectContains: "verification", timeoutSec: 300)`.
   The call returns the moment the mail lands — usually well under a minute.
4. **Take the code or link** from the response — codes and verification links
   come back already extracted; no HTML parsing, no regex.
5. **Complete the sign-up** with the code or link. The whole loop is usually
   1–2 minutes.

Because each identity is a real address on your own domain, the account stays
durable: password resets, login alerts, and receipts keep working as long as
your server runs.

Worked examples, both run end to end on a stock instance (plus documented
Crossmint and Binance Agentic Wallet flows):
<https://openagent.email/docs/guides/agent-signup/>

## Agent-to-agent mail

Identities on the same server can simply email each other. A coordinator agent
mails `research@yourdomain.com`; the research agent's `mail_wait_for` returns
with the brief; results come back the same way. Delivery is local — no external
SMTP, no rate limits, and every thread is inspectable in the dashboard.

## Security rules — read once

- **OTP codes are credentials.** Treat them like passwords while valid; never
  forward a code anywhere but the form it was requested for.
- **One identity per purpose.** Clean audit trail, one-line revocation.
- **Captcha, KYC, and wallet signatures are human steps.** This skill covers
  the email leg. When a site asks for a puzzle or an identity check, hand it
  to the user.
- **Don't bulk-register.** Automated mass sign-ups are abuse everywhere; this
  is for accounts your agents genuinely operate, within each site's terms.

## Links

- Server repo (Apache-2.0): <https://github.com/openagentemail/openagentemail>
- Docs: <https://openagent.email/docs/>
