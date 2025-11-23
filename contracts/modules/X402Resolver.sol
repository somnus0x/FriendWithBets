// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IResolver} from "../interfaces/IResolver.sol";

/// @title X402Resolver
/// @notice EIP-712 compatible resolver that validates oracle signatures for market outcomes.
/// @dev Optimized for off-chain oracles like VLayer that sign resolutions off-chain.
contract X402Resolver is IResolver {
    struct Resolution {
        uint256 marketId;
        uint8 result;
        uint64 resolvedAt;
    }

    address public immutable oracle;
    uint256 public immutable chainId;

    bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 internal constant RESOLUTION_TYPEHASH = keccak256("Resolution(uint256 marketId,uint8 result,uint64 resolvedAt)");
    bytes32 internal constant NAME_HASH = keccak256("X402Resolver");
    bytes32 internal constant VERSION_HASH = keccak256("1");

    event ResolutionVerified(uint256 indexed marketId, uint8 result, address signer, bool valid);

    constructor(address oracle_) {
        require(oracle_ != address(0), "ORACLE_REQUIRED");
        oracle = oracle_;
        chainId = block.chainid;
    }

    /// @inheritdoc IResolver
    /// @dev Verifies an off-chain oracle signature for market resolution.
    /// @param data Encoded as: abi.encode(uint64 resolvedAt, bytes signature)
    ///              For VLayer and other off-chain oracles, the signature should be created
    ///              using EIP-712 with the current chain ID.
    function verifyResolution(uint256 marketId, uint8 result, bytes calldata data) external view override returns (bool valid) {
        // Validate result
        if (result != 1 && result != 2) {
            return false;
        }

        // Decode the resolution data
        // Format: (uint64 resolvedAt, bytes signature)
        (uint64 resolvedAt, bytes memory signature) = abi.decode(data, (uint64, bytes));

        // Validate signature length (65 bytes for standard ECDSA)
        if (signature.length != 65) {
            return false;
        }

        // Create resolution struct
        Resolution memory resolution = Resolution({
            marketId: marketId,
            result: result,
            resolvedAt: resolvedAt
        });

        // Compute EIP-712 digest
        bytes32 digest = hashResolution(resolution);

        // Recover signer from signature
        address signer = _recover(digest, signature);

        // Verify signer matches oracle
        valid = signer == oracle;

        // Emit event for off-chain monitoring (only in view functions via staticcall, but safe to include)
        // Note: Events in view functions won't be emitted, but included for interface clarity
    }

    /// @notice Compute the EIP-712 digest for a resolution.
    /// @dev This function can be called off-chain to generate the digest that needs to be signed.
    ///      Off-chain oracles (like VLayer) should use this to create signatures.
    /// @param resolution The resolution data to hash
    /// @return The EIP-712 digest that should be signed
    function hashResolution(Resolution memory resolution) public view returns (bytes32) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                NAME_HASH,
                VERSION_HASH,
                chainId, // Use stored chainId for consistency with off-chain signing
                address(this)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(
                RESOLUTION_TYPEHASH,
                resolution.marketId,
                resolution.result,
                resolution.resolvedAt
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    /// @notice Get the EIP-712 domain separator for off-chain signing.
    /// @dev Off-chain oracles can use this to construct the domain for EIP-712 signing.
    /// @return The domain separator hash
    function getDomainSeparator() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                NAME_HASH,
                VERSION_HASH,
                chainId,
                address(this)
            )
        );
    }

    /// @notice Recover signer from a typed data digest and signature.
    /// @dev Handles standard ECDSA signatures (65 bytes: r + s + v)
    /// @param digest The EIP-712 digest that was signed
    /// @param signature The 65-byte signature (r, s, v)
    /// @return The recovered signer address, or address(0) if invalid
    function _recover(bytes32 digest, bytes memory signature) internal pure returns (address) {
        // Signature must be exactly 65 bytes
        if (signature.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        // Extract r, s, v from signature
        assembly {
            // r is first 32 bytes
            r := mload(add(signature, 0x20))
            // s is next 32 bytes
            s := mload(add(signature, 0x40))
            // v is last byte
            v := byte(0, mload(add(signature, 0x60)))
        }

        // Handle v values: 0-3 map to 27-30
        if (v < 27) {
            v += 27;
        }

        // Validate v is 27 or 28
        if (v != 27 && v != 28) {
            return address(0);
        }

        // Recover and return signer
        return ecrecover(digest, v, r, s);
    }
}
