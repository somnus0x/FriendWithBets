// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FriendWithBets} from "../contracts/FriendWithBets.sol";
import {X402Resolver} from "../contracts/modules/X402Resolver.sol";

contract DeployFWB {
    FriendWithBets public friendWithBets;
    X402Resolver public resolver;

    function run(address oracle) external {
        resolver = new X402Resolver(oracle);
        friendWithBets = new FriendWithBets();
    }
}
