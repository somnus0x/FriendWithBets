# FriendWithBets

A minimal FriendWithBets deployment composed of Foundry-ready contracts, scripts, and tests. The core `FriendWithBets` contract
runs simple YES/NO markets that escrow ERC20 stakes and resolve through an external resolver (e.g., `X402Resolver`).

## Layout
- `contracts/FriendWithBets.sol`: market lifecycle (create, wager, resolve, claim).
- `contracts/interfaces`: lightweight ERC20 and resolver interfaces.
- `contracts/modules/X402Resolver.sol`: EIP-712 resolver that validates oracle signatures.
- `contracts/mocks/MockERC20.sol`: mintable ERC20 used in tests.
- `test/FWB.t.sol`: Foundry test covering a YES outcome path using cheatcodes for signing.
- `script/DeployFWB.s.sol`: helper script to deploy resolver + core contract.

## Quickstart
1. Install [Foundry](https://book.getfoundry.sh/getting-started/installation).
2. Run `forge test` to compile and execute the included scenario.
3. Deploy with your preferred wallet, passing an oracle address to `DeployFWB.run`.
