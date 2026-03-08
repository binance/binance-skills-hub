---
name: cz_style_rewrite
description: Rewrites or generates a post in CZ-inspired style using dataset-derived profile cues.
---

# CZ Style Rewrite

## Usage

- Category: AI Style
- Mode: live
- Version: 0.1.0

## Input Example

```json
{
  "mode": "rewrite",
  "draft": "市场有波动，大家别慌，我们会持续优化产品和风控。",
  "language": "zh",
  "toneStrength": 3,
  "maxChars": 220
}
```

Alternative (new content):

```json
{
  "mode": "generate",
  "topic": "BNB生态开发者增长",
  "language": "zh"
}
```

## Local Install (planned)

```bash
npx @skillshub/cz-style-rewrite
```

## Notes

- This skill is style-inspired only, not identity impersonation.
- Keep factual claims grounded; avoid fabricated announcements or promises.

