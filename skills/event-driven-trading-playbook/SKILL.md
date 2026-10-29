---
name: event-driven-trading-playbook
description: |
  A structured, pre-trade decision framework for scheduled market events — CPI, FOMC, NFP,
  earnings, index inclusion, token listings, unlocks, and geopolitical shocks. Use it to turn a
  calendar event into a written playbook card before any order is placed: event classification
  (level, type, direction), the announcement-to-effective-date window (buy-the-rumour /
  sell-the-news), a four-metric crowding check (funding, open interest, long/short ratio,
  liquidation direction), cross-market confirmation, entry trigger, position and leverage
  sizing, and pre-written exit and invalidation rules. Trigger whenever the user asks whether
  to take a trade around a scheduled event, how to play a data release or earnings print,
  where to size a stop, whether a move is "priced in", or asks for an event briefing or event
  calendar review — even if they never say "event-driven". Also use it to grade a past trade
  against the framework. This skill produces a decision process and an odds assessment, never
  a price prediction, and never a recommendation to buy or sell any specific asset.
version: 1.0.0
license: MIT
metadata:
  author: akjssh
  version: "1.0.0"
---

# Event-Driven Trading Playbook

A checklist discipline for trading scheduled events. The output is a **playbook card**: a written
decision, produced *before* the order, with the invalidation condition already stated. If a card
cannot be filled in, the correct output is "no trade" — and that is a legitimate, frequently optimal
result.

> **Scope.** This skill is educational and analytical. It does not predict prices, does not
> recommend any asset, and does not execute orders. Every output must be labelled
> "for research and educational use only; not investment advice."

## When to Use

| User intent | Mode | Output |
|---|---|---|
| "What's on the calendar today / this week?" | Briefing | Timed event list, level-tagged, mapped to instruments |
| "CPI is at 12:30 — should I trade it? How?" | Decision | Full playbook card |
| "Earnings tonight, what's the plan?" | Decision | Full playbook card |
| "Is this already priced in?" / "Did it sell the news?" | Decision | Window analysis + crowding check |
| "Where do I put the stop? How much size?" | Decision | Sizing block of the card |
| "Grade this trade I already took" | Review | Card filled retroactively, item-by-item scoring |

If the user has not supplied enough to classify the event (see Step 1), list the missing inputs and
stop. Never invent market data — fetch it (see *Data*) or ask.

## The Model: Seven Steps

### Step 0 — Facts first

Collect: (a) the event itself, with its scheduled timestamp and timezone; (b) the instrument's
current price and trailing 24h range; (c) account size and risk tolerance, because the stop
mechanism differs by size (Step 5). User-supplied market context outranks model memory.

### Step 1 — Classify the event (the anchor of everything downstream)

Two axes. Read `references/event-taxonomy.md` for the full table.

**Level** — sets holding period and leverage ceiling:

| Level | Example | Typical horizon | Leverage ceiling |
|---|---|---|---|
| L1 Message | headline, single tweet, rumour | 15 min – 1 h | trade small or not at all |
| L2 Data | CPI, NFP, listing, unlock | 2 – 10 h | 5–10x |
| L3 Event | earnings, FOMC, policy decision | 10 – 30 h | 2–5x |
| L4 Regime | war escalation, index reconstitution, cycle break | days – weeks | 2–5x, the only level where a large position is defensible |

**Type** — determines whether the trade is even available:

- **Type A (event → move):** the catalyst precedes the price move. Tradeable as an expectation game.
- **Type B (move → excuse):** price already moved and the narrative arrived afterwards. Do not chase.
- **Realisation type (sell the news):** the event was anticipated; the payout is at the moment of
  confirmation. See Step 2.

The single most common account-killer is a level mismatch: sizing an L1 position like an L4 one.
Level, holding period and leverage must match.

### Step 2 — Decompose the timeline (this is where "priced in" gets decided)

Every scheduled event has up to three dates, and they are not interchangeable:

1. **Announcement** — when the market learns the event will happen (e.g. index inclusion notice,
   listing announcement, guidance pre-release).
2. **Effective / realisation date** — when the mechanical consequence lands (index effective day,
   unlock date, contract expiry, print release).
3. **Digestion** — after the mechanical flow is done.

**Rule: for inclusion, listing, and unlock-type events, the profit window is announcement →
effective date. The effective date's open is the realisation point, and the position is closed at or
before it.** Anticipation money enters after the announcement and must be sold to the mechanical
buyer on the effective date. Once the mechanical flow completes, the marginal buyer is gone.

Ask explicitly, and write the answer down:

- Which date are we on now, and how many sessions remain?
- Who is the *forced* counterparty on the effective date, and how large is their flow?
- What does the instrument do in the vacuum when its underlying is closed? (For a stock-perp or
  tokenised equity trading 24/7 against a closed cash market, the price is a shadow of
  "last close + expected open" — reprice, do not extrapolate.)

### Step 3 — Filter with three questions (one veto is enough)

1. **Where are we?** Low range / high range / mid-trend. A great event at a terrible location is a
   bad trade.
2. **Can the driver persist?** Is it a durable regime change, or an event whose effect decays within
   hours? Realisation-type events decay immediately.
3. **Which instrument and horizon?** Trend position or short-horizon event trade? This determines
   the stop mechanism.

If any answer is unclear, output "no trade" plus what is missing. Clarity on all three gates
proceeds to Step 4.

### Step 4 — Map the event to the instrument, then confirm across markets

The same event prices differently in different venues. Identify **which market prices it first** and
**which instrument has the most elasticity**, then verify direction with independent proxies.

Confirmation is a necessary condition, not a formality: a data print can be correct and the market
can still refuse it. Require at least two of these three groups to agree in direction before
committing:

