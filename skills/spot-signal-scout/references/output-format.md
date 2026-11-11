# Output Format

A scan should contain:

1. Market snapshot
2. Ranked market-configuration table
3. Detailed analysis of the highest-ranked configuration
4. Key risks and conflicting evidence
5. Final analytical decision state

The ranked table should describe observed technical conditions, not recommend trades.

When relevant data is available, the detailed analysis may include:
- Reference trigger condition
- Reference invalidation level
- Illustrative reference target level
- Illustrative R:R

These reference levels are analytical comparisons only. They are not recommended entry prices, stop-loss instructions, exit prices, or expected returns.

Clearly distinguish observed conditions from conditions that have not yet occurred. Do not describe a developing configuration as confirmed.

Use the decision-state terminology defined in SKILL.md:
- CONFIRMED MARKET CONFIGURATION
- AWAITING TECHNICAL CONFIRMATION
- WATCH
- NO VALID MARKET CONFIGURATION
- LOW-QUALITY / INSUFFICIENT EVIDENCE

A result with no qualifying configuration should explain:
- Why the available evidence did not qualify
- Which rejection criteria or uncertainties applied
- What observable future market condition would justify reassessment

Never force a qualifying configuration merely to populate the ranked table. If none qualifies, state `NO VALID MARKET CONFIGURATION`.
