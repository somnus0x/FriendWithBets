// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "./interfaces/IERC20.sol";
import {IResolver} from "./interfaces/IResolver.sol";

/// @title FriendWithBets
/// @notice Simple permissionless prediction market supporting YES/NO wagers with an external resolver.
contract FriendWithBets {
    struct Market {
        address creator;
        address token;
        address resolver;
        uint256 endTime;
        uint256 yesPool;
        uint256 noPool;
        uint8 result; // 1 = YES, 2 = NO
        bool resolved;
    }

    struct Bet {
        uint256 yes;
        uint256 no;
        bool claimed;
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Bet)) public bets;

    uint256 public nextMarketId = 1;

    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        address indexed token,
        address resolver,
        uint256 endTime
    );
    event WagerPlaced(uint256 indexed marketId, address indexed bettor, bool yes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint8 result, uint256 yesPool, uint256 noPool);
    event PayoutClaimed(uint256 indexed marketId, address indexed bettor, uint256 amount);

    error InvalidResult();
    error MarketClosed();
    error MarketOngoing();
    error MarketResolvedAlready();
    error ZeroAddress();
    error ZeroAmount();
    error NoWinningStake();
    error NothingToClaim();
    error ResolutionRejected();

    /// @notice Create a new YES/NO market.
    /// @param token ERC20 used for staking and payouts.
    /// @param resolver Oracle resolver contract implementing IResolver.
    /// @param endTime Timestamp after which the market can be resolved.
    /// @return marketId Newly created market ID.
    function createMarket(address token, address resolver, uint256 endTime) external returns (uint256 marketId) {
        if (token == address(0) || resolver == address(0)) revert ZeroAddress();
        if (endTime <= block.timestamp) revert MarketClosed();

        marketId = nextMarketId++;
        markets[marketId] = Market({
            creator: msg.sender,
            token: token,
            resolver: resolver,
            endTime: endTime,
            yesPool: 0,
            noPool: 0,
            result: 0,
            resolved: false
        });

        emit MarketCreated(marketId, msg.sender, token, resolver, endTime);
    }

    /// @notice Place a YES or NO wager on a market.
    /// @param marketId Target market ID.
    /// @param yes True for YES, false for NO.
    /// @param amount Stake amount.
    function placeWager(uint256 marketId, bool yes, uint256 amount) external {
        Market storage market = _getMarket(marketId);
        if (market.resolved) revert MarketResolvedAlready();
        if (block.timestamp >= market.endTime) revert MarketClosed();
        if (amount == 0) revert ZeroAmount();

        _pullToken(market.token, msg.sender, amount);

        Bet storage betInfo = bets[marketId][msg.sender];
        if (yes) {
            betInfo.yes += amount;
            market.yesPool += amount;
        } else {
            betInfo.no += amount;
            market.noPool += amount;
        }

        emit WagerPlaced(marketId, msg.sender, yes, amount);
    }

    /// @notice Resolve a market using the configured resolver.
    /// @param marketId Target market ID.
    /// @param result Encoded result: 1 = YES, 2 = NO.
    /// @param data Resolver-specific payload (for X402Resolver this is encoded (uint64 resolvedAt, bytes signature)).
    function resolveMarket(uint256 marketId, uint8 result, bytes calldata data) external {
        Market storage market = _getMarket(marketId);
        if (market.resolved) revert MarketResolvedAlready();
        if (block.timestamp < market.endTime) revert MarketOngoing();
        if (result != 1 && result != 2) revert InvalidResult();

        bool valid = IResolver(market.resolver).verifyResolution(marketId, result, data);
        if (!valid) revert ResolutionRejected();

        market.resolved = true;
        market.result = result;

        emit MarketResolved(marketId, result, market.yesPool, market.noPool);
    }

    /// @notice Claim winnings after a market is resolved.
    /// @param marketId Target market ID.
    function claim(uint256 marketId) external {
        Market storage market = _getMarket(marketId);
        if (!market.resolved) revert MarketOngoing();

        Bet storage betInfo = bets[marketId][msg.sender];
        if (betInfo.claimed) revert NothingToClaim();

        uint256 winnerPool = market.result == 1 ? market.yesPool : market.noPool;
        uint256 userStake = market.result == 1 ? betInfo.yes : betInfo.no;
        if (winnerPool == 0 || userStake == 0) revert NoWinningStake();

        uint256 totalPool = market.yesPool + market.noPool;
        uint256 payout = (totalPool * userStake) / winnerPool;

        betInfo.claimed = true;
        _pushToken(market.token, msg.sender, payout);

        emit PayoutClaimed(marketId, msg.sender, payout);
    }

    function _pullToken(address token, address from, uint256 amount) internal {
        bool ok = IERC20(token).transferFrom(from, address(this), amount);
        require(ok, "TRANSFER_FROM_FAILED");
    }

    function _pushToken(address token, address to, uint256 amount) internal {
        bool ok = IERC20(token).transfer(to, amount);
        require(ok, "TRANSFER_FAILED");
    }

    function _getMarket(uint256 marketId) internal view returns (Market storage market) {
        market = markets[marketId];
        if (market.creator == address(0)) revert ZeroAddress();
    }
}
