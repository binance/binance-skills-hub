import json
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\Administrator\.openclaw\workspace\polymarket_arb\markets.json', 'r', encoding='utf-8') as f:
    content = f.read()
    data = json.loads(content)

markets = data.get('data', [])

print("Searching for Bitcoin-related markets...\n")

btc_markets = []
for m in markets:
    slug = m.get('market_slug', '')
    question = m.get('question', '').lower()
    
    # Find Bitcoin related markets
    if 'bitcoin' in question or 'btc' in slug or 'updown' in slug:
        tokens = m.get('tokens', [])
        condition_id = m.get('condition_id', '')
        
        print(f"\n> {m.get('question')}")
        print(f"   Slug: {slug}")
        
        for t in tokens:
            outcome = t.get('outcome', 'Unknown')
            token_id = t.get('token_id', 'N/A')
            print(f"   {outcome} Token: {token_id}")
        
        btc_markets.append({
            'question': m.get('question'),
            'slug': slug,
            'condition_id': condition_id,
            'tokens': {t.get('outcome'): t.get('token_id') for t in tokens}
        })

print(f"\n\nFound {len(btc_markets)} Bitcoin-related markets")

# Save to file
if btc_markets:
    with open(r'C:\Users\Administrator\.openclaw\workspace\polymarket_arb\btc_markets.json', 'w', encoding='utf-8') as f:
        json.dump(btc_markets[:10], f, indent=2, ensure_ascii=False)
    print(f"Saved first 10 to btc_markets.json")