- **Rates:** front-end (2Y) and long-end (30Y) yields; for non-US exposure, the relevant sovereign
  curve (e.g. Bunds).
- **Peers / substitutes:** the closest listed comparables in the same supply chain or sector.
- **Structure:** which names lead and which lag on the move.

Beware the proxy trap: a broad index future is a poor proxy for a narrow sub-sector. Use same-sector
comparables plus a rate anchor. See `references/event-taxonomy.md` § *Proxy map*.

### Step 5 — Entry trigger (no trigger, no entry)

Read `references/playbook-templates.md` for the four entry structures. Hard requirements:

1. **Structure:** one of platform retest-and-hold, reversal candle at a key level, opening-range
   resolution, or engulfing + distribution. At least one must be present.
2. **Location percentile:** entry inside 0.3–0.7 of the trailing 24h range. Chasing an extreme —
   shorting a panic breakdown, buying an emotional high, catching the second day of a decline — is
   where the largest losses concentrate.
3. **Session:** for 24/7 instruments, the low-liquidity session is a **direction arbiter, not an
   entry point** — it reveals which way the book leans. Enter in the session that historically
   carries the move; scale in tranches rather than filling at once.

### Step 6 — Size it: certainty × position × leverage is a constant

- **Position:** single-trade margin ≈ 5–15% of account × confidence factor (L2 = 0.5, L3 = 0.8,
  L4 = 1.0). Narrative or low-liquidity names get a probe only.
- **Leverage ladder:** standard event trade 3–5x; only calendar-certain events entered at a planned
  level justify 10x+; the 15x+ band degrades hit-rate materially and is off by default.
- **Stop mechanism by account size:** small accounts use a strict **price stop on every trade**;
  only large accounts with small positions may substitute an **event-invalidation stop**. State
  which one applies before entering.
- Always state the maximum acceptable loss for the trade (in ROI terms), not just the stop price.

### Step 7 — Pre-write the exit, and run the veto list

Before entering, write down all three:

1. **Expected holding period** for this level. Holding past ~1.5x that period means you are no longer
   trading the event — you are carrying it.
2. **Exit rule** — exactly one of: time-based, event-invalidation (the thesis is contradicted by new
   information), or structural (a level breaks).
3. **Invalidation condition** — the specific, observable thing that proves the thesis wrong. If it
   cannot be written, the thesis does not exist.

Then the veto list (`references/playbook-templates.md` § *Veto list*). Any single hit cancels the
trade regardless of how good the setup looks:

- Chasing a breakdown in panic; shorting an emotional high; catching a falling knife on day two;
  chasing a realisation-type rally after the news is public.
- Immediate revenge re-entry at double size after a loss.
- Entering into a cluster of high-impact events (an "event wall") without deliberately reducing size.

### Output — the playbook card

Every decision-mode answer ends with this card. Unfilled fields are the point: they show what is
still unknown.

```
[Event & Level]      what / when (with timezone) / L1-L4 / type A or realisation
[Three Questions]    location · persistence · instrument & horizon — each answered or flagged
[Instrument]         venue + direction, and its place in the transmission chain
[Cross-Market]       rates / peers / structure — which agree, which disagree
[Crowding]           funding · OI · long-short ratio · liquidation direction (see crowding-metrics)
[Entry Trigger]      structure present? percentile? session? tranche plan
[Sizing]             margin % × level factor · leverage · stop mechanism · max acceptable loss
[Exit Plan]          expected hold · exit type · the observable invalidation
[Veto Check]         each veto item, pass/fail
```

"No trade" output = the first three fields plus the specific question that failed. Missing an entry
is not a loss.

## Crowding Check (Step 3.5 — run it before every entry)

Four public metrics tell you whether the trade is already crowded. Fetch them with
`scripts/event_dashboard.py`; interpretation thresholds are in
`references/crowding-metrics.md`.

| Metric | Crowded reading | What it implies |
|---|---|---|
| Funding rate | persistently extreme in your direction | you are paying to hold the consensus side |
| Open interest | price falls while OI rises | new shorts are building — fuel for a squeeze against them |
| Long/short account ratio | heavily one-sided retail positioning | contrarian pressure is building |
| Liquidation direction | one-sided liquidation bursts | forced flow, not voluntary flow — the move is mechanical |

One crowded metric is noise. Three agreeing is a signal, usually in the opposite direction to the
crowd.

## Data

`scripts/event_dashboard.py` builds the crowding dashboard from public, keyless endpoints. Two venue
adapters, tried in order, because futures endpoints are geo-restricted in some regions:

- `binance-futures` (`fapi.binance.com`) — preferred when reachable.
- `gate-futures` (`api.gateio.ws`) — fallback; exposes funding, open interest, account/taker
  long-short ratios, top-trader ratios and liquidation sizes in one call.

```bash
python scripts/event_dashboard.py BTC_USDT
python scripts/event_dashboard.py SNDK_USDT --venue gate --json
```

Both adapters return the same dashboard shape. Note the caveat in the output: a single venue's
funding and positioning is a **proxy** for the wider market, not the market.

For the event calendar itself and for announcements, prefer primary sources — the exchange's own
announcement feed, the statistics agency's release page, the company's investor-relations page —
over aggregators, and always record the timestamp you read them at.

## Neutrality and Limits

Required by the host repository's trading rules, and correct on the merits:

- Do not promote, rank, or recommend any coin, token or asset.
- Do not describe any position as safe, guaranteed or low-risk.
- Do not present a past outcome as predictive.
- Do not place trades for the user; the human approves every order.

Outputs are a decision *process* and an odds assessment. They are not advice, and the user remains
responsible for every decision.
