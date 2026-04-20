import asyncio
import aiohttp
import sys
import io
from datetime import datetime, timezone
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def main():
    async with aiohttp.ClientSession() as session:
        # 使用 CLOB API 获取所有市场
        url = "https://clob.polymarket.com/markets?limit=500"
        
        print("Searching for active markets with arbitrage potential...\n")
        
        async with session.get(url) as resp:
            data = await resp.json()
            markets = data.get('data', [])
            
            now = datetime.now(timezone.utc)
            arb_opportunities = []
            
            for m in markets:
                tokens = m.get('tokens', [])
                accepting = m.get('accepting_orders', False)
                question = m.get('question', '')
                
                if not accepting or len(tokens) != 2:
                    continue
                
                # 检查价格总和
                total = sum(t.get('price', 0) for t in tokens)
                
                # 如果总和不等于1，有套利空间
                spread = abs(1 - total)
                
                if spread > 0.005:  # 0.5% 以上
                    arb_opportunities.append({
                        'question': question,
                        'spread': spread,
                        'total': total,
                        'tokens': tokens,
                        'slug': m.get('market_slug'),
                        'condition_id': m.get('condition_id')
                    })
            
            # 按价差排序
            arb_opportunities.sort(key=lambda x: x['spread'], reverse=True)
            
            print(f"Found {len(arb_opportunities)} markets with spread > 0.5%\n")
            
            for i, opp in enumerate(arb_opportunities[:10]):
                print(f"{i+1}. {opp['question']}")
                print(f"   Spread: {opp['spread']*100:.2f}%")
                print(f"   Price Sum: {opp['total']:.4f}")
                for t in opp['tokens']:
                    print(f"   {t['outcome']}: {t['price']}")
                print()
            
            # 保存第一个有套利机会的市场
            if arb_opportunities:
                best = arb_opportunities[0]
                config = {
                    "market": best['question'],
                    "condition_id": best['condition_id'],
                    "spread": best['spread'],
                    "yes_token": best['tokens'][0]['token_id'],
                    "no_token": best['tokens'][1]['token_id'],
                }
                with open(r'C:\Users\Administrator\.openclaw\workspace\polymarket_arb\best_market.json', 'w') as f:
                    json.dump(config, f, indent=2)
                print(f"\nBest opportunity saved to best_market.json")

if __name__ == "__main__":
    asyncio.run(main())
