#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Polymarket 内部套利机器人
监控 BTC 5分钟涨跌市场，发现价差自动交易
"""

import asyncio
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import aiohttp
import json
from datetime import datetime
from decimal import Decimal, ROUND_DOWN
from typing import Optional, Dict, List
import os

# ============ 配置 ============
CONFIG = {
    "min_spread": 0.02,        # 最小套利空间 2%
    "trade_size": 10,          # 每次交易金额 (USDC)
    "check_interval": 5,       # 检查间隔 (秒)
    "dry_run": True,           # True = 只监控不交易, False = 实际交易
    "markets": [
        # Polymarket BTC 5分钟市场
        {
            "name": "BTC 5min Up/Down - March 3, 10:05AM ET",
            "condition_id": "0x4fe7d9a9ad8cee0b12d213fd7c003a746031326367ad0d74fde9c4711f90a994",
            "yes_token": "114630418675877056005167880118292191110811530401374152347224985858947564591142",  # Up
            "no_token": "59403262697376747539529537726139131482773446180764100699311409027718765429884",   # Down
        }
    ]
}

# Polymarket CLOB API
CLOB_API = "https://clob.polymarket.com"
POLYGON_RPC = "https://polygon-rpc.com"

class PolymarketArbBot:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.wallet_address = os.getenv("POLYMARKET_WALLET")
        self.private_key = os.getenv("POLYMARKET_PRIVATE_KEY")
        
    async def init(self):
        self.session = aiohttp.ClientSession()
        
    async def close(self):
        if self.session:
            await self.session.close()
    
    async def get_orderbook(self, token_id: str) -> Dict:
        """获取订单簿"""
        url = f"{CLOB_API}/book?token_id={token_id}"
        try:
            async with self.session.get(url) as resp:
                if resp.status == 200:
                    return await resp.json()
        except Exception as e:
            print(f"[ERROR] 获取订单簿失败: {e}")
        return {}
    
    async def get_best_prices(self, token_id: str) -> tuple:
        """获取最佳买卖价格"""
        book = await self.get_orderbook(token_id)
        
        best_bid = Decimal("0")  # 最高买价
        best_ask = Decimal("1")  # 最低卖价
        
        if book.get("bids"):
            best_bid = Decimal(book["bids"][0]["price"])
        if book.get("asks"):
            best_ask = Decimal(book["asks"][0]["price"])
            
        return best_bid, best_ask
    
    async def find_arbitrage(self, yes_token: str, no_token: str) -> Optional[Dict]:
        """
        寻找内部套利机会
        原理: Yes + No 价格和 < 1 时可套利
        """
        yes_bid, yes_ask = await self.get_best_prices(yes_token)
        no_bid, no_ask = await self.get_best_prices(no_token)
        
        # 买入成本 = 买入Yes + 买入No
        buy_cost = yes_ask + no_ask
        
        # 如果成本 < 1，有套利空间
        spread = Decimal("1") - buy_cost
        
        if spread > Decimal(str(CONFIG["min_spread"])):
            return {
                "yes_price": float(yes_ask),
                "no_price": float(no_ask),
                "spread": float(spread),
                "spread_pct": float(spread * 100),
                "buy_yes": True,
                "buy_no": True,
            }
        
        # 检查另一种情况：卖出获利
        # 如果 Yes + No 卖出价格 > 1，也可以套利（但需要持有代币）
        sell_value = yes_bid + no_bid
        if sell_value > Decimal("1"):
            spread = sell_value - Decimal("1")
            if spread > Decimal(str(CONFIG["min_spread"])):
                return {
                    "yes_price": float(yes_bid),
                    "no_price": float(no_bid),
                    "spread": float(spread),
                    "spread_pct": float(spread * 100),
                    "buy_yes": False,
                    "buy_no": False,
                }
        
        return None
    
    async def place_order(self, token_id: str, side: str, price: float, size: float) -> bool:
        """
        下单
        注意：实际交易需要签名，这里只是框架
        """
        if CONFIG["dry_run"]:
            print(f"  [DRY RUN] {side} {size} @ {price:.4f}")
            return True
            
        # 实际交易逻辑需要：
        # 1. 构建订单 (EIP-712 签名)
        # 2. 提交到 CLOB API
        # 需要使用 py_clob_client 或手动实现
        
        url = f"{CLOB_API}/order"
        payload = {
            "token_id": token_id,
            "side": side,  # "BUY" or "SELL"
            "price": str(price),
            "size": str(size),
            # ... 签名等其他字段
        }
        
        print(f"  [TRADE] {side} {size} @ {price:.4f}")
        # TODO: 实现实际交易
        return False
    
    async def execute_arbitrage(self, arb: Dict, yes_token: str, no_token: str):
        """执行套利"""
        trade_size = CONFIG["trade_size"]
        
        print(f"\n{'='*50}")
        print(f"[ARBITRAGE] 发现套利机会！")
        print(f"  Yes 价格: {arb['yes_price']:.4f}")
        print(f"  No  价格: {arb['no_price']:.4f}")
        print(f"  价差: {arb['spread_pct']:.2f}%")
        print(f"  预计利润: ${trade_size * arb['spread']:.2f}")
        print(f"{'='*50}\n")
        
        if arb["buy_yes"] and arb["buy_no"]:
            # 同时买入两边
            await self.place_order(yes_token, "BUY", arb["yes_price"], trade_size)
            await self.place_order(no_token, "BUY", arb["no_price"], trade_size)
    
    async def monitor_market(self, market: Dict):
        """监控单个市场"""
        if not market.get("yes_token") or not market.get("no_token"):
            print(f"[WARN] 市场 {market['name']} 缺少 token 地址，跳过")
            return
            
        while True:
            try:
                arb = await self.find_arbitrage(
                    market["yes_token"],
                    market["no_token"]
                )
                
                if arb:
                    await self.execute_arbitrage(
                        arb,
                        market["yes_token"],
                        market["no_token"]
                    )
                else:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] {market['name']} - 无套利机会")
                    
            except Exception as e:
                print(f"[ERROR] 监控异常: {e}")
            
            await asyncio.sleep(CONFIG["check_interval"])
    
    async def search_btc_markets(self) -> List[Dict]:
        """搜索 BTC 相关市场"""
        url = f"{CLOB_API}/markets"
        params = {"text": "bitcoin btc"}
        
        try:
            async with self.session.get(url, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data
        except Exception as e:
            print(f"[ERROR] 搜索市场失败: {e}")
        return []
    
    async def run(self):
        """主运行循环"""
        await self.init()
        
        print("="*60)
        print("🤖 Polymarket 内部套利机器人")
        print(f"   最小价差: {CONFIG['min_spread']*100}%")
        print(f"   交易金额: ${CONFIG['trade_size']}")
        print(f"   模式: {'模拟运行' if CONFIG['dry_run'] else '实盘交易'}")
        print("="*60)
        print()
        
        # 直接监控已配置的市场
        tasks = []
        for market in CONFIG["markets"]:
            if market.get("yes_token"):
                print(f"📊 监控市场: {market['name']}")
                task = asyncio.create_task(self.monitor_market(market))
                tasks.append(task)
        
        if not tasks:
            print("\n[WARN] 没有配置具体市场的 token 地址")
            print("请先获取 BTC 5分钟市场的 token IDs，填入 CONFIG")
        
        if tasks:
            await asyncio.gather(*tasks)
        
        await self.close()


async def main():
    bot = PolymarketArbBot()
    await bot.run()


if __name__ == "__main__":
    asyncio.run(main())
