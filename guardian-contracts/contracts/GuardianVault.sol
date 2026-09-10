// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @notice Minimal Aave v3 Pool surface the guardian uses.
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @title GuardianVault — autonomous invest+protect vault for a defensive agent wallet (ETHOnline 2026)
/// @notice Holds USDC and runs an always-on risk-managed loop, bounded on-chain to ONE `Policy` the
///         owner signed once on their Ledger Flex (EIP-712). Three tiers, escalating with risk:
///           - invest(): calm → deploy idle USDC to an approved lending venue (Aave) for yield.
///           - deRisk(): elevated → pull the position back to the vault. Funds never leave owner
///                       control, so this needs no fresh authority beyond being the agent.
///           - protect(): danger → evacuate to an owner-approved safe haven, capped by the policy.
///         The agent only decides *timing*. A fully compromised agent can never send funds anywhere
///         but the approved venue or the approved safe haven, never beyond the signed caps, never
///         after expiry. That is the security guarantee.
contract GuardianVault is EIP712 {
    using ECDSA for bytes32;

    /// @notice Hardware root of trust — the Ledger Flex. Signs policies, sets agent/havens.
    address public immutable owner;
    /// @notice Protected asset (Aave-test USDC on Base Sepolia).
    IERC20 public immutable usdc;
    /// @notice Approved lending pool (Aave v3 Pool). Immutable so the agent can never redirect yield.
    address public immutable venue;
    /// @notice Aave receipt token (aUSDC) — used to measure the live position.
    IERC20 public immutable aToken;
    /// @notice Autonomous relayer permitted to *trigger* the loop, bounded by the policy.
    address public agent;

    /// @notice Owner-approved evacuation destinations. protect() can only ever send here.
    mapping(address => bool) public safeHavenAllowed;
    /// @notice Cumulative USDC evacuated to a safe haven under each policy (by its EIP-712 digest).
    mapping(bytes32 => uint256) public protectedPerPolicy;

    /// @dev Signed once on the Flex: "invest up to `investCap` into `venue`, and evacuate up to
    ///      `protectCap` to `safeHaven`, until `expiry`." `venue` is echoed so it shows on the
    ///      Flex trusted display; the contract enforces it equals the immutable venue.
    struct Policy {
        uint256 investCap; // max live USDC position at the venue
        address venue; // must equal the immutable venue
        uint256 protectCap; // max cumulative USDC evacuated to the safe haven
        address safeHaven; // approved evacuation destination
        uint256 expiry;
        uint256 nonce;
    }

    bytes32 private constant POLICY_TYPEHASH = keccak256(
        "Policy(uint256 investCap,address venue,uint256 protectCap,address safeHaven,uint256 expiry,uint256 nonce)"
    );

    event Deposited(address indexed from, uint256 amount);
    event Invested(uint256 amount, uint256 position);
    event DeRisked(uint256 amount, uint256 position);
    event Protected(address indexed safeHaven, uint256 amount, uint256 nonce, uint256 protectedTotal);
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

    /// @param _agent        the relayer set at deploy (owner can change it later)
    /// @param _initialHaven a safe haven allowlisted at deploy (owner can change the set later)
    /// @dev Setting agent + safe haven at construction means the owner (the Ledger Flex) only has
    ///      to sign the Policy off-chain — no on-chain owner transactions needed to arm.
    constructor(address _owner, IERC20 _usdc, address _venue, IERC20 _aToken, address _agent, address _initialHaven)
        EIP712("Guardian", "1")
    {
        owner = _owner;
        usdc = _usdc;
        venue = _venue;
        aToken = _aToken;
        agent = _agent;
        safeHavenAllowed[_initialHaven] = true;
        emit AgentSet(_agent);
        emit SafeHavenSet(_initialHaven, true);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    // --- owner (Ledger) policy controls ---

    function setAgent(address a) external onlyOwner {
        agent = a;
        emit AgentSet(a);
    }

    function setSafeHaven(address haven, bool allowed) external onlyOwner {
        safeHavenAllowed[haven] = allowed;
        emit SafeHavenSet(haven, allowed);
    }

    /// @notice Owner escape hatch — the Flex can always sweep the vault directly.
    function ownerWithdraw(uint256 amount, address to) external onlyOwner {
        usdc.transfer(to, amount);
    }

    // --- funding + views ---

    function deposit(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    /// @notice Live USDC deployed to the venue (aToken balance).
    function position() public view returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /// @notice Idle USDC sitting in the vault, not yet deployed.
    function idle() public view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    // --- policy hashing (EIP-712) ---

    function hashPolicy(Policy calldata p) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(POLICY_TYPEHASH, p.investCap, p.venue, p.protectCap, p.safeHaven, p.expiry, p.nonce))
        );
    }

    function _verify(Policy calldata p, bytes calldata sig) internal view returns (bytes32 digest) {
        digest = hashPolicy(p);
        if (digest.recover(sig) != owner) revert BadPolicySigner();
        if (block.timestamp > p.expiry) revert PolicyExpired();
        if (p.venue != venue) revert BadVenue();
    }

    // --- the autonomous loop (bounded by the Flex-signed policy) ---

    /// @notice Calm → deploy idle USDC into the venue for yield. Bounded to `investCap` live position.
    function invest(Policy calldata p, bytes calldata sig, uint256 amount) external onlyAgent {
        _verify(p, sig);
        if (position() + amount > p.investCap) revert OverInvestCap();
        usdc.approve(venue, amount);
        IAavePool(venue).supply(address(usdc), amount, address(this), 0);
        emit Invested(amount, position());
    }

    /// @notice Elevated risk → pull the position back into the vault. Funds stay under owner control
    ///         (the vault), so routine de-risking consumes no signed protect budget.
    function deRisk(uint256 amount) external onlyAgent {
        IAavePool(venue).withdraw(address(usdc), amount, address(this));
        emit DeRisked(amount, position());
    }

    /// @notice Danger → evacuate USDC to the owner-approved safe haven, capped by the signed policy.
    ///         Withdraws any shortfall from the venue first.
    function protect(Policy calldata p, bytes calldata sig, uint256 amount) external onlyAgent {
        bytes32 digest = _verify(p, sig);
        if (!safeHavenAllowed[p.safeHaven]) revert SafeHavenNotAllowed();

        uint256 newTotal = protectedPerPolicy[digest] + amount;
        if (newTotal > p.protectCap) revert OverProtectCap();
        protectedPerPolicy[digest] = newTotal;

        uint256 liquid = usdc.balanceOf(address(this));
        if (liquid < amount) {
            IAavePool(venue).withdraw(address(usdc), amount - liquid, address(this));
        }
        usdc.transfer(p.safeHaven, amount);
        emit Protected(p.safeHaven, amount, p.nonce, newTotal);
    }
}
