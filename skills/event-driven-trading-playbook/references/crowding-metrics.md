# Crowding Metrics

Companion to `SKILL.md` § *Crowding Check*. Four public metrics answer one question: **is the side I
am about to take already the consensus side?**

Fetch them with `scripts/event_dashboard.py`. Thresholds below are starting points for reading, not
signals to trade mechanically — always compare against the instrument's own recent distribution,
because "extreme" differs between a major pair and a thin alt.

## 1. Funding rate

What it is: the periodic payment between longs and shorts on a perpetual. Positive funding = longs pay
shorts = the book leans long.

| Reading | Interpretation |
|---|---|
| near zero, stable | balanced; funding carries no information |
| positive and rising for several periods | longs are paying to stay; crowding in your direction if you are long |
| extreme positive (venue-dependent, commonly ≳ 0.05–0.1% per 8h annualised to a large number) | late longs; squeeze risk against them |
| negative and falling | shorts are paying; squeeze fuel for an upward move |
| flips sign while price does not move | positioning is changing without a price consequence — often precedes the move |

Use the *trend* of funding, not a single print. Note the venue's funding interval (8h vs 1h vs
continuous) before annualising anything.

## 2. Open interest (OI)

What it is: total outstanding contracts, in notional.

| Price | OI | Reading |
|---|---|---|
| up | up | new money entering the direction of the move — continuation fuel |
| up | down | shorts covering / longs taking profit — the move is being unwound |
| down | up | new positions building against the move — fuel for a reversal |
| down | down | both sides leaving — the move is losing participation |

The price/OI quadrant matters more than the OI level. Rising OI into a scheduled event means the
event is already being expressed; it also means the unwind can be violent.

## 3. Long/short ratios

Two different populations, often with opposite readings:

- **Account ratio** (`lsr_account`, "global long/short account ratio") — counts *accounts*. Retail-heavy,
  and therefore the contrarian metric: a heavily one-sided account ratio is a crowded retail side.
- **Position ratio** (`top_lsr_size`, top-trader long/short *position* ratio) — weights by size. Large
  accounts behave differently from small ones; when the two disagree, the size-weighted one is the
  better description of who actually moves the book.

Taker ratio (`lsr_taker`) describes aggression in the last interval: >1 means takers are buying.

Reading guide: extremes are the signal. A ratio near 1 carries no information; a ratio far from the
instrument's own recent norm tells you who is crowded and therefore who is exposed to a forced exit.

## 4. Liquidation direction

What it is: the notional of long vs short positions forcibly closed in the interval.

| Reading | Interpretation |
|---|---|
| one-sided long liquidations, large | a long cascade; the down move is mechanical, not voluntary selling |
| one-sided short liquidations, large | a short squeeze; rallies of this type are self-terminating once the fuel is gone |
| two-sided, moderate | genuine two-way flow |

Distinguish forced flow from voluntary flow: a move driven by liquidations tends to overshoot and then
partially retrace once the forced sellers are gone. A move driven by voluntary repositioning tends to
hold. Post-liquidation-cascade entries are a different trade from post-news entries.

## 5. Reading the four together

| Pattern | Likely state |
|---|---|
| funding extreme + account ratio extreme, same side, OI rising | the crowd is fully positioned; the risk is a squeeze against them |
| OI rising while price falls | new shorts building — squeeze fuel |
| one-sided liquidations + funding normalising | a mechanical move just completed; expect a partial retrace, not continuation |
| all four neutral | no crowding information; the trade must stand on the event itself |

Three of four agreeing in the same direction is the level at which this becomes an input to the
decision rather than noise. One metric is never enough.

## 6. Data sources used by the script

| Metric | `gate-futures` (`api.gateio.ws`, fallback) | `binance-futures` (`fapi.binance.com`, preferred) |
|---|---|---|
| Last / mark / index price | `/futures/usdt/tickers?contract=` | `/fapi/v1/premiumIndex`, `/fapi/v1/ticker/24hr` |
| Funding rate | `funding_rate`, `funding_rate_indicative` | `lastFundingRate` |
| Open interest | `open_interest_usd` (`/futures/usdt/contract_stats`) | `/fapi/v1/openInterest`, `/futures/data/openInterestHist` |
| Account long/short | `lsr_account`, `lsr_taker` | `/futures/data/globalLongShortAccountRatio`, `/futures/data/takerlongshortRatio` |
| Top-trader long/short | `top_lsr_account`, `top_lsr_size` | `/futures/data/topLongShortAccountRatio`, `/futures/data/topLongShortPositionRatio` |
| Liquidations | `long_liq_usd`, `short_liq_usd` per interval | not exposed publicly; use OI deltas as a proxy |

Caveats to state in any output that uses these numbers:

1. **Single venue.** Funding and positioning are venue-specific. A reading from one exchange is a
   proxy for the wider market, not the market.
2. **Symbol mapping.** The same asset has different symbols per venue (e.g. `BTC_USDT` vs `BTCUSDT`).
   The script normalises, but confirm the instrument exists on the venue you are reading.
3. **Restricted regions.** Futures endpoints are geo-blocked in some jurisdictions. The script tries
   Binance first and falls back to Gate; if both fail, say so rather than substituting spot data for
   derivatives data — they are different objects.
4. **Timestamp.** Record the reading time with every snapshot. Funding and OI are point-in-time.
