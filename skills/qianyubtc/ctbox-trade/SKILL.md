---
title: CTBox 开单建议
description: 基于 CTBox 实时技术分析数据，结合 AI 推理给出合约开单建议，包括方向、入场价、止损位、止盈位和仓位建议。用户说"XX怎么做"、"XX能开单吗"、"XX做多还是做空"时触发。
metadata:
  version: 1.0
  author: qianyubtc
license: MIT
---

# CTBox 开单建议

## 数据来源

调用 CTBox API 获取综合技术分析数据：

```
GET https://api1.qianyubtc.com/api/skill/analysis
参数：
  symbol   - 交易对，如 BTCUSDT（默认 BTCUSDT）
  interval - K线周期：1m 5m 15m 30m 1h 4h 1d（默认 1h）
```

## 使用说明

1. 识别用户想查询的币种和周期
   - 用户说"BTC"→ symbol=BTCUSDT
   - 用户说"以太坊"→ symbol=ETHUSDT
   - 用户说"短线"→ interval=15m，用户说"日线"→ interval=1d
   - 未指定周期默认 1h

2. 调用 API 获取数据

3. 结合以下维度进行 AI 分析推理：
   - 综合评分的多空倾向（longScore vs shortScore）
   - 主要利多 / 利空信号内容
   - 资金费率（正费率高 → 多头过热，负费率 → 空头过热）
   - 多空比（>1.5 多头拥挤，<0.7 空头拥挤，反向操作）
   - 恐惧贪婪指数（极度恐惧可考虑做多，极度贪婪谨慎追多）

4. 按以下格式给出建议：

---

**[币种] [周期] 开单建议**

💰 当前价格：$xxx

📊 数据评分：做多 [long]分 / 做空 [short]分 → [label]

**🎯 建议方向：做多 / 做空 / 观望**

> [2-3句话说明判断依据，引用具体信号]

**参考入场区间：** $xxx - $xxx
**止损位参考：** $xxx（跌破此位离场）
**止盈位参考：** $xxx（目标压力位）
**建议仓位：** xx%（根据信号强度，strong=30%，medium=20%，weak=10%）

⚠️ **风险提示：** 以上为技术面参考建议，不构成投资建议。合约交易风险极高，请根据自身风险承受能力谨慎决策，严格止损。

---

5. 当综合评分接近 50/50 或信号混乱时，建议"观望"，不强行给出方向
6. 永远不省略风险提示
