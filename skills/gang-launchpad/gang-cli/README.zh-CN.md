# Gang CLI（`gang`）

用 Binance **Agentic Wallet** 操作 [gang.fun](https://gang.fun)。内盘买入/发币需要 SPACE ID `.ai` Agent ID。本 CLI 只组 calldata，签名走 `baw`，不持有私钥。

**发币路径（0.2.1+）：** 仅 LaunchpadV2（`0x1B8F3f69DFa0a7F63d308C7EB0Fd38D8b099966E`）。Soft / LaunchpadU / LaunchpadS：**禁止新 create**，仅存量 buy/sell/claim。新币毕业 ≈ **15 BNB**（PoolCheck）。Soft 存量链上仍为 20 BNB 毕业。

## 安装

Node ≥ 18。另需 `baw`：

```bash
npm i -g @binance/agentic-wallet
npm i -g @gangfun/cli@0.2.1 --registry=https://npm.pkg.github.com
```

或：`npm i -g github:gangfun/cli`

Skill：`npx skills add gangfun/gang-launchpad/skill`

## 准备

1. 币安 App → 钱包 → Agentic Wallet；领取 `.ai` Agent ID。
2. 打开 **Developer Mode** 与 **Trade all tokens**。
3. `baw auth signin`
4. `gang preflight` — `createPad` 须为 LaunchpadV2。

## 命令

```bash
gang preflight
gang list
gang token --token <addr>
gang quote --token <addr> --bnb <n>
gang buy --token <addr> --bnb <n> [--slippage 1]
gang sell --token <addr> (--amount <tokens> | --all) [--slippage 1]
gang upload-logo --file ./avatar.png
gang create --name <n> --symbol <s> [--logo-uri URL | --logo ./avatar.png] [--taxed] [--pair-or-quote 0x…]
gang execute --request-id <id>
gang tx --hash <0x..>
```

### Logo + 发币

站内：https://gang.fun/dev/logo

```bash
gang upload-logo --file ./avatar.png
gang create --name "My Agent Coin" --symbol MAC --logo-uri https://gang.fun/api/logos/<id>.png
gang execute --request-id …

# 或一步上传
gang create --name "My Agent Coin" --symbol MAC --logo ./avatar.png
gang execute --request-id …
```

## Quote 路径

- Soft 存量：链上 `quoteBuy` / `quoteSell`。
- **LaunchpadV2：** 唯一路径 = 合约 `LaunchpadV2.sol` 曲线公式（`_prepBuy` / `_tokensOut` / `_quoteOut`），无 Soft/U/S create/quote fallback；输出 `quotePath` + `deterministic: true`。

## 规则（短）

- 内盘每钱包 1%；多付同笔退回。
- **新**发币 ≈15 BNB 毕业（LaunchpadV2）。Soft 存量归档：20 BNB，仅买卖。
- 毕业前不可转账；毕业后走 PancakeSwap。

## 环境变量

| 变量 | 含义 |
|---|---|
| `GANG_LAUNCHPAD` | 发币目标（默认 V2） |
| `GANG_RPC_URL` | BSC RPC |
| `GANG_LOGO_API` | Logo 上传 API（默认 `https://gang.fun/api/logos`） |

## 版本

`0.2.1` · [gangfun/cli](https://github.com/gangfun/cli)
