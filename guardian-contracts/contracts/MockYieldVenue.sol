// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title MockYieldVenue — the Arc-native yield venue for GuardianVault's invest tier.
/// @notice Implements the SAME supply/withdraw surface GuardianVault already uses (Aave-shaped),
///         and doubles as the yield-bearing receipt: `balanceOf(depositor)` accrues linearly at
///         `aprBps`, so a live position visibly earns yield.
///
///         Why a mock on testnet: Arc's real yield primitive is Circle's **USYC** (tokenized
///         US-Treasury RWA) via its Teller. USYC is **entitlement-gated** (an on-chain
///         Entitlements contract governs who may hold it), so an arbitrary vault contract can't
///         hold it on testnet. On Arc MAINNET this venue is swapped for the USYC Teller — no
///         change to GuardianVault, which is venue-agnostic. See scripts/probe-arc-usyc.js.
contract MockYieldVenue {
    IERC20 public immutable usdc;
    uint256 public immutable aprBps; // e.g. 500 = 5.00% APR
    uint256 public immutable startTime;

    uint256 private constant RAY = 1e27;
    uint256 private constant YEAR = 365 days;

    mapping(address => uint256) public scaled; // balance scaled by the index at deposit time

    event Supplied(address indexed onBehalfOf, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(IERC20 _usdc, uint256 _aprBps) {
        usdc = _usdc;
        aprBps = _aprBps;
        startTime = block.timestamp;
    }

    /// @notice Yield index: RAY at deploy, growing linearly by aprBps/year.
    function index() public view returns (uint256) {
        return RAY + (RAY * aprBps * (block.timestamp - startTime)) / (10000 * YEAR);
    }

    /// @notice Aave-shaped supply: pull `amount` USDC from the caller, credit an accruing
    ///         balance to `onBehalfOf`. (asset/referral ignored — single-asset mock.)
    function supply(address, uint256 amount, address onBehalfOf, uint16) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        scaled[onBehalfOf] += (amount * RAY) / index();
        emit Supplied(onBehalfOf, amount);
    }

    /// @notice Aave-shaped withdraw: burn the caller's accruing balance worth `amount` USDC and
    ///         send `amount` USDC to `to`. Scaled burn is capped at the caller's balance so a
    ///         full-position withdraw can never underflow (avoids stale-read revert bugs).
    function withdraw(address, uint256 amount, address to) external returns (uint256) {
        uint256 idx = index();
        uint256 s = (amount * RAY + idx - 1) / idx; // ceil
        uint256 have = scaled[msg.sender];
        if (s > have) s = have;
        scaled[msg.sender] = have - s;
        usdc.transfer(to, amount);
        emit Withdrawn(to, amount);
        return amount;
    }

    /// @notice Live yield-bearing balance — what GuardianVault reads as position().
    function balanceOf(address user) external view returns (uint256) {
        return (scaled[user] * index()) / RAY;
    }

    /// @notice Top up the pool so accrued yield is actually payable on withdraw. Anyone can fund.
    function fundYieldBuffer(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
    }
}
