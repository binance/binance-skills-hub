import asyncio
import aiohttp
import sys
import io
from datetime import datetime, timezone
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def main():
    async with aiohttp.ClientSession() as session:
        url = "https://clob.polymarket.com/markets?limit=100"
        
        print("Checking active markets and their prices...\n")
        
        async with session.get(url) as resp:
            data = await resp.json()
            markets = data.get('data', [])
            
            active_count = 0
            
            for m in markets[:50]:
                tokens = m.get('tokens', [])
                accepting = m.get('accepting_orders', False)
                question = m.get('question', '')
                
                if not accepting or len(tokens) < 2:
                    continue
                
                active_count += 1
                
                # 计算价格总和
                total = sum(t.get('price', 0) for t in tokens)
                spread = 1 - total
                
                print(f"{active_count}. {question[:60]}...")
                print(f"   Spread: {spread*100:+.2f}% | Sum: {total:.4f}")
                for t in tokens:
                    print(f"   {t['outcome']}: {t['price']:.4f}")
                print()
                
                if active_count >= 15:
                    break
            
            print(f"\nTotal active markets checked: {active_count}")

if __name__ == "__main__":
    asyncio.run(main())
