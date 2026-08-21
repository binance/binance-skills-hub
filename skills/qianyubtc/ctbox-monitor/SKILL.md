---
title: CTBox 市场监控
description: 获取加密货币合约市场的实时监控数据，包括黑马信号（量价齐升小币种）、资金费率排行、持仓量异动、多空比、大额清算。用户说"有什么黑马"、"资金费率"、"市场异动"、"谁在爆仓"时触发。
metadata:
  version: 1.0
  author: qianyubtc
license: MIT
---

# CTBox 市场监控

## 数据接口

### 黑马信号
```
GET https://api1.qianyubtc.com/api/skill/monitor/blackhorse
无参数，返回当前量价齐升的潜力小币种
```

### 市场总览（资金费率 / 持仓量 / 多空比 / 清算）
```
GET https://api1.qianyubtc.com/api/skill/monitor/summary
无参数，返回全市场监控数据汇总
```

## 使用说明

### 当用户问黑马、飙升币种时
调用 `/monitor/blackhorse`，按以下格式回复：

---

**🔥 黑马信号（实时）**

共发现 [count] 个信号：

[遍历 signals，每个格式如下]
**[rank]. [symbol]/USDT** $[price] | 涨幅 +[change]% | 量能 [volRatio]x
信号：[signals 标签用空格分隔]

---

若 count=0，回复"当前市场无明显黑马信号，整体平稳"

### 当用户问资金费率时
调用 `/monitor/summary`，回复 fundingRates 部分：

---

**💰 资金费率排行**

极端费率：[extremeCount] 个

[列出前10名，格式：币种 | 费率% | 备注]

---

### 当用户问持仓量异动时
回复 oiChanges 部分：

---

**📦 持仓量异动**

[遍历 oiChanges：币种 | 变化% | 标签（主力建仓/主力离场）]

若无数据，回复"暂无明显持仓量异动"

---

### 当用户问多空比时
回复 lsRatios 部分：

---

**⚖️ 多空比**

[遍历 lsRatios：币种 | 多空比 | 多头% | 空头% | 状态]

---

### 当用户问爆仓、清算时
回复 liquidations 部分：

---

**💥 近期大额清算**

[遍历前10条：币种 | 多头爆仓/空头爆仓 | 金额$]

---

### 当用户泛问"市场怎么样"时
调用两个接口，综合给出一个简短市场快照：黑马数量 + 极端费率数 + 主要多空比情况 + 最大清算。
