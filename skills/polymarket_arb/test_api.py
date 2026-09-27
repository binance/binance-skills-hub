import asyncio
import aiohttp
import sys
import io
from decimal import Decimal

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

CONFIG = {
    "yes_token": "114630418675877056005167880118292191110811530401374152347224985858947564591142",
    "no_token": "59403262697376747539529537726139131482773446180764100699311409027718765429884",
}

async def test():
    print("Starting test...")
    async with aiohttp.ClientSession() as session:
        url = f"https://clob.polymarket.com/book?token_id={CONFIG['yes_token']}"
        print(f"Fetching: {url[:80]}...")
        async with session.get(url) as resp:
            print(f"Status: {resp.status}")
            data = await resp.json()
            bids = data.get("bids", [])
            asks = data.get("asks", [])
            print(f"Bids: {len(bids)}, Asks: {len(asks)}")
            if bids:
                print(f"Best Bid: {bids[0]['price']}")
            if asks:
                print(f"Best Ask: {asks[0]['price']}")

if __name__ == "__main__":
    print("Test script starting...")
    asyncio.run(test())
    print("Done!")
