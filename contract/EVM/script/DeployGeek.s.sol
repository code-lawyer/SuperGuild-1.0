// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VCPTokenV2.sol";
import "../src/MedalNFT.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployGeek
 * @dev Deploys VCPTokenV2 behind a UUPS proxy + MedalNFT
 *
 * Usage:
 *   forge script script/DeployGeek.s.sol:DeployGeek \
 *     --rpc-url $RPC_URL --broadcast
 *
 * Environment Variables:
 *   MNEMONIC       - Hot wallet mnemonic (deployer)
 *   COLD_WALLET    - Cold wallet address (admin)
 */
contract DeployGeek is Script {
    function run() external {
        // Derive hot wallet from mnemonic
        string memory mnemonic = vm.envString("MNEMONIC");
        (address hotWallet, uint256 hotKey) = deriveRememberKey(mnemonic, 0);

        address coldWallet = vm.envAddress("COLD_WALLET");

        console.log("=== Super Guild Deployment ===");
        console.log("Hot Wallet (Minter):", hotWallet);
        console.log("Cold Wallet (Admin):", coldWallet);

        vm.startBroadcast(hotKey);

        // ─── 1. Deploy VCP Implementation ───
        VCPTokenV2 vcpImpl = new VCPTokenV2();
        console.log("VCP Implementation:", address(vcpImpl));

        // ─── 2. Deploy UUPS Proxy ───
        bytes memory initData = abi.encodeCall(
            VCPTokenV2.initialize,
            (coldWallet, hotWallet)
        );
        ERC1967Proxy vcpProxy = new ERC1967Proxy(address(vcpImpl), initData);
        console.log("VCP Proxy (use this address):", address(vcpProxy));

        // ─── 3. Deploy Medal NFT ───
        MedalNFT medal = new MedalNFT(address(vcpProxy), "https://arweave.net/");
        console.log("Medal NFT:", address(medal));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Save these addresses to your .env file!");
    }
}
