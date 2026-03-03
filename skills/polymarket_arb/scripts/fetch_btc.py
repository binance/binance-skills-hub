import asyncio
import aiohttp
import json

async def get_token_ids():
    async with aiohttp.ClientSession() as session:
        # First get the 5-minute market data
        url = "https://gamma-api.polymarket.com/events?slug=btc-updown-5m-1772550300"
        
        async with session.get(url) as resp:
            data = await resp.json()
            event = data[0]
            market = event['markets'][0]
            condition_id = market['conditionId']
            
            print("="*60)
            print("Bitcoin Up or Down - 5 Minute Market")
            print("="*60)
            print(f"Question: {market['question']}")
            print(f"Condition ID: {condition_id}")
            print(f"End Date: {market.get('endDate', 'N/A')}")
            print()
            
        # Now get the CLOB token IDs using the condition ID
        clob_url = f"https://clob.polymarket.com/markets/{condition_id}"
        
        async with session.get(clob_url) as resp:
            if resp.status == 200:
                clob_data = await resp.json()
                print("CLOB Market Data:")
                print(json.dumps(clob_data, indent=2))
            else:
                print(f"CLOB API error: {resp.status}")
                
        # Try getting by slug
        clob_url2 = "https://clob.polymarket.com/markets?slug=btc-updown-5m-1772550300"
        print(f"\n\nTrying CLOB by slug: {clob_url2}")
        
        async with session.get(clob_url2) as resp:
            if resp.status == 200:
                clob_data = await resp.json()
                markets = clob_data.get('data', clob_data) if isinstance(clob_data, dict) else clob_data
                if markets:
                    m = markets[0] if isinstance(markets, list) else markets
                    tokens = m.get('tokens', [])
                    
                    print("\n" + "="*60)
                    print("TOKEN IDs FOR ARBITRAGE SCRIPT:")
                    print("="*60)
                    for t in tokens:
                        outcome = t.get('outcome', 'Unknown')
                        token_id = t.get('token_id', 'N/A')
                        print(f"{outcome}: {token_id}")
                    
                    # Save to file
                    result = {
                        "market": m.get('question'),
                        "condition_id": m.get('condition_id'),
                        "tokens": {t.get('outcome'): t.get('token_id') for t in tokens}
                    }
                    
                    with open(r'C:\Users\Administrator\.openclaw\workspace\polymarket_arb\btc_5m_tokens.json', 'w') as f:
                        json.dump(result, f, indent=2)
                    print(f"\nSaved to btc_5m_tokens.json")

if __name__ == "__main__":
    asyncio.run(get_token_ids())
