# VLayer Off-Chain Oracle Integration Guide

This guide explains how to integrate the `X402Resolver` with VLayer or other off-chain oracle services.

## Overview

The `X402Resolver` contract uses EIP-712 typed data signing to verify market resolutions signed by off-chain oracles. This allows oracles like VLayer to sign resolutions off-chain, and the contract verifies these signatures on-chain.

## Contract Architecture

### Key Components

1. **EIP-712 Domain**: Uses standard EIP-712 domain with:
   - Name: `"X402Resolver"`
   - Version: `"1"`
   - Chain ID: Set at deployment (stored in contract)
   - Verifying Contract: The resolver contract address

2. **Resolution Structure**:
   ```solidity
   struct Resolution {
       uint256 marketId;
       uint8 result;      // 1 = YES, 2 = NO
       uint64 resolvedAt; // Unix timestamp
   }
   ```

3. **Data Format**: When calling `resolveMarket()`, the `data` parameter should be:
   ```solidity
   abi.encode(uint64 resolvedAt, bytes signature)
   ```

## Off-Chain Signing Process

### Step 1: Prepare Resolution Data

```typescript
const resolution = {
  marketId: 1n,           // BigInt market ID
  result: 1,              // 1 = YES, 2 = NO
  resolvedAt: Math.floor(Date.now() / 1000) // Unix timestamp
};
```

### Step 2: Get Domain Separator

Call the contract's `getDomainSeparator()` function to get the domain separator, or construct it manually:

```typescript
import { TypedDataDomain } from 'ethers';

const domain: TypedDataDomain = {
  name: 'X402Resolver',
  version: '1',
  chainId: 44787, // Celo Alfajores, or your chain ID
  verifyingContract: resolverAddress
};
```

### Step 3: Create EIP-712 Typed Data

```typescript
const types = {
  Resolution: [
    { name: 'marketId', type: 'uint256' },
    { name: 'result', type: 'uint8' },
    { name: 'resolvedAt', type: 'uint64' }
  ]
};

const value = {
  marketId: resolution.marketId,
  result: resolution.result,
  resolvedAt: resolution.resolvedAt
};
```

### Step 4: Sign with Oracle Private Key

```typescript
import { Wallet } from 'ethers';

const oracleWallet = new Wallet(ORACLE_PRIVATE_KEY);
const signature = await oracleWallet.signTypedData(domain, types, value);
```

### Step 5: Encode Data for Contract

```typescript
import { AbiCoder } from 'ethers';

const abiCoder = AbiCoder.defaultAbiCoder();
const data = abiCoder.encode(
  ['uint64', 'bytes'],
  [resolution.resolvedAt, signature]
);
```

### Step 6: Call resolveMarket

```typescript
await friendWithBetsContract.resolveMarket(
  marketId,
  result, // 1 or 2
  data
);
```

## VLayer Integration Example

If you're using VLayer's API to generate proofs, you can adapt the signing process:

```typescript
// 1. Get resolution data from your backend/VLayer
const resolutionData = await getResolutionFromVLayer(marketId);

// 2. Construct the EIP-712 message
const domain = {
  name: 'X402Resolver',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: RESOLVER_ADDRESS
};

const types = {
  Resolution: [
    { name: 'marketId', type: 'uint256' },
    { name: 'result', type: 'uint8' },
    { name: 'resolvedAt', type: 'uint64' }
  ]
};

// 3. If VLayer provides the signature directly, use it
// Otherwise, sign with your oracle key
const signature = await signWithVLayerOrOracle(resolutionData);

// 4. Encode and submit
const data = ethers.AbiCoder.defaultAbiCoder().encode(
  ['uint64', 'bytes'],
  [resolutionData.resolvedAt, signature]
);

await friendWithBets.resolveMarket(marketId, resolutionData.result, data);
```

## Verification Functions

### Get Domain Separator

```solidity
bytes32 domainSeparator = resolver.getDomainSeparator();
```

### Hash Resolution (for off-chain use)

```solidity
X402Resolver.Resolution memory resolution = X402Resolver.Resolution({
    marketId: marketId,
    result: result,
    resolvedAt: resolvedAt
});
bytes32 digest = resolver.hashResolution(resolution);
```

This digest is what needs to be signed by the oracle.

## Important Notes

1. **Chain ID**: The contract stores the chain ID at deployment. Ensure your off-chain signing uses the same chain ID.

2. **Signature Format**: Must be exactly 65 bytes (standard ECDSA: r + s + v).

3. **Result Values**: Only `1` (YES) and `2` (NO) are valid.

4. **Timing**: The `resolvedAt` timestamp should be after the market's `endTime`.

5. **Oracle Address**: The signature must be created by the oracle address set in the resolver constructor.

## Testing

You can test the integration locally using Foundry:

```bash
forge test --match-test testPlaceResolveAndClaimYesWin -vvv
```

The test demonstrates the complete flow:
1. Create a market
2. Place wagers
3. Sign resolution off-chain (simulated)
4. Resolve market with signature
5. Claim winnings

## Security Considerations

1. **Oracle Key Security**: The oracle private key must be kept secure. Consider using hardware security modules or key management services.

2. **Replay Protection**: The `resolvedAt` timestamp helps prevent replay attacks, but markets can only be resolved once.

3. **Signature Validation**: Always verify signatures match the expected oracle address before submitting to the contract.

4. **Chain ID Validation**: Ensure signatures are created for the correct chain to prevent cross-chain replay.

## Troubleshooting

### "ResolutionRejected" Error

- Check that the signature was created by the correct oracle address
- Verify the chain ID matches the deployment chain
- Ensure the signature is exactly 65 bytes
- Confirm the EIP-712 domain matches exactly

### Invalid Signature

- Verify the domain separator matches: `resolver.getDomainSeparator()`
- Check that the resolution struct matches exactly (marketId, result, resolvedAt)
- Ensure the signature format is correct (r, s, v concatenated)

### Chain ID Mismatch

- The contract stores `chainId` at deployment
- Off-chain signing must use the same chain ID
- For multi-chain deployments, use separate resolver instances per chain

