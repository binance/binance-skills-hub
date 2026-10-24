# event-driven-trading-playbook

A pre-trade decision framework for scheduled market events, packaged as a Binance Skills Hub skill.

It turns a calendar event into a written **playbook card** before any order is placed: event level
and type, the announcement-to-effective-date window, a four-metric crowding check, cross-market
confirmation, entry trigger, sizing, and a pre-written exit plus invalidation condition.

## Files

| Path | Contents |
|---|---|
| `SKILL.md` | The framework: seven steps, the output card, when to trigger |
| `references/event-taxonomy.md` | Level table, type A / type B / realisation, event class → what prices first, the inclusion timeline, the vacuum-pricing problem, proxy map, event walls |
| `references/crowding-metrics.md` | Funding, open interest, long/short ratios, liquidation direction — reading guide, thresholds, data sources, caveats |
| `references/playbook-templates.md` | The four entry structures, the location-percentile filter, card templates per event class, the veto list, a nine-point grading rubric |
| `scripts/event_dashboard.py` | Builds the crowding dashboard from public keyless endpoints |

## Running the script

No dependencies — standard library only, Python 3.10+.

```bash
python scripts/event_dashboard.py BTC_USDT
python scripts/event_dashboard.py SNDK_USDT --venue gate
python scripts/event_dashboard.py ETHUSDT --json
```

Two venue adapters are attempted in order, because derivatives endpoints are geo-restricted in some
regions:

1. `binance-futures` (`fapi.binance.com`) — preferred when reachable.
2. `gate-futures` (`api.gateio.ws`) — fallback; returns funding, open interest, account and
   top-trader long/short ratios, and liquidation sizes in a single `contract_stats` call.

Both adapters produce the same dashboard shape. If both fail, the script reports the HTTP status per
venue rather than substituting spot data for derivatives data — they are different objects.

Example output:

```
=== SNDK_USDT @ gate-futures === 2026-10-06 18:24:45 +0800
last 1,697.9900   mark 1,697.8200   index 1,696.6150   basis +0.071%
24h -1.66%   range 1,683.1600 - 1,744.0000   quote volume $108.00M
location: 0.24 of 24h range (OUTSIDE 0.30-0.70 band (chase risk))
open interest $141.31M   24h OI change +3.19%

crowding read:
  - funding: +0.0195%/interval (+21.4% annualised) -> normal; longs pay shorts
  - OI vs price: price -2.08% with OI +3.19% -> new shorts building (squeeze fuel)
  - long/short accounts: 2.21; size-weighted top traders read 0.72 (opposite side)
  - liquidations 24h: $87.53K long vs $16.36K short -> one-sided long cascade
```

## Scope and limits

- Educational and analytical. No price predictions, no asset recommendations, no order placement.
- Positioning data is venue-specific: one exchange is a proxy for the market, not the market.
- Readings are point-in-time; record the timestamp with any snapshot.
- Every output must carry "for research and educational use only; not investment advice".
