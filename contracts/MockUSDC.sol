// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Testnet-only ERC-20 that mimics USDC (6 decimals, open mint).
 *         Deploy on Arbitrum Sepolia before deploying GuildEscrow.
 *         DO NOT deploy on mainnet.
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Permissionless mint for testnet faucet use.
     * @param to     Recipient address
     * @param amount Amount in USDC base units (1 USDC = 1_000_000)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
