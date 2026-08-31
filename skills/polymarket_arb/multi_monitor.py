import asyncio
import aiohttp
import sys
import io
from decimal import Decimal
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ============ 多市场配置 ============
MARKETS = [
    {
        "name": "Russia-Ukraine Ceasefire before GTA VI",
        "yes_token": "8501497159083948713316135768103773293754490207922884688769443031624417212426",
        "no_token": "2527312495175492857904889758552137141356236738032676480522356889996545113869",
    },
    {
        "name": "Will bitcoin hit $1m before GTA VI",
        "yes_token": "105267568073659068217311993901927962476298440625043565106676088842803600775810",
        "no_token": "91863162118308663069733924043159186005106558783397508844234610341221325526200",
    },
    {
        "name": "Will China invade Taiwan before GTA VI",
        "yes_token": "21695138873211375451055566770107682325494206727818897067665810321709249824909",
        "no_token": "17516427576383382756368467656206258206490015951115433065318503962238754362428",
    },
    {
        "name": "Trump out as President before GTA VI",
        "yes_token": "108999723207897941876452935557011604067917389120996960199512481363958770540884",
        "no_token": "64533579809297525579033609963634939501013332859992608996100633472507000251907",
    },
]

CONFIG = {
    "min_spread": 0.003,  # 0.3%
    "check_interval": 5,
}

CLOB_API = "https://clob.polymarket.com"

async def get_price(session, token_id):
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
        pass
    return Decimal("0"), Decimal("1")

async def monitor_market(session, market):
    """监控单个市场"""
    yes_bid, yes_ask = await get_price(session, market["yes_token"])
    no_bid, no_ask = await get_price(session, market["no_token"])
    
    buy_cost = yes_ask + no_ask
    sell_value = yes_bid + no_bid
    spread_buy = Decimal("1") - buy_cost
    spread_sell = sell_value - Decimal("1")
    
    return {
        "name": market["name"][:35],
        "yes": (yes_bid, yes_ask),
        "no": (no_bid, no_ask),
        "buy_cost": buy_cost,
        "sell_value": sell_value,
        "spread_buy": spread_buy,
        "spread_sell": spread_sell,
    }

async def main():
    print("="*70)
    print("Polymarket Multi-Market Arbitrage Monitor")
    print("="*70)
    print(f"Min Spread: {CONFIG['min_spread']*100}% | Markets: {len(MARKETS)}")
    print("="*70)
    print()
    
    async with aiohttp.ClientSession() as session:
        iteration = 0
        while iteration < 20:
            iteration += 1
            now = datetime.now().strftime("%H:%M:%S")
            print(f"[{now}] Round #{iteration}")
            print("-"*70)
            
            for m in MARKETS:
                try:
                    data = await monitor_market(session, m)
                    
                    # 格式化输出
                    print(f"\n{data['name']}...")
                    print(f"  Yes: {float(data['yes'][1]):.3f}/{float(data['yes'][0]):.3f} | No: {float(data['no'][1]):.3f}/{float(data['no'][0]):.3f}")
                    print(f"  Buy: {float(data['buy_cost']):.4f} ({float(data['spread_buy'])*100:+.2f}%) | Sell: {float(data['sell_value']):.4f} ({float(data['spread_sell'])*100:+.2f}%)")
                    
                    # 检查套利
                    if data['spread_buy'] >= Decimal(str(CONFIG["min_spread"])):
                        print(f"  >>> BUY ARB: {float(data['spread_buy'])*100:.2f}% profit! <<<")
                    if data['spread_sell'] >= Decimal(str(CONFIG["min_spread"])):
                        print(f"  >>> SELL ARB: {float(data['spread_sell'])*100:.2f}% profit! <<<")
                        
                except Exception as e:
                    print(f"  Error: {e}")
            
            print("\n" + "="*70 + "\n")
            await asyncio.sleep(CONFIG["check_interval"])
        
        print("Monitoring completed!")

if __name__ == "__main__":
    asyncio.run(main())
