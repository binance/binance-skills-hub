---
title: CTBox 合约分析
description: 查询加密货币合约的综合技术分析，包含评分、做多/做空信号、资金费率、多空比、恐惧贪婪指数等市场数据。用户说"分析XX"、"XX现在怎么样"、"XX的技术面"时触发。
metadata:
  version: 1.0
  author: qianyubtc
license: MIT
---

# CTBox 合约分析

## 数据来源

调用 CTBox API 获取综合技术分析数据：

```
GET https://api1.qianyubtc.com/api/skill/analysis
参数：
  symbol   - 交易对，如 BTCUSDT（默认 BTCUSDT）
  interval - K线周期：1m 5m 15m 30m 1h 4h 1d（默认 1h）
```

## 使用说明

1. 识别用户想查询的币种和周期，转换为对应参数
   - 用户说"BTC"→ symbol=BTCUSDT
   - 用户说"以太坊"→ symbol=ETHUSDT
   - 用户说"4小时"→ interval=4h
   - 未指定周期时默认使用 1h

2. 调用 API 获取数据

3. 按以下格式整理并回复：

---

**[币种] [周期] 分析报告**

💰 当前价格：$xxx | 24H涨跌：xx%

📊 综合评分：做多 [long]分 / 做空 [short]分
🎯 判断：[label]（[verdict]）
📈 利多信号 [bulls]个 / 📉 利空信号 [bears]个 / ⚪ 中性 [neutral]个

**主要利多信号：**
- [bull signals，每行一个，最多5个]

**主要利空信号：**
- [bear signals，每行一个，最多5个]

**市场情绪：**
- 资金费率：[fundingRate]% [fundingNote]
- 多空比：[longShortRatio]
- 恐惧贪婪指数：[fearGreed] [fearGreedLabel]

---

4. 如果 API 返回错误，告知用户该币种可能不支持或暂时无法获取数据
