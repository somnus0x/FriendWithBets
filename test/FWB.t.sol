// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FriendWithBets} from "../contracts/FriendWithBets.sol";
import {X402Resolver} from "../contracts/modules/X402Resolver.sol";
import {MockERC20} from "../contracts/mocks/MockERC20.sol";

interface Vm {
    function addr(uint256 privateKey) external returns (address);
    function warp(uint256) external;
    function prank(address) external;
    function sign(uint256 privateKey, bytes32 digest) external returns (uint8, bytes32, bytes32);
}

contract FWBTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    FriendWithBets private fwb;
    X402Resolver private resolver;
    MockERC20 private token;

    uint256 private constant ORACLE_KEY = uint256(keccak256("oracle"));
    uint256 private constant ALICE_KEY = uint256(keccak256("alice"));
    uint256 private constant BOB_KEY = uint256(keccak256("bob"));

    address private oracle;
    address private alice;
    address private bob;

    function setUp() public {
        oracle = vm.addr(ORACLE_KEY);
        alice = vm.addr(ALICE_KEY);
        bob = vm.addr(BOB_KEY);

        token = new MockERC20("Bet Token", "BET", 18);
        resolver = new X402Resolver(oracle);
        fwb = new FriendWithBets();

        token.mint(alice, 200 ether);
        token.mint(bob, 200 ether);

        vm.prank(alice);
        token.approve(address(fwb), type(uint256).max);
        vm.prank(bob);
        token.approve(address(fwb), type(uint256).max);
    }

    function testPlaceResolveAndClaimYesWin() public {
        setUp();
        uint256 marketId = fwb.createMarket(address(token), address(resolver), block.timestamp + 1);

        vm.prank(alice);
        fwb.placeWager(marketId, true, 100 ether);

        vm.prank(bob);
        fwb.placeWager(marketId, false, 100 ether);

        vm.warp(block.timestamp + 2);

        uint64 resolvedAt = uint64(block.timestamp);
        bytes32 digest = resolver.hashResolution(
            X402Resolver.Resolution({marketId: marketId, result: 1, resolvedAt: resolvedAt})
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ORACLE_KEY, digest);
        bytes memory sig = abi.encodePacked(r, s, v);
        bytes memory payload = abi.encode(resolvedAt, sig);

        fwb.resolveMarket(marketId, 1, payload);

        vm.prank(alice);
        fwb.claim(marketId);

        uint256 aliceBalance = token.balanceOf(alice);
        _assertEq(aliceBalance, 300 ether, "winner should receive full pot");
    }

    function _assertEq(uint256 a, uint256 b, string memory message) internal pure {
        if (a != b) {
            revert(message);
        }
    }
}
