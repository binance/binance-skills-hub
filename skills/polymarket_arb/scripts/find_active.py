import asyncio
import aiohttp
import sys
import io
from datetime import datetime, timezone
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def main():
    async with aiohttp.ClientSession() as session:
        # 使用 CLOB API 直接搜索
        # 先获取最近的市场
        url = "https://clob.polymarket.com/markets?limit=100&next_cursor=MA%3D%3D"
        
        print("Searching CLOB API for BTC Up/Down markets...\n")
        
        async with session.get(url) as resp:
            data = await resp.json()
            markets = data.get('data', [])
            
            now = datetime.now(timezone.utc)
            btc_markets = []
            
            for m in markets:
                slug = m.get('market_slug', '')
                question = m.get('question', '')
                
                # 筛选 BTC Up/Down 市场
                if 'btc-updown' in slug.lower() or ('bitcoin' in question.lower() and 'up or down' in question.lower()):
                    tokens = m.get('tokens', [])
                    end_date = m.get('end_date_iso', '')
                    accepting = m.get('accepting_orders', False)
                    
                    try:
                        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                        is_active = end_dt > now
                        status = "ACTIVE" if is_active else "ENDED"
                    except:
                        status = "UNKNOWN"
                        is_active = False
                    
                    print(f"Market: {question}")
                    print(f"  Slug: {slug}")
                    print(f"  Status: {status}, Accepting: {accepting}")
                    print(f"  End: {end_date}")
                    
                    market_info = {
                        'question': question,
                        'slug': slug,
                        'condition_id': m.get('condition_id'),
                        'end_date': end_date,
                        'status': status,
                        'accepting': accepting,
                        'tokens': {}
                    }
                    
                    for t in tokens:
                        outcome = t.get('outcome')
                        token_id = t.get('token_id')
                        price = t.get('price')
                        print(f"  {outcome}: {token_id}")
                        print(f"    Price: {price}")
                        market_info['tokens'][outcome] = token_id
                    
                    if is_active and accepting:
                        btc_markets.append(market_info)
                    print()
            
            if btc_markets:
                with open(r'C:\Users\Administrator\.openclaw\workspace\polymarket_arb\active_btc_markets.json', 'w') as f:
                    json.dump(btc_markets[:5], f, indent=2)
                print(f"\n*** Found {len(btc_markets)} ACTIVE BTC Up/Down markets ***")
                print("Saved to active_btc_markets.json")
            else:
                print("\nNo currently active BTC Up/Down markets found.")
                print("BTC Up/Down markets are short-duration (5-15 min) and may only be active during trading hours.")

if __name__ == "__main__":
    asyncio.run(main())
