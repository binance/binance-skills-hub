---
name: fly-marketing-assistant
description: |
  AI-powered social media marketing assistant for small business owners.
  Generates marketing content, manages multi-platform posting, and provides analytics.
  Use when users need help with social media content creation, marketing strategy, 
  scheduling posts, or automating their marketing workflow for platforms like 
  Binance Square, Twitter/X, Xiaohongshu (Little Red Book), and WeChat Moments.
metadata:
  author: people1913
  version: "1.0"
---
# Fly Marketing Assistant

## Overview

Fly is an AI-powered marketing automation assistant designed specifically for small business owners and entrepreneurs. It helps you create compelling marketing content, manage multi-platform social media presence, and streamline your marketing workflow.

## Key Capabilities

### Content Generation
- Generate marketing copy for various platforms (Binance Square, Twitter, Xiaohongshu, WeChat)
- Create engaging posts, announcements, and promotional content
- Write product descriptions, event invitations, and community updates
- Adapt content style to match platform norms

### Multi-Platform Publishing
- **Binance Square**: Post trading insights, crypto news, and community engagement content
- **Twitter/X**: Create viral tweets with proper hashtags
- **Xiaohongshu**: Design lifestyle and product-focused posts
- **WeChat Moments**: Generate personal branding content

### Marketing Strategy
- Content calendar planning
- Hashtag optimization
- Best posting times recommendations
- Audience engagement tactics

## Supported Platforms

| Platform | Content Type | Features |
|----------|-------------|----------|
| Binance Square | Trading insights, crypto news | API auto-post, community engagement |
| Twitter/X | Short-form content | Hashtag optimization, thread creation |
| Xiaohongshu | Lifestyle, product reviews | Visual content suggestions |
| WeChat Moments | Personal branding | Group messaging support |

## API Integration

### Binance Square Posting
```bash
POST https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add
Headers:
  X-Square-OpenAPI-Key: YOUR_API_KEY
  Content-Type: application/json
  clienttype: binanceSkill
Body:
  {"bodyTextOnly": "Your post content here"}
```

## Use Cases

1. **Small Business Owners**: Automate your social media presence without hiring a marketing team
2. **Crypto Influencers**: Generate Binance Square content about trading insights
3. **E-commerce Sellers**: Create product announcements and promotional posts
4. **Content Creators**: Maintain consistent posting schedule across platforms

## Best Practices

- Keep posts under 200 characters for maximum engagement
- Use relevant hashtags (1-3 for Square, 2-5 for Twitter)
- Include a call-to-action in your posts
- Post during peak hours (9-11 AM, 7-9 PM local time)

## Limitations

- Binance Square: Max 100 posts/day per API key
- Content must comply with platform guidelines
- API key is for posting only, no trading permissions

## Getting Started

1. Configure your API keys for each platform
2. Tell Fly what type of content you need
3. Review and approve generated content
4. Post directly or schedule for later

Example prompt:
"Help me create a week of Binance Square posts about DeFi trading tips"
