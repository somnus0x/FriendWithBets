// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FriendWithBets} from "../contracts/FriendWithBets.sol";
import {X402Resolver} from "../contracts/modules/X402Resolver.sol";

/// @title DeployFWB_Celo
/// @notice Deployment script for FriendWithBets on Celo network
/// @dev Deploys X402Resolver and FriendWithBets contracts
/// @dev Usage: forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo --sig "run(address)" <ORACLE_ADDRESS> --rpc-url <RPC_URL> --broadcast
contract DeployFWB_Celo {
    // Deployment addresses will be stored here
    FriendWithBets public friendWithBets;
    X402Resolver public resolver;

    // Celo network chain IDs
    // Mainnet: 42220
    // Alfajores (testnet): 44787
    uint256 public constant CELO_MAINNET = 42220;
    uint256 public constant CELO_ALFAJORES = 44787;

    /// @notice Main deployment function
    /// @param oracle The oracle address that will sign market resolutions
    /// @dev Must be called with --sig flag: forge script script/DeployFWB_Celo.s.sol:DeployFWB_Celo --sig "run(address)" <ORACLE_ADDRESS> --rpc-url <RPC_URL> --broadcast
    function run(address oracle) external {
        require(oracle != address(0), "ORACLE_REQUIRED");

        // Deploy X402Resolver first (required by FriendWithBets)
        resolver = new X402Resolver(oracle);

        // Deploy FriendWithBets
        friendWithBets = new FriendWithBets();
    }
}

