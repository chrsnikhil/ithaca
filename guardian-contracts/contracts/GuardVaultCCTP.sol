// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @dev CCTP V2 TokenMessenger (burn-and-mint USDC cross-chain).
interface ITokenMessengerV2 {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken,
        bytes32 destinationCaller,
        uint256 maxFee,
        uint32 minFinalityThreshold
    ) external;
}

/// @title GuardVaultCCTP — the SOURCE-chain guard (e.g. Base). Same Flex-signed mandate model
///        as GuardVault, but rescue() moves USDC cross-chain to safety on Arc via CCTP V2
///        (burn here -> Circle attestation -> mint on Arc to the allowlisted safe haven).
///        Read anything off-chain; on-chain the agent can only ever burn within the mandate.
contract GuardVaultCCTP is EIP712 {
    using ECDSA for bytes32;

    address public immutable owner; // Ledger Flex — signs mandates, sets policy
    IERC20 public immutable usdc; // real Circle USDC on the source chain (CCTP-burnable)
    ITokenMessengerV2 public immutable tokenMessenger;

    // route defaults: Arc (domain 26), standard transfer (no fronting fee, finalized threshold)
    uint32 public destinationDomain = 26;
    uint256 public maxFee = 0;
    uint32 public minFinalityThreshold = 2000; // 2000=finalized (safe on Arc testnet); 1000=fast

    address public agent;
    mapping(address => bool) public safeHavenAllowed; // allowed mint recipients on the destination
    mapping(bytes32 => uint256) public spentPerMandate;

    struct Mandate {
        uint256 maxAmount;
        address safeHaven;
        uint256 expiry;
        uint256 nonce;
    }

    bytes32 private constant MANDATE_TYPEHASH =
        keccak256("Mandate(uint256 maxAmount,address safeHaven,uint256 expiry,uint256 nonce)");

    event Deposited(address indexed from, uint256 amount);
    event RescueBurned(address indexed safeHaven, uint256 amount, uint32 destinationDomain, uint256 spent);
    event AgentSet(address indexed agent);
    event SafeHavenSet(address indexed haven, bool allowed);
    event RouteSet(uint32 destinationDomain, uint256 maxFee, uint32 minFinalityThreshold);

    error NotOwner();
    error NotAgent();
    error BadMandateSigner();
    error MandateExpired();
    error AmountOverMandate();
    error SafeHavenNotAllowed();

    constructor(address _owner, IERC20 _usdc, ITokenMessengerV2 _tm) EIP712("Guardian", "1") {
        owner = _owner;
        usdc = _usdc;
        tokenMessenger = _tm;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function setAgent(address a) external onlyOwner { agent = a; emit AgentSet(a); }
    function setSafeHaven(address h, bool ok) external onlyOwner { safeHavenAllowed[h] = ok; emit SafeHavenSet(h, ok); }
    function setRoute(uint32 domain, uint256 fee, uint32 threshold) external onlyOwner {
        destinationDomain = domain; maxFee = fee; minFinalityThreshold = threshold;
        emit RouteSet(domain, fee, threshold);
    }

    function deposit(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function hashMandate(Mandate calldata m) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(MANDATE_TYPEHASH, m.maxAmount, m.safeHaven, m.expiry, m.nonce))
        );
    }

    /// @notice Autonomous cross-chain rescue, hard-bounded by the Flex-signed mandate.
    function rescue(Mandate calldata m, bytes calldata sig, uint256 amount) external {
        if (msg.sender != agent) revert NotAgent();
        bytes32 digest = hashMandate(m);
        if (digest.recover(sig) != owner) revert BadMandateSigner();
        if (block.timestamp > m.expiry) revert MandateExpired();
        if (!safeHavenAllowed[m.safeHaven]) revert SafeHavenNotAllowed();
        uint256 spent = spentPerMandate[digest] + amount;
        if (spent > m.maxAmount) revert AmountOverMandate();
        spentPerMandate[digest] = spent;

        // Burn USDC on this chain -> Circle attests -> minted to safeHaven on the destination (Arc).
        usdc.approve(address(tokenMessenger), amount);
        tokenMessenger.depositForBurn(
            amount,
            destinationDomain,
            bytes32(uint256(uint160(m.safeHaven))), // address -> bytes32 mintRecipient
            address(usdc),
            bytes32(0), // destinationCaller = anyone can complete the mint
            maxFee,
            minFinalityThreshold
        );
        emit RescueBurned(m.safeHaven, amount, destinationDomain, spent);
    }
}
