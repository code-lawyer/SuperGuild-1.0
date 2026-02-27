// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// VCP Token Interface (Polygon)
// Address: 0xeCB0dF107EF3470218f96907a055D63736E76BD6
interface IVCPToken is IERC20, IERC20Metadata {
    // Specific VCP functions if any (e.g. minting, burning, roles)
    // For now, it's a standard ERC20, but we define it here for future extensibility
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}
