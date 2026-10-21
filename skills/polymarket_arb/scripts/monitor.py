import asyncio
import aiohttp
import sys
import io
from decimal import Decimal
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ============ 配置 ============
CONFIG = {
    "min_spread": 0.005,       # 最小套利空间 0.5%
    "trade_size": 10,          # 每次交易金额 (USDC)
    "check_interval": 3,       # 检查间隔 (秒)
    "dry_run": True,           # True = 只监控不交易
    # BitBoy convicted 市场 (有流动性)
    "yes_token": "75467129615908319583031474642658885479135630431889036121812713428992454630178",
    "no_token": "3842963720267267286970642336860752782302644680156535061700039388405652129691",
}

CLOB_API = "https://clob.polymarket.com"

async def get_price(session, token_id):
    """获取订单簿最佳价格"""
    url = f"{CLOB_API}/book?token_id={token_id}"
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status == 200:
                data = await resp.json()
                bids = data.get("bids", [])
                asks = data.get("asks", [])
                
                best_bid = Decimal(bids[0]["price"]) if bids else Decimal("0")
                best_ask = Decimal(asks[0]["price"]) if asks else Decimal("1")
                
                return best_bid, best_ask
    except Exception as e:
        print(f"[ERROR] get_price: {e}")
    return Decimal("0"), Decimal("1")

async def check_arbitrage():
    """检查套利机会"""
    print("="*60)
    print("Polymarket Internal Arbitrage Monitor")
    print("Market: BitBoy convicted?")
    print("="*60)
    print(f"Min Spread: {CONFIG['min_spread']*100}%")
    print(f"Trade Size: ${CONFIG['trade_size']}")
    print(f"Mode: {'DRY RUN' if CONFIG['dry_run'] else 'LIVE TRADING'}")
    print("="*60)
    print()
    
    async with aiohttp.ClientSession() as session:
        iteration = 0
        while iteration < 10:
            iteration += 1
            try:
                yes_bid, yes_ask = await get_price(session, CONFIG["yes_token"])
                no_bid, no_ask = await get_price(session, CONFIG["no_token"])
                
                buy_cost = yes_ask + no_ask
                sell_value = yes_bid + no_bid
                
                spread_buy = Decimal("1") - buy_cost
                spread_sell = sell_value - Decimal("1")
                
                now = datetime.now().strftime("%H:%M:%S")
                
                print(f"[{now}] #{iteration}")
                print(f"  Yes: Buy={float(yes_ask):.4f} | Sell={float(yes_bid):.4f}")
                print(f"  No:  Buy={float(no_ask):.4f} | Sell={float(no_bid):.4f}")
                print(f"  Buy Cost:  {float(buy_cost):.4f} (Spread: {float(spread_buy)*100:+.3f}%)")
                print(f"  Sell Value: {float(sell_value):.4f} (Spread: {float(spread_sell)*100:+.3f}%)")
                
                if spread_buy >= Decimal(str(CONFIG["min_spread"])):
                    profit = CONFIG["trade_size"] * float(spread_buy)
                    print(f"\n  *** BUY ARBITRAGE! Profit: ${profit:.2f} ***\n")
                
                if spread_sell >= Decimal(str(CONFIG["min_spread"])):
                    profit = CONFIG["trade_size"] * float(spread_sell)
                    print(f"\n  *** SELL ARBITRAGE! Profit: ${profit:.2f} ***\n")
                
                print()
                
            except Exception as e:
                print(f"[ERROR] {e}")
            
            await asyncio.sleep(CONFIG["check_interval"])
        
        print("Test completed!")

if __name__ == "__main__":
    asyncio.run(check_arbitrage())
