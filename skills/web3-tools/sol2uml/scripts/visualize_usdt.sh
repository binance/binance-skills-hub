#!/bin/bash
if [ -f "/home/ubuntu/usdt-transfer/.env" ]; then
    source /home/ubuntu/usdt-transfer/.env
fi
ETHERSCAN_KEY=${ETHERSCAN_API_KEY:-""}
USDT_ADDRESS="0xdAC17F958D2ee523a2206206994597C13D831ec7"
if [ -z "$ETHERSCAN_KEY" ]; then
    echo "❌ Error: ETHERSCAN_API_KEY not found in .env"
    exit 1
fi
echo "🎨 Generating UML Class Diagram for USDT..."
sol2uml class $USDT_ADDRESS --network mainnet --apiKey $ETHERSCAN_KEY -f png -o usdt_class.png
echo "📦 Generating Storage Layout for USDT..."
sol2uml storage $USDT_ADDRESS --network mainnet --apiKey $ETHERSCAN_KEY -f png -o usdt_storage.png
echo "✅ Done! Files generated: usdt_class.png, usdt_storage.png"
