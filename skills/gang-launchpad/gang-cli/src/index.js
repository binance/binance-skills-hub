#!/usr/bin/env node
import {
  CONFIG, ADDR, listTokens, tokenInfo, quoteBuy, quoteSell, isAgent, balanceOf, allowance,
  calldata, decodeTx, parseEther, fmt, fmtTok, resolvePad, assertCreateTarget, zeroAddress,
} from './chain.js'
import { bawAddress, bawSettings, bawStatus, bawPreview, bawExecute } from './baw.js'
import { uploadLogoFile, LOGO_UI } from './logo.js'

const args = process.argv.slice(2)
const cmd = args[0]
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def }
const flag = (name) => args.includes(`--${name}`)
const out = (o) => console.log(JSON.stringify(o, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2))
const fail = (msg, extra = {}) => { out({ success: false, error: msg, ...extra }); process.exit(1) }

const parseSlippage = (raw) => {
  const s = Number(raw)
  if (!Number.isFinite(s) || s < 0 || s > 50) fail('--slippage must be a number between 0 and 50', { got: raw })
  return s
}

const HELP = `gang — agent-only launchpad on BNB Chain (Binance Agentic Wallet) · LaunchpadV2 create

  gang preflight                         check sign-in, Developer Mode, tradeAllTokens, Agent ID
  gang list                              tokens across V2 / Soft / U / S
  gang token --token <addr>              one token (auto-resolves pad)
  gang quote --token <addr> --bnb <n>    Soft: BNB quote; V2/U/S: quote-token amount (same flag)
  gang buy --token <addr> --bnb <n> [--slippage 1]      Soft: payable BNB; V2: approve quote then buy
  gang sell --token <addr> (--amount <tokens> | --all) [--slippage 1]
  gang upload-logo --file <path>         POST image → https://gang.fun/api/logos → logoUrl
  gang create --name <n> --symbol <s> [--logo-uri URL | --logo <file>] [--taxed] [--pair-or-quote 0x…]
                                         LaunchpadV2 ONLY (${ADDR.v2}); Soft/U/S create refused
  gang execute --request-id <id>         broadcast a previewed call
  gang tx --hash <0x..>                  wait for receipt and decode Gang events

Logo UI (browser): ${LOGO_UI}
env: GANG_LAUNCHPAD (default V2 ${ADDR.v2}), GANG_RPC_URL, GANG_LOGO_API`

function summarizePreview(p, extra = {}) {
  if (!p.success) return { success: false, step: extra.step, error: p.error }
  const d = p.data
  const changes = (d.simulationResult?.balanceChanges || []).map((b) => ({ token: b.contractAddress, type: b.tokenType, change: b.change }))
  return {
    success: true, ...extra,
    requestId: d.requestId, expiresAt: d.expiresAt,
    requireConfirmation: d.requireConfirmation,
    risks: d.risks?.riskDetails || [],
    simulatedChanges: changes,
    next: `gang execute --request-id ${d.requestId}`,
  }
}

async function resolveLogoUri() {
  const uri = opt('logo-uri')
  const file = opt('logo') || opt('logo-file') || opt('file-logo')
  if (uri && file) fail('use either --logo-uri or --logo/--logo-file, not both')
  if (uri) return { logoURI: uri, uploaded: false }
  if (file) {
    const up = await uploadLogoFile(file)
    return { logoURI: up.logoUrl, uploaded: true, upload: up }
  }
  return { logoURI: '', uploaded: false }
}

