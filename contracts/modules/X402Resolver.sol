// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IResolver} from "../interfaces/IResolver.sol";

/// @title X402Resolver
/// @notice EIP-712 compatible resolver that validates oracle signatures for market outcomes.
contract X402Resolver is IResolver {
    struct Resolution {
        uint256 marketId;
        uint8 result;
        uint64 resolvedAt;
    }

    address public immutable oracle;

    bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 internal constant RESOLUTION_TYPEHASH = keccak256("Resolution(uint256 marketId,uint8 result,uint64 resolvedAt)");
    bytes32 internal constant NAME_HASH = keccak256("X402Resolver");
    bytes32 internal constant VERSION_HASH = keccak256("1");

    constructor(address oracle_) {
        require(oracle_ != address(0), "ORACLE_REQUIRED");
        oracle = oracle_;
    }

    /// @inheritdoc IResolver
    function verifyResolution(uint256 marketId, uint8 result, bytes calldata data) external view override returns (bool valid) {
        if (result != 1 && result != 2) return false;
        (uint64 resolvedAt, bytes memory signature) = abi.decode(data, (uint64, bytes));

        Resolution memory resolution = Resolution({marketId: marketId, result: result, resolvedAt: resolvedAt});
        bytes32 digest = hashResolution(resolution);

        address signer = _recover(digest, signature);
        valid = signer == oracle;
    }

    /// @notice Compute the EIP-712 digest for a resolution.
    function hashResolution(Resolution memory resolution) public view returns (bytes32) {
        bytes32 domainSeparator = keccak256(
            abi.encode(EIP712_DOMAIN_TYPEHASH, NAME_HASH, VERSION_HASH, block.chainid, address(this))
        );
        bytes32 structHash = keccak256(
            abi.encode(RESOLUTION_TYPEHASH, resolution.marketId, resolution.result, resolution.resolvedAt)
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    /// @notice Recover signer from a typed data digest and signature.
    function _recover(bytes32 digest, bytes memory signature) internal pure returns (address) {
        if (signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(digest, v, r, s);
    }
}
