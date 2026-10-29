# Event Taxonomy and Instrument Mapping

Companion to `SKILL.md` Step 1 and Step 4. Everything here is a classification aid, not a forecast.

## 1. Level table

| Level | Trigger shape | Typical horizon | Leverage ceiling | Position factor |
|---|---|---|---|---|
| **L1 Message** | single headline, official tweet, rumour, denial | 15 min – 1 h | probe only | 0.2–0.3 |
| **L2 Data** | scheduled statistic, listing, unlock, index announcement | 2 – 10 h | 5–10x | 0.5 |
| **L3 Event** | earnings, FOMC, policy decision, court/regulatory ruling | 10 – 30 h | 2–5x | 0.8 |
| **L4 Regime** | war escalation, index reconstitution, funding-regime break, IPO/credit break | days – weeks | 2–5x | 1.0 |

Rules that follow from the table:

- Level, holding period and leverage must be consistent. Mismatch is the most common cause of an
  oversized loss: an L1 entry held with L4 patience and L4 size.
- Only L4 justifies a large position. L1 usually does not justify a position at all.
- Re-classify when new information arrives. A scheduled L2 print that changes the policy path is no
  longer L2.

## 2. Type A vs Type B vs Realisation

| Type | Order of events | Available trade |
|---|---|---|
| **A** | catalyst → price move | expectation game: position after the catalyst, before the mechanical flow |
| **B** | price move → narrative explanation | none. The move already happened; you are the exit liquidity. Do not chase. |
| **Realisation** | anticipation → confirmation → decay | the payout is at confirmation. Window closes on the effective/release date. |

Diagnostic: if you cannot name the catalyst that existed *before* the move started, it is Type B.

## 3. Event class → what actually moves

| Event class | Prices first | Confirmation proxies | Notes |
|---|---|---|---|
| US inflation / labour data | rates and FX at release; crypto immediately; equities at the cash open | 2Y and 30Y yields, DXY, sector leaders | a hot/cool print only matters if it changes the policy path |
| Central-bank decision | the statement and press conference, not the rate | 2Y, curve slope, rate-futures-implied path | hawkish cut / dovish hike are real categories |
| Earnings (single name) | the report and the guide; then peers | closest comparables in the same supply chain; the sector index | the guide usually matters more than the beat |
| Supply-chain / sub-sector print | the read-through to substitutes | peers' pre-market, upstream/downstream names, relevant sovereign yields | broad index futures are a poor proxy for a narrow sub-sector |
| Index inclusion / reconstitution | announcement date, then the effective date | the mechanical flow size vs average volume | see §4 |
| Listing / delisting / trading-pair change | the announcement | liquidity and funding on the venue | a listing is a liquidity event, not a fundamental one |
| Token unlock / vesting | ahead of the unlock | unlock size vs trailing volume, funding, OI | mechanical supply |
| Dividend / distribution / airdrop | ex-date and record date | holders of record, borrow availability | mechanical flows |
| Geopolitical shock | the most liquid risk proxy first | oil, gold, rates, defence names | L4 if it changes the regime; L1 if it is noise |

## 4. The inclusion / listing timeline (the "sell the news" template)

Three dates, in order:

1. **Announcement.** Anticipation money enters. This is the start of the window.
2. **Effective date.** The forced buyer (index fund, tracker, mandatory flow) transacts. This is the
   realisation point.
3. **Digestion.** The forced flow is complete. The marginal buyer disappears.

Operational consequences:

- Long exposure, if any, belongs to the announcement → effective-date window, and is exited **at or
  before the effective-date open**, not after it.
- The effective-date open is where the reversal print typically appears: a large-volume upper wick
  into the open that cannot be recovered.
- Size the forced flow before assuming it is bullish. If the flow is small relative to normal
  volume, the anticipation move has already over-discounted it.
- Distinguish "start of a favourable event" from "realisation of a favourable event". Same headline,
  opposite trade.

## 5. The vacuum-pricing problem (24/7 instruments tracking a closed market)

When an instrument trades continuously but its underlying is closed (stock-perps, tokenised equities,
weekend sessions), price is not the underlying price. It is a composite of:

`last cash close + expected open + liquidity premium`

Consequences:

- Do not extrapolate a perp move into an expected cash move; they reprice on different clocks.
- The gap between the perp and the last cash close is a *consensus expectation*, and expectations can
  be wrong in both directions.
- Failure modes around the reopen: catch-up (perp converges to cash), no-move (expectation was
  already right), and give-back (expectation was wrong).
- Checks before trading the vacuum: instrument level relative to the cash close, the venue's funding
  and basis, and the depth of the book at the current price.

## 6. Proxy map

Pick a proxy that shares the *driver*, not just the *index membership*.

| To confirm | Weak proxy | Better proxies |
|---|---|---|
| Broad risk appetite | a single mega-cap | index futures + credit + breadth |
| A narrow tech sub-sector | broad tech index | the 2–4 closest comparables, plus the relevant rate anchor |
| Rate-path repricing | the long end alone | 2Y + 30Y + the curve slope |
| Crypto risk appetite | one alt | BTC dominance, perp funding, stablecoin flows |
| Non-US sector exposure | US index | the local market open, local peers, the local sovereign curve |

Rule: at least two of the three groups (rates / peers / structure) must agree before committing. If
they disagree, that disagreement is the information — reduce size or stand down.

## 7. Event walls

A cluster of high-impact events inside one holding period is a distinct risk state, not a sum of
individual risks. When the calendar shows an event wall inside the intended holding period, reduce
size or shorten the horizon deliberately — do not discover the wall while holding.
