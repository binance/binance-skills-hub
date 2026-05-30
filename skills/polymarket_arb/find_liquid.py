import asyncio
import aiohttp
import sys
import io
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def main():
    async with aiohttp.ClientSession() as session:
        url = "https://gamma-api.polymarket.com/markets?_l=20&_s=liquidity&_sd=desc&closed=false&active=true"
        
        print("Finding markets with highest liquidity...\n")
        
        async with session.get(url) as resp:
            markets = await resp.json()
            
            best_market = None
            
            for i, m in enumerate(markets[:10]):
                question = m.get('question', '')
                liquidity = float(m.get('liquidity', 0) or 0)
                condition_id = m.get('conditionId', '')
                
                print(f"{i+1}. {question[:50]}...")
                print(f"   Liquidity: ${liquidity:,.0f}")
                
                clob_url = f"https://clob.polymarket.com/markets/{condition_id}"
                async with session.get(clob_url) as clob_resp:
                    if clob_resp.status == 200:
                        clob = await clob_resp.json()
                        tokens = clob.get('tokens', [])
                        accepting = clob.get('accepting_orders', False)
                        
                        print(f"   Accepting: {accepting}")
                        
                        if tokens and accepting and len(tokens) == 2:
                            # 检查订单簿
                            has_orders = False
                            for t in tokens:
                                book_url = f"https://clob.polymarket.com/book?token_id={t['token_id']}"
                                async with session.get(book_url) as book_resp:
                                    if book_resp.status == 200:
                                        book = await book_resp.json()
                                        bids = len(book.get('bids', []))
                                        asks = len(book.get('asks', []))
                                        print(f"   {t['outcome']}: {t['token_id'][:50]}...")
                                        print(f"     OrderBook: {bids} bids, {asks} asks")
                                        if bids > 0 or asks > 0:
                                            has_orders = True
                            
                            if has_orders and not best_market:
                                best_market = {
                                    'question': question,
                                    'condition_id': condition_id,
                                    'yes_token': tokens[0]['token_id'],
                                    'no_token': tokens[1]['token_id'],
                                }
                print()
            
            if best_market:
                print("\n" + "="*60)
                print("BEST MARKET FOR TESTING:")
                print("="*60)
                print(json.dumps(best_market, indent=2))
                
                with open(r'C:\Users\Administrator\.openclaw\workspace\polymarket_arb\best_market.json', 'w') as f:
                    json.dump(best_market, f, indent=2)
                print("\nSaved to best_market.json")

if __name__ == "__main__":
    asyncio.run(main())
