# Output Format

A report should contain:

1. Market snapshot (regime, timeframe, data freshness)
2. Comparison table of analyzed pairs
3. Detailed analysis of the pair with the strongest technical evidence
4. Conflicting evidence and limitations
5. Final analytical state
6. Disclaimer

The comparison table describes observed technical conditions. It does not recommend any action.

Suggested table columns:

| Pair | Pattern | Evidence Score | Confidence | Analytical State | Nearest Support (distance %) | Nearest Resistance (distance %) |
|---|---|---:|---|---|---:|---:|

When relevant data is available, the detailed analysis may include:
- Observed conditions (what the data shows)
- Conditions not yet observed (what has not occurred)
- Reference levels: nearest observed support and resistance areas
- Volatility context (for example ATR or recent range)

Reference levels are observed price areas from the supplied data. They are not entry prices, stop-loss levels, exit prices, targets, or expected returns. Do not compute or present risk/reward ratios.

Clearly distinguish observed conditions from conditions that have not yet occurred. Do not describe a developing pattern as complete.

Use the analytical states defined in SKILL.md:
- CRITERIA MET
- CRITERIA PARTIALLY MET
- WATCH
- CRITERIA NOT MET
- INSUFFICIENT DATA

When no pair meets the criteria, explain:
- Why the available evidence did not meet the criteria
- Which disqualifying conditions or uncertainties applied
- What observable future market condition would warrant a fresh analysis

Never force a result merely to populate the table. If no pair meets the criteria, state `CRITERIA NOT MET` for each analyzed pair.

End every report with:

`Informational technical analysis only. Not financial advice. Digital assets are volatile and carry risk of loss.`
