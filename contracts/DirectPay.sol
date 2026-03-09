// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DirectPay
 * @notice SuperGuild self-managed collab payment router.
 *
 * Zero-escrow design: USDC passes through atomically (contract balance always 0).
 * The Paid event links on-chain payment to a Supabase collab ID for VCP indexing.
 *
 * VCP trigger: backend listens for Paid events, mints 50% VCP via VCPToken.mint().
 */
contract DirectPay is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    event Paid(
        bytes32 indexed collabId,
        address indexed publisher,
        address indexed worker,
        uint256 amount
    );

    error ZeroAmount();
    error ZeroAddress();

    constructor(address _usdc) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Publisher pays worker for a collab milestone.
     *         Caller must have approved this contract for `amount` USDC beforehand.
     * @param collabId  bytes32 collab identifier (keccak256 of Supabase collab UUID)
     * @param worker    Worker's wallet address
     * @param amount    USDC amount (6 decimals)
     */
    function pay(
        bytes32 collabId,
        address worker,
        uint256 amount
    ) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (worker == address(0)) revert ZeroAddress();

        usdc.safeTransferFrom(msg.sender, worker, amount);

        emit Paid(collabId, msg.sender, worker, amount);
    }
}
