import requests

def get_trending_tokens():
    # 1. Fetch Data: Conexión a la API pública de Binance
    url = "https://api.binance.com/api/v3/ticker/24hr"
    try:
        response = requests.get(url)
        data = response.json()
        
        # 2. Filter & Sort: Filtrar pares USDT y ordenar por volumen (quoteVolume)
        usdt_pairs = [item for item in data if item['symbol'].endswith('USDT')]
        usdt_pairs.sort(key=lambda x: float(x['quoteVolume']), reverse=True)
        
        # Tomar el Top 5
        top_5 = usdt_pairs[:5]
        
        # 3. Format Output: Formatear la salida de texto
        result = "🚀 **Satoshi Trend Tracker - Top 5 USDT Pairs by 24h Volume** 🚀\n\n"
        for token in top_5:
            symbol = token['symbol']
            price = float(token['lastPrice'])
            change = float(token['priceChangePercent'])
            
            # Dar formato al porcentaje con signo positivo/negativo
            result += f"🔹 **{symbol}**: ${price:.4f} ({change:+.2f}%)\n"
            
        # 4. Risk Warning: Advertencia de riesgo estricta
        result += "\n⚠️ *Risk Warning: Cryptocurrency trading is subject to high market risk. Please make your trades cautiously. This bot does not provide financial advice.*"
        
        return result
        
    except Exception as e:
        return f"Error fetching data from Binance Alpha API: {e}"

# Ejecutar la función
if __name__ == "__main__":
    print(get_trending_tokens())
