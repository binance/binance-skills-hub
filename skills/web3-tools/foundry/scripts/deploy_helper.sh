#!/bin/bash

# Load environment variables
if [ -f "/home/ubuntu/usdt-transfer/.env" ]; then
    source /home/ubuntu/usdt-transfer/.env
fi

# Defaults from .env
RPC_URL=${ETH_RPC_URL:-"https://ethereum-rpc.publicnode.com"}
PRIV_KEY=${PRIVATE_KEY:-""}
ETHERSCAN_KEY=${ETHERSCAN_API_KEY:-""}

if [ -z "$PRIV_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not found in .env"
    exit 1
fi

echo "🚀 Foundry Deployment Helper"
echo "---------------------------"
echo "Network RPC: $RPC_URL"
echo "Etherscan Key: (Configured)"

# Example usage hint
echo "💡 To deploy, run:"
echo "forge create --broadcast --rpc-url \$RPC_URL --private-key \$PRIV_KEY src/YourContract.sol:ContractName --verify --etherscan-api-key \$ETHERSCAN_KEY"
