import asyncio
import aiohttp
import sys
import io
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def main():
    async with aiohttp.ClientSession() as session:
        # 检查一个市场的订单簿
        token_id = "8501497159083948713316135768103773293754490207922884688769443031624417212426"
        url = f"https://clob.polymarket.com/book?token_id={token_id}"
        
        async with session.get(url) as resp:
            data = await resp.json()
            
            print("OrderBook Structure:")
            print("="*60)
            
            bids = data.get("bids", [])
            asks = data.get("asks", [])
            
            print(f"Bids (buy orders): {len(bids)}")
            if bids:
                print("Top 3:")
                for b in bids[:3]:
                    print(f"  Price: {b['price']}, Size: {b['size']}")
            
            print(f"\nAsks (sell orders): {len(asks)}")
            if asks:
                print("Top 3:")
                for a in asks[:3]:
                    print(f"  Price: {a['price']}, Size: {a['size']}")
            
            print("\n" + "="*60)
            print("Interpretation:")
            if bids:
                print(f"  Best bid (highest buy): {bids[0]['price']} = someone will pay this much")
            if asks:
                print(f"  Best ask (lowest sell): {asks[0]['price']} = someone will sell for this much")

if __name__ == "__main__":
    asyncio.run(main())
