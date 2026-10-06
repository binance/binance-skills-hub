# Entry Structures, Card Templates, and the Veto List

Companion to `SKILL.md` Steps 5–7.

## 1. The four entry structures

An entry requires at least one of these to be visible on the chart **before** the order. "It feels
like it should go up" is not a structure.

| Structure | What it looks like | Where it is valid | Typical failure |
|---|---|---|---|
| **Platform retest and hold** | price breaks a range, returns to the broken edge, holds it on lower volume | trend continuation after a catalyst | the retest fails and the level becomes resistance — that failure *is* the exit trigger |
| **Reversal candle at a key level** | long wick, engulfing body, or pin at a prior high/low | exhaustion into a scheduled event | treating any wick as a reversal without a level behind it |
| **Opening-range resolution** | the first session's range breaks and holds | events that resolve at a session open | false break of a thin session (see the session note below) |
| **Engulfing plus distribution** | a strong candle that fully engulfs the prior one, then stalls | late-stage moves | chasing the candle instead of waiting for the stall |

### Location percentile

Compute the entry's position inside the trailing 24h range:

```
percentile = (entry - low_24h) / (high_24h - low_24h)
```

Target band: **0.30 – 0.70** (longs bias slightly below the middle, shorts slightly above). Outside
that band, the entry is a chase. The percentile is a *filter*, not an entry trigger — it can only
reject, never create, a trade.

### Session note (24/7 instruments)

For instruments that trade continuously, sessions have different characters:

- The low-liquidity session (typically the Asian hours for crypto) is a **direction arbiter**: thin
  books reveal which side is defended. It is usually a poor place to open a full position.
- If the low-liquidity session provides a healthy retest (shrinking volume, a platform, a 0.3–0.6
  percentile), it can be the better entry precisely because the book is thin.
- If it does not retest, the alternative is a **probe**: a deliberately tiny position whose only job
  is to read direction, with a cost close to zero. Scale to full size in the session that historically
  carries the move.

## 2. Card templates

Fill in every field. An unfilled field is an unresolved risk, not a blank to skip.

### 2.1 Scheduled data release (CPI, NFP, PMI, GDP)

```
[Event & Level]      <statistic> at <HH:MM TZ>, consensus <x>; L2 data, type A
[Three Questions]    location: <%ile of 24h range> | persistence: does it change the rate path? |
                     instrument: index / pair / rates
[Instrument]         <venue + symbol>; prices first: <rates/crypto/equities at open>
[Cross-Market]       2Y <dir> · 30Y <dir> · peers <dir> → agreement <n>/3
[Crowding]           funding <v> · OI <v> · LSR <v> · liquidations <dir>
[Entry Trigger]      release reaction + <structure>; entry percentile <v>; session <...>
[Sizing]             margin <5-15%> × L2 0.5 · leverage <5-10x> · price stop · max loss <-x% ROI>
[Exit Plan]          hold <2-10h>; time-based exit unless the print changes the regime
[Veto Check]         ...
```

Do not pre-position *through* the release unless the event is calendar-certain and the level was
planned in advance; the release is a volatility event and a gap risk at the same time.

### 2.2 Central-bank decision (FOMC and equivalents)

```
[Event & Level]      decision at <HH:MM TZ>; L3 event, type A
[Three Questions]    location | persistence: statement + press conference, not the rate itself |
                     instrument: rates first, then the risk asset
[Instrument]         <...>; the trade is in the *expectation gap*, not the decision
[Cross-Market]       2Y <dir> · curve <dir> · rate-futures-implied path <dir>
[Crowding]           ...
[Entry Trigger]      wait for the press conference to finish; enter on the first 15m-1h resolution
[Sizing]             margin × L3 0.8 · leverage <2-5x> · price stop
[Exit Plan]          hold <10-30h>; event-invalidation if the path is re-priced
[Veto Check]         event wall inside the holding period?
```

### 2.3 Earnings (single name) and its read-through

```
[Event & Level]      <company> reports <date/time TZ>; L3 event
[Three Questions]    location | persistence: guide > beat/miss | instrument: the most elastic peer
[Instrument]         <...>; read-through chain: <upstream → downstream>
[Cross-Market]       closest comparables <dir> · relevant sovereign curve <dir>
[Crowding]           ...
[Entry Trigger]      pre-print positioning only if a platform/level is already planned; otherwise
                     wait for the post-print structure
[Sizing]             ...
[Exit Plan]          exit on the print unless a trend thesis was written before it
[Veto Check]         ...
```

### 2.4 Inclusion / listing / unlock (the realisation template)

```
[Event & Level]      announced <date>; effective <date>; L2-L3, realisation type
[Three Questions]    location | persistence: window ends at the effective date |
                     instrument: the instrument with the mechanical flow
[Timeline]           days remaining: <n>; forced flow: <size> vs avg volume: <ratio>
[Cross-Market]       is the move specific to the event or shared with the sector?
[Crowding]           funding · OI · LSR — is the anticipation trade already crowded?
[Entry Trigger]      any long exposure belongs to the announcement→effective window
[Sizing]             ...
[Exit Plan]          exit AT or BEFORE the effective-date open. Write the time now.
[Veto Check]         are you buying the realisation of news you already missed?
```

### 2.5 Geopolitical / shock (L4)

```
[Event & Level]      <...>; L4 regime unless it is demonstrably noise
[Three Questions]    location | persistence: does it change the regime or the tape? |
                     instrument: the most liquid risk proxy
[Cross-Market]       oil · gold · rates · defence/energy names — at least two must agree
[Crowding]           check whether the safe-haven side is already crowded
[Entry Trigger]      first structure after the initial impulse; never the impulse itself
[Sizing]             L4 allows the largest position, still with a written stop
[Exit Plan]          time-based, with a written regime-invalidation condition
[Veto Check]         ...
```

## 3. The veto list

Any single hit cancels the trade, no matter how attractive the setup. These are the positions where
losses concentrate, and each is identifiable *before* entry:

1. **Chasing a breakdown in panic.** Shorting into a vertical, already-liquidated move.
2. **Shorting an emotional high.** The high is emotional precisely because you noticed it late.
3. **Catching a falling knife on day two.** The second day of a decline is not a discount; it is an
   unresolved decline.
4. **Chasing a realisation rally after the news is public.** You are buying the exit of the
   anticipation trade.
5. **Revenge re-entry at double size after a loss.** The classic account-ender. Mandatory cooling-off
   after any stop-out.
6. **Entering blind into an event wall.** Two or more high-impact events inside the intended holding
   period without a deliberate size reduction.

## 4. Grading a past trade

For review mode, fill the card retroactively and mark each field:

| Field | Pass condition |
|---|---|
| Level | level, horizon and leverage were consistent |
| Type | it was type A, not a chased type B |
| Location | entry percentile was inside 0.30–0.70 |
| Trigger | at least one named structure was present before entry |
| Confirmation | ≥2 of 3 proxy groups agreed at entry |
| Crowding | the four metrics were checked, not assumed |
| Sizing | margin × factor, leverage within the level's ceiling |
| Exit | the exit type was written before entry and executed |
| Veto | no veto item was hit |

Score out of nine. The useful output is the *pattern* across trades — the fields that repeatedly fail
are the ones to change.
