# Scoring Model

The Technical Evidence Score measures the quality and completeness of the technical evidence in the supplied market data.

| Factor | Maximum |
|---|---:|
| Market Structure | 30 |
| Volume & Participation | 20 |
| Momentum | 15 |
| Confirmation & Volatility | 20 |
| Liquidity & Market Quality | 15 |
| **Total** | **100** |

The score is not a probability of any outcome, not an expected return, and not a recommendation.

A score of 80 or higher is not enough by itself for the state `CRITERIA MET`. That state also requires adequate structure (>= 19/30), volume (>= 10/20), confirmation (>= 12/20), acceptable liquidity, adequate data freshness, and no disqualifying condition.

Evidence labels:
- 90-100: VERY STRONG EVIDENCE
- 80-89: STRONG EVIDENCE
- 70-79: MODERATE EVIDENCE
- 60-69: WEAK EVIDENCE
- below 60: INSUFFICIENT EVIDENCE

Keep the score, the confidence level, and the analytical state separate.
