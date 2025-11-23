# Celo Deployment Guide

This guide explains how to deploy FriendWithBets contracts to Celo networks using Foundry.

## Prerequisites

1. **Foundry installed**: Follow [Foundry installation guide](https://book.getfoundry.sh/getting-started/installation)
2. **Celo network access**: Ensure you have access to Celo Mainnet or Alfajores testnet
3. **Private key**: Your deployer wallet's private key
4. **Oracle address**: The address that will sign market resolutions

## Environment Setup

The deployment script requires an oracle address as a parameter. You can pass it directly or use environment variables.

**⚠️ Security Warning**: Never commit your private keys to version control!

## Network Configuration

### Celo Mainnet
- Chain ID: `42220`
- RPC URL: `https://forno.celo.org` (public) or use your own node
- Explorer: https://celoscan.io

### Celo Alfajores (Testnet)
- Chain ID: `44787`
- RPC URL: `https://alfajores-forno.celo-testnet.org`
- Explorer: https://alfajores.celoscan.io
- Faucet: https://faucet.celo.org/alfajores

## Deployment Commands

Replace `0x...your_oracle_address` with your actual oracle address that will sign market resolutions.

### Deploy to Celo Mainnet

```bash
forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo \
  --sig "run(address)" 0x...your_oracle_address \
  --rpc-url https://forno.celo.org \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_CELOSCAN_API_KEY \
  -vvvv
```

### Deploy to Celo Alfajores (Testnet)

```bash
forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo \
  --sig "run(address)" 0x...your_oracle_address \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_CELOSCAN_API_KEY \
  -vvvv
```

### Deploy without verification

```bash
forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo \
  --sig "run(address)" 0x...your_oracle_address \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast \
  -vvvv
```

### Simulate deployment (dry run)

```bash
forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo \
  --sig "run(address)" 0x...your_oracle_address \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  -vvvv
```

## What Gets Deployed

1. **X402Resolver**: EIP-712 compatible resolver that validates oracle signatures
   - Requires: Oracle address (passed as parameter to `run()`)
   
2. **FriendWithBets**: Main prediction market contract
   - No constructor parameters required

## Post-Deployment

After deployment, you'll receive:
- `X402Resolver` contract address
- `FriendWithBets` contract address

Save these addresses for your frontend/application integration.

## Verification

If you used the `--verify` flag, contracts will be automatically verified on Celoscan. Otherwise, you can manually verify:

```bash
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> \
  --chain-id 44787 \
  --etherscan-api-key YOUR_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" <ORACLE_ADDRESS>)
```

## Troubleshooting

### Insufficient funds
- Ensure your deployer wallet has enough CELO to cover gas costs
- For testnet, use the faucet: https://faucet.celo.org/alfajores

### Oracle address not set
- Make sure you pass a valid oracle address as a parameter
- The oracle address cannot be the zero address (0x0000...)

### Network connection issues
- Try using a different RPC endpoint
- Check your internet connection
- Verify the RPC URL is correct for your target network

## Example Usage

```bash
# Deploy to Alfajores with oracle address
forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo \
  --sig "run(address)" 0x1234567890123456789012345678901234567890 \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast \
  -vvvv
```

### Using Environment Variables (Optional)

If you prefer to use environment variables, you can set them and reference in the command:

```bash
export ORACLE_ADDRESS=0x1234567890123456789012345678901234567890

forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo \
  --sig "run(address)" $ORACLE_ADDRESS \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast \
  -vvvv
```

