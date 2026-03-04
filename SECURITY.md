# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the Binance Skills Hub, please report it responsibly.

### How to Report

- **Email**: security@binance.com
- **Binance Bug Bounty**: https://bugcrowd.com/binance

**Do NOT** open a public GitHub issue for security vulnerabilities.

### What to Include

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. Suggested fix (if available)

### Response Timeline

| Action | Timeline |
|--------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix deployment | Depends on severity |

---

## Security Guidelines for Skill Contributors

### API Key Safety

- **Never** include API keys, secrets, or credentials in SKILL.md files
- Use placeholder values in examples: `YOUR_API_KEY`, `YOUR_SECRET`
- Document authentication requirements without exposing actual credentials
- Skills using authenticated endpoints must clearly mark which endpoints require authentication

### Endpoint Documentation

- Only document **official** Binance API endpoints
- Verify all documented endpoints are publicly accessible or clearly mark authentication requirements
- Do not document internal, deprecated, or undocumented-by-Binance endpoints that may change without notice
- Include rate limit information to prevent accidental API abuse

### Example Request Safety

- Use safe, read-only example parameters (don't demonstrate destructive operations without warnings)
- For trading endpoints, include explicit warnings about real fund risk
- Mark testnet vs. mainnet URLs clearly
- Include `# WARNING: This will execute a real trade` comments for order-placing examples

### Code Injection Prevention

- SKILL.md files should not contain executable code that runs automatically
- Example curl commands should be clearly marked as examples, not auto-executable
- Do not include shell scripts that download or execute remote code
- Avoid URL shorteners — always use full, verifiable URLs

### Data Privacy

- Do not include real wallet addresses in examples (use well-known public addresses or placeholders)
- Do not include real transaction data that could identify users
- Sanitize all response examples to remove potentially identifying information

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main branch) | Yes |
| Older commits | No |

---

## Scope

This security policy covers:
- The Binance Skills Hub repository and its contents
- SKILL.md documentation files
- Reference documentation files
- Example code and curl commands

This policy does **not** cover:
- Binance platform security (report to security@binance.com)
- Third-party skills or integrations
- Upstream API security (report to respective API providers)
