// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IResolver {
    /// @notice Verify that a given (marketId, result, data) tuple is a valid
    /// oracle resolution according to some scheme (e.g. x402).
    /// @param marketId ID of the market being resolved.
    /// @param result Encoded result. Convention: 1 = YES, 2 = NO.
    /// @param data Arbitrary resolver data (e.g. signature payload).
    /// @return valid True if resolution is valid.
    function verifyResolution(
        uint256 marketId,
        uint8 result,
        bytes calldata data
    ) external view returns (bool valid);
}
