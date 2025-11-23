# FriendWithBets

**FriendWithBets is a permissionless prediction market platform on Celo that enables users to create YES/NO betting markets and wager on outcomes with friends using ERC20 tokens, resolved through off-chain oracles.**

## Project Description

FriendWithBets is a decentralized prediction market built on Celo blockchain that allows anyone to create and participate in YES/NO betting markets. Users can create markets on any topic, place wagers using ERC20 tokens, and automatically receive payouts when markets are resolved through secure off-chain oracle signatures. The platform features a simple, user-friendly interface accessible via Farcaster frames, making it easy to bet on anything with friends in just three taps.

## Celo Integration

FriendWithBets is fully integrated with the Celo blockchain, leveraging Celo's fast, low-cost transactions and mobile-first approach to create an accessible prediction market experience.

### How It Was Integrated

1. **Smart Contract Deployment**: The core `FriendWithBets` contract and `X402Resolver` are deployed on Celo networks (Mainnet and Alfajores testnet) using Foundry deployment scripts. The contracts are optimized for Celo's EVM-compatible environment.

2. **Off-Chain Oracle Integration**: Integrated with VLayer and other off-chain oracle services using EIP-712 typed data signing. The `X402Resolver` contract validates oracle signatures for market resolutions, ensuring secure and trustless outcome determination without requiring on-chain data feeds.

3. **Celo-Specific Features**:
   - Support for Celo's native ERC20 tokens (cUSD, cEUR, CELO)
   - Optimized gas usage for Celo's transaction model
   - Chain ID validation stored at deployment for cross-chain security
   - Full compatibility with Celo's mobile wallet ecosystem

4. **Frontend Integration**: Built a Next.js mini-app that connects to Celo networks, allowing users to interact with the contracts through a modern web interface. The app supports Celo wallet connections and displays market data from on-chain events.

5. **Deployment Infrastructure**: Created deployment scripts specifically for Celo networks with support for both Mainnet (chain ID: 42220) and Alfajores testnet (chain ID: 44787), including verification on Celoscan.

### Key Technical Details

- **Chain IDs**: Mainnet (42220), Alfajores Testnet (44787)
- **RPC Endpoints**: Integrated with Celo's public RPC infrastructure
- **Oracle Signing**: EIP-712 compatible signatures for off-chain resolution
- **Token Support**: Any ERC20 token on Celo can be used for betting

For detailed deployment instructions, see [CELO_DEPLOYMENT.md](./script/CELO_DEPLOYMENT.md).

## Project Structure

```
fwb/
├── contracts/              # Solidity smart contracts
│   ├── FriendWithBets.sol  # Main prediction market contract
│   ├── modules/
│   │   └── X402Resolver.sol # EIP-712 oracle resolver
│   └── interfaces/         # Contract interfaces
├── script/                 # Deployment scripts
│   ├── DeployFWB_Celo.s.sol
│   └── CELO_DEPLOYMENT.md
├── test/                   # Foundry tests
├── mini-app/               # Next.js frontend application
└── github-contribution-verifier/  # VLayer integration example
```

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Node.js and pnpm (for frontend)
- Celo wallet with testnet tokens (for testing)

### Deploy Contracts

```bash
# Deploy to Celo Alfajores testnet
forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo \
  --sig "run(address)" 0x...your_oracle_address \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast \
  -vvvv
```

### Run Tests

```bash
forge test
```

### Start Frontend

```bash
cd mini-app/my-celo-app
pnpm install
pnpm dev
```

## Features

- ✅ Permissionless market creation
- ✅ YES/NO betting with ERC20 tokens
- ✅ Off-chain oracle resolution (VLayer compatible)
- ✅ Automatic payout distribution
- ✅ Farcaster frame integration
- ✅ Mobile-friendly interface
- ✅ Celo network optimized

## Documentation

- [Celo Deployment Guide](./script/CELO_DEPLOYMENT.md) - Detailed deployment instructions
- [VLayer Integration Guide](./contracts/modules/VLAYER_INTEGRATION.md) - Oracle integration documentation

## Team

FriendWithBets is built by a team passionate about decentralized prediction markets and making betting accessible on mobile-first blockchains like Celo.

**Social Handles:**
@englandkiiz, @K_Puddiin


## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
