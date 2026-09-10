// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @notice Aave-shaped venue surface (both real Aave v3 and our MockYieldVenue implement it).
interface IVenue {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @title GuardianVaultMulti — a defensive agent wallet that allocates across MULTIPLE markets.
/// @notice Same guarantee as GuardianVault, generalised to a set of markets fixed at deploy: the
///         agent may invest idle USDC into ANY allowlisted venue, rebalance BETWEEN them, and
///         evacuate to an owner-approved safe haven — all bounded on-chain by ONE `Policy` the
///         owner signed once on their Ledger Flex. It picks WHICH market (guided off-chain by
///         graphscout's live risk read) and WHEN, but a compromised agent can never send funds
///         outside the allowlisted venues / safe haven, never past the signed caps, never after
///         expiry.
contract GuardianVaultMulti is EIP712 {
    using ECDSA for bytes32;

    address public immutable owner; // the Ledger Flex
    IERC20 public immutable usdc;
    address public agent;

    address[] public venues; // allowlisted markets, fixed at construction
    IERC20[] public aTokens; // receipt token per venue (for mocks, venue == aToken)
    mapping(address => uint256) private venueIdxPlus1; // venue -> index+1 (0 = not a venue)

    mapping(address => bool) public safeHavenAllowed;
    mapping(bytes32 => uint256) public protectedPerPolicy;

    /// @dev Signed once on the Flex. No per-venue field — the venue SET is fixed at deploy; the
    ///      policy bounds the TOTAL invested (across all venues), the evacuation cap, and where.
    struct Policy {
        uint256 investCap; // max total live position across all venues
        uint256 protectCap; // max cumulative USDC evacuated to the safe haven
        address safeHaven;
        uint256 expiry;
        uint256 nonce;
    }

    bytes32 private constant POLICY_TYPEHASH =
        keccak256("Policy(uint256 investCap,uint256 protectCap,address safeHaven,uint256 expiry,uint256 nonce)");

    /// @dev A FRESH, single-use approval the owner signs on the Flex in-the-moment for a HIGH-RISK
    ///      action that goes BEYOND the standing policy — evacuating above the auto-protect cap
    ///      and/or to a destination not on the allowlist. Routine protect() stays autonomous within
    ///      the signed policy; anything bigger or to a new address needs a live human approval.
    struct Escalation {
        uint256 amount; // exact USDC to evacuate
        address safeHaven; // destination (may be OUTSIDE the standing allowlist)
        uint256 expiry;
        uint256 nonce;
    }
    bytes32 private constant ESCALATION_TYPEHASH =
        keccak256("Escalation(uint256 amount,address safeHaven,uint256 expiry,uint256 nonce)");
    mapping(bytes32 => bool) public escalationUsed;

    event Deposited(address indexed from, uint256 amount);
    event Invested(address indexed venue, uint256 amount, uint256 venuePosition);
    event DeRisked(address indexed venue, uint256 amount, uint256 venuePosition);
    event Rebalanced(address indexed fromVenue, address indexed toVenue, uint256 amount);
    event Protected(address indexed safeHaven, uint256 amount, uint256 nonce, uint256 protectedTotal);
    event Escalated(address indexed safeHaven, uint256 amount, uint256 nonce);
    event SafeHavenSet(address indexed haven, bool allowed);
    event AgentSet(address indexed agent);

    error NotOwner();
    error NotAgent();
    error BadPolicySigner();
    error PolicyExpired();
    error BadVenue();
    error OverInvestCap();
    error OverProtectCap();
    error SafeHavenNotAllowed();
    error BadConfig();
    error EscalationUsed();

    constructor(
        address _owner,
        IERC20 _usdc,
        address[] memory _venues,
        IERC20[] memory _aTokens,
        address _agent,
        address _initialHaven
    ) EIP712("Guardian", "1") {
        if (_venues.length == 0 || _venues.length != _aTokens.length) revert BadConfig();
        owner = _owner;
        usdc = _usdc;
        agent = _agent;
        for (uint256 i; i < _venues.length; i++) {
            venues.push(_venues[i]);
            aTokens.push(_aTokens[i]);
            venueIdxPlus1[_venues[i]] = i + 1;
        }
        safeHavenAllowed[_initialHaven] = true;
        emit AgentSet(_agent);
        emit SafeHavenSet(_initialHaven, true);
    }

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyAgent() { if (msg.sender != agent) revert NotAgent(); _; }

    // --- owner (Ledger) controls ---
    function setAgent(address a) external onlyOwner { agent = a; emit AgentSet(a); }
    function setSafeHaven(address haven, bool allowed) external onlyOwner { safeHavenAllowed[haven] = allowed; emit SafeHavenSet(haven, allowed); }
    function ownerWithdraw(uint256 amount, address to) external onlyOwner { usdc.transfer(to, amount); }

    // --- funding + views ---
    function deposit(uint256 amount) external { usdc.transferFrom(msg.sender, address(this), amount); emit Deposited(msg.sender, amount); }
    function venueCount() external view returns (uint256) { return venues.length; }
    function isVenue(address v) public view returns (bool) { return venueIdxPlus1[v] != 0; }
    function idle() public view returns (uint256) { return usdc.balanceOf(address(this)); }

    function positionOf(address venue) public view returns (uint256) {
        uint256 idx = venueIdxPlus1[venue];
        if (idx == 0) revert BadVenue();
        return aTokens[idx - 1].balanceOf(address(this));
    }

    function totalPosition() public view returns (uint256 t) {
        for (uint256 i; i < aTokens.length; i++) t += aTokens[i].balanceOf(address(this));
    }

    // --- policy (EIP-712) ---
    function hashPolicy(Policy calldata p) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(POLICY_TYPEHASH, p.investCap, p.protectCap, p.safeHaven, p.expiry, p.nonce)));
    }

    function _verify(Policy calldata p, bytes calldata sig) internal view returns (bytes32 digest) {
        digest = hashPolicy(p);
        if (digest.recover(sig) != owner) revert BadPolicySigner();
        if (block.timestamp > p.expiry) revert PolicyExpired();
    }

    // --- the autonomous loop (bounded by the Flex-signed policy) ---

    /// @notice Deploy idle USDC into an allowlisted market. Bounded to `investCap` TOTAL position.
    function invest(Policy calldata p, bytes calldata sig, address venue, uint256 amount) external onlyAgent {
        _verify(p, sig);
        if (!isVenue(venue)) revert BadVenue();
        if (totalPosition() + amount > p.investCap) revert OverInvestCap();
        usdc.approve(venue, amount);
        IVenue(venue).supply(address(usdc), amount, address(this), 0);
        emit Invested(venue, amount, positionOf(venue));
    }

    /// @notice Pull a position back into the vault (funds stay under owner control → no signed
    ///         authority needed beyond being the agent).
    function deRisk(address venue, uint256 amount) external onlyAgent {
        if (!isVenue(venue)) revert BadVenue();
        IVenue(venue).withdraw(address(usdc), amount, address(this));
        emit DeRisked(venue, amount, positionOf(venue));
    }

    /// @notice Move a position from one market to another in one tx (the graphscout-driven
    ///         "switch to the better/safer market"). Funds never leave the vault's venue set, and
    ///         total position can't increase, so it consumes no fresh signed authority.
    function rebalance(address fromVenue, address toVenue, uint256 amount) external onlyAgent {
        if (!isVenue(fromVenue) || !isVenue(toVenue)) revert BadVenue();
        IVenue(fromVenue).withdraw(address(usdc), amount, address(this));
        usdc.approve(toVenue, amount);
        IVenue(toVenue).supply(address(usdc), amount, address(this), 0);
        emit Rebalanced(fromVenue, toVenue, amount);
    }

    /// @notice Danger → evacuate USDC to the owner-approved safe haven, capped by the policy.
    ///         Pulls any shortfall from the markets in order.
    function protect(Policy calldata p, bytes calldata sig, uint256 amount) external onlyAgent {
        bytes32 digest = _verify(p, sig);
        if (!safeHavenAllowed[p.safeHaven]) revert SafeHavenNotAllowed();

        uint256 newTotal = protectedPerPolicy[digest] + amount;
        if (newTotal > p.protectCap) revert OverProtectCap();
        protectedPerPolicy[digest] = newTotal;

        uint256 liquid = usdc.balanceOf(address(this));
        for (uint256 i; i < venues.length && liquid < amount; i++) {
            uint256 need = amount - liquid;
            uint256 bal = aTokens[i].balanceOf(address(this));
            uint256 pull = bal < need ? bal : need;
            if (pull > 0) {
                IVenue(venues[i]).withdraw(address(usdc), pull, address(this));
                liquid = usdc.balanceOf(address(this));
            }
        }
        usdc.transfer(p.safeHaven, amount);
        emit Protected(p.safeHaven, amount, p.nonce, newTotal);
    }

    /// @notice HIGH-RISK path — evacuate to a destination the owner approves FRESH on their Flex,
    ///         right now, BEYOND the standing policy (a new destination and/or above the auto cap).
    ///         Each `Escalation` is single-use. This is the "Ledger approves the dangerous action in
    ///         the moment" tier: routine protect() is autonomous within the signed policy; anything
    ///         bigger or to a new address requires a live human approval on the device.
    function approveAndProtect(Escalation calldata e, bytes calldata sig, uint256 amount) external onlyAgent {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(ESCALATION_TYPEHASH, e.amount, e.safeHaven, e.expiry, e.nonce))
        );
        if (digest.recover(sig) != owner) revert BadPolicySigner();
        if (block.timestamp > e.expiry) revert PolicyExpired();
        if (escalationUsed[digest]) revert EscalationUsed();
        if (amount > e.amount) revert OverProtectCap();
        escalationUsed[digest] = true;

        uint256 liquid = usdc.balanceOf(address(this));
        for (uint256 i; i < venues.length && liquid < amount; i++) {
            uint256 need = amount - liquid;
            uint256 bal = aTokens[i].balanceOf(address(this));
            uint256 pull = bal < need ? bal : need;
            if (pull > 0) {
                IVenue(venues[i]).withdraw(address(usdc), pull, address(this));
                liquid = usdc.balanceOf(address(this));
            }
        }
        usdc.transfer(e.safeHaven, amount);
        emit Escalated(e.safeHaven, amount, e.nonce);
    }
}
