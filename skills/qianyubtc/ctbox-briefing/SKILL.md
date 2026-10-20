---
title: CTBox 简报发布
description: 基于 CTBox 实时数据生成加密货币市场简报，展示给用户确认后发布到币安广场。用户说"生成简报"、"发广场"、"发一条XX的分析"时触发。需要用户提供 X-Square-OpenAPI-Key。
metadata:
  version: 1.0
  author: qianyubtc
license: MIT
---

# CTBox 简报发布

## 数据接口

### 获取分析数据
```
GET https://api1.qianyubtc.com/api/skill/analysis
参数：symbol（如 BTCUSDT）、interval（如 1h）
```

### 发布到币安广场
```
POST https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add
Headers:
  X-Square-OpenAPI-Key: [用户的 API Key]
  Content-Type: application/json
  clienttype: binanceSkill
Body:
  { "bodyTextOnly": "帖子正文" }
```

## 使用说明

### 第一步：检查 API Key
如果用户没有提供 `X-Square-OpenAPI-Key`，先询问：
> "请提供你的币安广场 OpenAPI Key，我帮你发布。"

收到后，仅展示前5位+后4位（如 `ABCDe****XYZ`），不显示完整 Key。

### 第二步：获取数据
1. 识别用户想发布哪个币种和周期（默认 BTC、1h）
2. 调用 `/api/skill/analysis` 获取数据

### 第三步：生成简报文案
根据数据生成以下格式的简报（纯文本，不超过 500 字）：

---

📊 $[SYMBOL] [interval] 技术分析简报

💰 当前价：$[price]（24H [change]%）

综合评分：做多 [long]分 / 做空 [short]分
判断：[label]

📈 主要利多信号：
• [最多3个 bull signals]

📉 主要利空信号：
• [最多3个 bear signals]

💡 市场情绪：
• 资金费率 [fundingRate]% [fundingNote]
• 多空比 [longShortRatio]
• 恐惧贪婪 [fearGreed] [fearGreedLabel]

数据来源：CTBox (tc.qianyubtc.com)
#加密货币 #合约分析 #[SYMBOL]

---

### 第四步：等待用户确认
将生成的文案完整展示给用户，并询问：
> "以上是生成的简报内容，确认发布到币安广场吗？你也可以告诉我需要修改的地方。"

**未经用户明确确认，绝对不调用发布接口。**

### 第五步：发布
用户确认后，调用币安广场 API 发布。

- 成功：返回帖子链接 `https://www.binance.com/square/post/[id]`
- 失败处理：
  - 10005：需要完成身份认证
  - 220009：今日发布次数已达上限
  - 20002/20013/20020：内容包含敏感词或 URL，请修改后重试
  - 其他错误：告知错误码，建议稍后重试