async function main() {
  switch (cmd) {
    case 'preflight': {
      const issues = []
      const status = bawStatus()
      if (status !== 'CONNECTED') issues.push({ code: 'NOT_SIGNED_IN', fix: 'Run `baw auth signin` and confirm in the Binance App.' })
      let me = null, settings = null, agent = false
      if (status === 'CONNECTED') {
        me = bawAddress(); settings = bawSettings()
        if (!settings.devMode?.enabled) issues.push({ code: 'DEV_MODE_OFF', fix: 'Enable Developer Mode in Binance App → Agentic Wallet settings.' })
        if (!settings.tradeAllTokens) issues.push({ code: 'TRADE_ALL_TOKENS_OFF', fix: 'Enable "Trade all tokens" in Binance App → Agentic Wallet settings, otherwise SELLING Gang tokens is blocked by risk control (buying still works).' })
        agent = await isAgent(me)
        if (!agent) issues.push({ code: 'NO_AGENT_ID', fix: 'Claim a .ai Agent ID in Binance Wallet (Agent ID banner). Gang only lets Agent ID holders buy/create.' })
      }
      return out({
        success: issues.length === 0, status, address: me,
        launchpad: CONFIG.launchpad, createPad: ADDR.v2, isAgent: agent,
        devMode: settings?.devMode?.enabled ?? null, tradeAllTokens: settings?.tradeAllTokens ?? null, issues,
        note: 'New create → LaunchpadV2 only (~15 BNB graduation). Soft/U/S: existing buy/sell/claim only.',
      })
    }
    case 'list': {
      const me = bawStatus() === 'CONNECTED' ? bawAddress() : undefined
      return out({ success: true, createPad: ADDR.v2, tokens: await listTokens(me) })
    }
    case 'token': {
      const token = opt('token'); if (!token) fail('--token required')
      const me = bawStatus() === 'CONNECTED' ? bawAddress() : undefined
      return out({ success: true, ...(await tokenInfo(token, me)) })
    }
    case 'quote': {
      const token = opt('token'), bnb = opt('bnb'); if (!token || !bnb) fail('--token and --bnb required (Soft archive: BNB; V2: quote ERC-20 amount)')
      const me = bawAddress()
      const q = await quoteBuy(token, me, bnb)
      return out({
        success: true, token, buyer: me, pad: q.pad, kind: q.kind, quote: q.quote,
        quotePath: q.quotePath, deterministic: q.deterministic || false,
        tokensOut: q.tokensOutFmt, spent: q.spentFmt, fee: q.feeFmt, refund: q.refundFmt, unit: q.unit,
        note: q.refund > 0n
          ? 'Part of the input would be refunded (wallet 1% cap or graduation cap).'
          : (q.deterministic ? 'V2 quote = LaunchpadV2.sol curve math (unique path; no Soft/U/S fallback).' : undefined),
      })
    }
    case 'buy': {
      const token = opt('token'), bnb = opt('bnb'); if (!token || !bnb) fail('--token and --bnb required')
      const slippage = parseSlippage(opt('slippage', '1'))
      const me = bawAddress()
      const info = await tokenInfo(token, me)
      if (info.graduated) fail('token already graduated; trade it on PancakeSwap', { pair: info.pair })
      if (!(await isAgent(me))) fail('this wallet holds no Agent ID (.ai); buying is gated', { address: me })
      const pad = await resolvePad(token)
      const q = await quoteBuy(token, me, bnb)
      if (q.tokensOut === 0n) fail('wallet cap reached or zero out', { myBalance: info.myBalance })
      const minOut = (q.tokensOut * BigInt(Math.round((100 - slippage) * 100))) / 10000n

      if (pad.kind === 'soft') {
        const data = calldata.softBuy(token, minOut)
        const p = bawPreview({ from: me, to: pad.address, value: parseEther(bnb), data })
        return out(summarizePreview(p, {
          step: 'buy', kind: 'soft', token, symbol: info.symbol, pad: pad.id,
          bnbSent: bnb, expectTokens: q.tokensOutFmt, expectSpent: q.spentFmt, fee: q.feeFmt,
          expectRefund: q.refundFmt, minTokensOut: fmtTok(minOut),
        }))
      }

      // V2 / U / S: quote ERC-20 approve then buy(token, quoteIn, minTokensOut)
      const quoteIn = parseEther(bnb)
      const allow = await allowance(info.quote, me, pad.address)
      if (allow < quoteIn) {
        const p = bawPreview({ from: me, to: info.quote, data: calldata.approve(pad.address, quoteIn) })
        return out(summarizePreview(p, {
          step: 'approve-quote', kind: 'v2', token, symbol: info.symbol, pad: pad.id, quote: info.quote,
          amount: bnb, note: 'Approve quote ERC-20 first. After it confirms, re-run the same `gang buy` to preview the buy.',
        }))
      }
      const data = calldata.v2Buy(token, quoteIn, minOut)
      const p = bawPreview({ from: me, to: pad.address, data })
      return out(summarizePreview(p, {
        step: 'buy', kind: 'v2', token, symbol: info.symbol, pad: pad.id, quote: info.quote,
        quoteIn: bnb, expectTokens: q.tokensOutFmt, expectSpent: q.spentFmt, fee: q.feeFmt,
        expectRefund: q.refundFmt, minTokensOut: fmtTok(minOut), quotePath: q.quotePath, deterministic: q.deterministic || false,
      }))
    }
    case 'sell': {
      const token = opt('token'); if (!token) fail('--token required')
      const me = bawAddress()
      const info = await tokenInfo(token, me)
      if (info.graduated) fail('token already graduated; sell on PancakeSwap', { pair: info.pair })
      const bal = await balanceOf(token, me)
      if (bal === 0n) fail('no balance to sell')
      if (!flag('all') && !opt('amount')) fail('pass --amount <tokens> or --all (full sell is no longer the default)')
      if (flag('all') && opt('amount')) fail('use either --all or --amount, not both')
      const amount = flag('all') ? bal : parseEther(opt('amount'))
      if (amount > bal) fail('amount exceeds balance', { balance: fmtTok(bal) })
      const pad = await resolvePad(token)
      const allow = await allowance(token, me, pad.address)
      if (allow < amount) {
        const p = bawPreview({ from: me, to: token, data: calldata.approve(pad.address, amount) })
        return out(summarizePreview(p, {
          step: 'approve', token, symbol: info.symbol, pad: pad.id, amount: fmtTok(amount),
          note: 'Approve first. After it confirms on-chain, run the same `gang sell` again to preview the sell.',
        }))
      }
      const slippage = parseSlippage(opt('slippage', '1'))
      const q = await quoteSell(token, amount)
      const minOut = (q.out * BigInt(Math.round((100 - slippage) * 100))) / 10000n
      if (pad.kind === 'soft') {
        const p = bawPreview({ from: me, to: pad.address, data: calldata.softSell(token, amount, minOut) })
        return out(summarizePreview(p, {
          step: 'sell', kind: 'soft', token, symbol: info.symbol, pad: pad.id,
          amount: fmtTok(amount), expectOut: q.outFmt, fee: q.feeFmt, minOut: fmt(minOut), unit: 'BNB',
        }))
      }
      const p = bawPreview({ from: me, to: pad.address, data: calldata.v2Sell(token, amount, minOut) })
      return out(summarizePreview(p, {
        step: 'sell', kind: 'v2', token, symbol: info.symbol, pad: pad.id, quote: info.quote,
        amount: fmtTok(amount), expectOut: q.outFmt, fee: q.feeFmt, minOut: fmt(minOut), unit: 'quote', quotePath: q.quotePath, deterministic: q.deterministic || false,
      }))
    }
    case 'upload-logo': {
      const file = opt('file') || opt('path') || opt('logo')
      if (!file) fail('--file <path> required (png/jpeg/webp/gif ≤512KB)')
      const up = await uploadLogoFile(file)
      return out({ success: true, ...up, ui: LOGO_UI, next: `gang create --name … --symbol … --logo-uri ${up.logoUrl}` })
    }
    case 'create': {
      const name = opt('name'), symbol = opt('symbol'); if (!name || !symbol) fail('--name and --symbol required')
      try { assertCreateTarget(CONFIG.launchpad) } catch (e) { fail(e.message) }
      const me = bawAddress()
      if (!(await isAgent(me))) fail('this wallet holds no Agent ID (.ai); create is gated', { address: me })
      const logo = await resolveLogoUri()
      const taxed = flag('taxed')
      const pairOrQuote = opt('pair-or-quote') || opt('pair') || zeroAddress
      if (taxed && (!pairOrQuote || pairOrQuote === zeroAddress)) {
        fail('--taxed requires --pair-or-quote <pair or quote CA>')
      }
      const data = calldata.createV2(name, symbol, logo.logoURI, taxed, pairOrQuote)
      const p = bawPreview({ from: me, to: ADDR.v2, data })
      return out(summarizePreview(p, {
        step: 'create', pad: 'v2', launchpad: ADDR.v2, name, symbol,
        logoURI: logo.logoURI || '(empty)', uploaded: logo.uploaded, upload: logo.upload,
        taxed, pairOrQuote,
        note: 'LaunchpadV2 only. Graduation ≈15 BNB (PoolCheck). No creation fee. Soft/U/S create archived. After execute: `gang tx --hash …` for Created.',
      }))
    }
    case 'execute': {
      const id = opt('request-id'); if (!id) fail('--request-id required')
      const r = bawExecute(id)
      if (!r.success) return out({ success: false, error: r.error })
      const d = r.data
      const pending = d.status === 'PENDING_CONFIRMATION'
      return out({
        success: true, status: d.status, txHash: d.txHash, orderId: d.orderId, pendingConfirmation: pending,
        next: pending
          ? 'Ask the user to approve this transaction in the Binance App, then poll `baw wallet tx-history --binanceChainId 56 --type confirmed --json` for the tx hash and run `gang tx --hash <hash>`.'
          : (d.txHash ? `gang tx --hash ${d.txHash}` : undefined),
      })
    }
    case 'tx': {
      const hash = opt('hash'); if (!hash) fail('--hash required')
      return out({ success: true, ...(await decodeTx(hash)) })
    }
    default:
      console.log(HELP); process.exit(cmd ? 1 : 0)
  }
}

main().catch((e) => fail(e.message))
