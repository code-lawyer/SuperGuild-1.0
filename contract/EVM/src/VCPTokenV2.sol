// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title VCPTokenV2 — Super Guild 2026 Sovereign Reputation Token
 * @notice Non-transferable, UUPS-upgradeable, vote-enabled reputation token.
 *
 * Architecture:
 *   - Cold Wallet → DEFAULT_ADMIN_ROLE: upgrades, blacklist, pause, grant/revoke roles
 *   - Hot Wallet  → MINTER_ROLE: daily minting operations (e.g. task settlement)
 *
 * Standards: ERC-8129 (Soulbound concept), ERC-20 compatible interface, ERC-20 Votes
 */
contract VCPTokenV2 is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // ═══════════════════════════════════════════════════════
    //                      ROLES
    // ═══════════════════════════════════════════════════════
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ═══════════════════════════════════════════════════════
    //                    BLACKLIST
    // ═══════════════════════════════════════════════════════
    mapping(address => bool) public blacklisted;

    // ═══════════════════════════════════════════════════════
    //                     EVENTS
    // ═══════════════════════════════════════════════════════
    event Blacklisted(address indexed account);
    event Unblacklisted(address indexed account);
    event VCPMinted(address indexed to, uint256 amount, string reason);

    // ═══════════════════════════════════════════════════════
    //                     ERRORS
    // ═══════════════════════════════════════════════════════
    error TransfersDisabled();
    error AddressBlacklisted(address account);
    error MintToZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // Prevent impl contract from being initialized
    }

    /**
     * @notice Initializer — replaces constructor for UUPS pattern.
     * @param coldWallet The admin address (hardware wallet / multisig).
     * @param hotWallet  The minter address (server-side / automated).
     */
    function initialize(address coldWallet, address hotWallet) public initializer {
        __ERC20_init("Super Guild VCP", "VCP");
        __ERC20Permit_init("Super Guild VCP");
        __ERC20Votes_init();
        __Pausable_init();
        __AccessControl_init();

        // Cold wallet = God mode
        _grantRole(DEFAULT_ADMIN_ROLE, coldWallet);

        // Hot wallet = Daily operations only
        _grantRole(MINTER_ROLE, hotWallet);
    }

    // ═══════════════════════════════════════════════════════
    //                 ERC-8129: SOULBOUND
    // ═══════════════════════════════════════════════════════

    /**
     * @notice ERC-8129 compliance: token is permanently locked.
     */
    function locked() external pure returns (bool) {
        return true;
    }

    /**
     * @notice Decimals = 0. 1 VCP = 1 unit. Cannot be fractional.
     */
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    // ═══════════════════════════════════════════════════════
    //                DISABLED TRANSFERS
    // ═══════════════════════════════════════════════════════

    /**
     * @dev All user-facing transfer functions revert unconditionally.
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert TransfersDisabled();
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert TransfersDisabled();
    }

    function approve(address, uint256) public pure override returns (bool) {
        revert TransfersDisabled();
    }

    // ═══════════════════════════════════════════════════════
    //                    MINT / BURN
    // ═══════════════════════════════════════════════════════

    /**
     * @notice Mint VCP to a user. Only callable by MINTER_ROLE (hot wallet).
     * @param to     Recipient address.
     * @param amount Amount of VCP (integer, no decimals).
     * @param reason Human-readable reason (e.g. "Task #42 settled").
     */
    function mint(address to, uint256 amount, string calldata reason) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert MintToZeroAddress();
        if (blacklisted[to]) revert AddressBlacklisted(to);
        _mint(to, amount);
        emit VCPMinted(to, amount, reason);
    }

    /**
     * @notice Burn VCP from a specific address (admin only, for penalties).
     * @param from   Target address.
     * @param amount Amount to burn.
     */
    function burn(address from, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(from, amount);
    }

    // ═══════════════════════════════════════════════════════
    //                    BLACKLIST
    // ═══════════════════════════════════════════════════════

    function addBlacklist(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        blacklisted[account] = true;
        emit Blacklisted(account);
    }

    function removeBlacklist(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        blacklisted[account] = false;
        emit Unblacklisted(account);
    }

    // ═══════════════════════════════════════════════════════
    //                    PAUSABLE
    // ═══════════════════════════════════════════════════════

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════
    //                  UUPS UPGRADE
    // ═══════════════════════════════════════════════════════

    /**
     * @dev Only cold wallet (DEFAULT_ADMIN_ROLE) can authorize upgrades.
     */
    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ═══════════════════════════════════════════════════════
    //              REQUIRED OVERRIDES (Solidity)
    // ═══════════════════════════════════════════════════════

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._update(from, to, value);
    }

    function nonces(
        address owner_
    ) public view override(ERC20PermitUpgradeable, NoncesUpgradeable) returns (uint256) {
        return super.nonces(owner_);
    }
}
