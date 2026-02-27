// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VCPTokenV2.sol";
import "../src/MedalNFT.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract VCPTokenV2Test is Test {
    VCPTokenV2 public vcp;
    MedalNFT public medal;

    address public coldWallet = address(0xC01D);
    address public hotWallet = address(0x707);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public badGuy = address(0xBAD);

    function setUp() public {
        // Deploy implementation
        VCPTokenV2 impl = new VCPTokenV2();

        // Deploy proxy
        bytes memory initData = abi.encodeCall(
            VCPTokenV2.initialize,
            (coldWallet, hotWallet)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        vcp = VCPTokenV2(address(proxy));

        // Deploy Medal
        medal = new MedalNFT(address(vcp), "https://arweave.net/");
    }

    // ══════════════════════════════════════════════
    //               BASIC PROPERTIES
    // ══════════════════════════════════════════════

    function testNameAndSymbol() public view {
        assertEq(vcp.name(), "Super Guild VCP");
        assertEq(vcp.symbol(), "VCP");
    }

    function testDecimalsIsZero() public view {
        assertEq(vcp.decimals(), 0);
    }

    function testLockedReturnsTrue() public view {
        assertTrue(vcp.locked());
    }

    // ══════════════════════════════════════════════
    //                   MINTING
    // ══════════════════════════════════════════════

    function testHotWalletCanMint() public {
        vm.prank(hotWallet);
        vcp.mint(user1, 100, "Task #1 settled");
        assertEq(vcp.balanceOf(user1), 100);
    }

    function testMintEmitsEvent() public {
        vm.prank(hotWallet);
        vm.expectEmit(true, false, false, true);
        emit VCPTokenV2.VCPMinted(user1, 50, "Welcome bonus");
        vcp.mint(user1, 50, "Welcome bonus");
    }

    function testColdWalletCannotMint() public {
        vm.prank(coldWallet);
        vm.expectRevert();
        vcp.mint(user1, 100, "Unauthorized");
    }

    function testRandomUserCannotMint() public {
        vm.prank(user1);
        vm.expectRevert();
        vcp.mint(user1, 100, "Unauthorized");
    }

    function testCannotMintToZeroAddress() public {
        vm.prank(hotWallet);
        vm.expectRevert(VCPTokenV2.MintToZeroAddress.selector);
        vcp.mint(address(0), 100, "bad");
    }

    // ══════════════════════════════════════════════
    //              NON-TRANSFERABLE
    // ══════════════════════════════════════════════

    function testTransferReverts() public {
        vm.prank(hotWallet);
        vcp.mint(user1, 100, "Setup");

        vm.prank(user1);
        vm.expectRevert(VCPTokenV2.TransfersDisabled.selector);
        vcp.transfer(user2, 50);
    }

    function testTransferFromReverts() public {
        vm.prank(user1);
        vm.expectRevert(VCPTokenV2.TransfersDisabled.selector);
        vcp.transferFrom(user1, user2, 50);
    }

    function testApproveReverts() public {
        vm.prank(user1);
        vm.expectRevert(VCPTokenV2.TransfersDisabled.selector);
        vcp.approve(user2, 50);
    }

    // ══════════════════════════════════════════════
    //                 BLACKLIST
    // ══════════════════════════════════════════════

    function testBlacklistPreventsReceivingMint() public {
        vm.prank(coldWallet);
        vcp.addBlacklist(badGuy);

        vm.prank(hotWallet);
        vm.expectRevert(abi.encodeWithSelector(VCPTokenV2.AddressBlacklisted.selector, badGuy));
        vcp.mint(badGuy, 100, "Should fail");
    }

    function testUnblacklistAllowsMint() public {
        vm.prank(coldWallet);
        vcp.addBlacklist(badGuy);

        vm.prank(coldWallet);
        vcp.removeBlacklist(badGuy);

        vm.prank(hotWallet);
        vcp.mint(badGuy, 100, "Unbanned");
        assertEq(vcp.balanceOf(badGuy), 100);
    }

    function testOnlyAdminCanBlacklist() public {
        vm.prank(hotWallet);
        vm.expectRevert();
        vcp.addBlacklist(badGuy);
    }

    // ══════════════════════════════════════════════
    //                 PAUSABLE
    // ══════════════════════════════════════════════

    function testPausePreventsMint() public {
        vm.prank(coldWallet);
        vcp.pause();

        vm.prank(hotWallet);
        vm.expectRevert();
        vcp.mint(user1, 100, "Should fail");
    }

    function testUnpauseAllowsMint() public {
        vm.prank(coldWallet);
        vcp.pause();

        vm.prank(coldWallet);
        vcp.unpause();

        vm.prank(hotWallet);
        vcp.mint(user1, 100, "Works again");
        assertEq(vcp.balanceOf(user1), 100);
    }

    // ══════════════════════════════════════════════
    //              VOTES (ERC20Votes)
    // ══════════════════════════════════════════════

    function testDelegateAndGetVotes() public {
        vm.prank(hotWallet);
        vcp.mint(user1, 100, "Setup votes");

        // User must self-delegate to activate voting power
        vm.prank(user1);
        vcp.delegate(user1);

        assertEq(vcp.getVotes(user1), 100);
    }

    function testDelegateToAnother() public {
        vm.prank(hotWallet);
        vcp.mint(user1, 100, "Setup");

        // User1 delegates to User2
        vm.prank(user1);
        vcp.delegate(user2);

        assertEq(vcp.getVotes(user1), 0);
        assertEq(vcp.getVotes(user2), 100);
    }

    // ══════════════════════════════════════════════
    //                BURN (Admin)
    // ══════════════════════════════════════════════

    function testAdminCanBurn() public {
        vm.prank(hotWallet);
        vcp.mint(user1, 100, "Setup");

        vm.prank(coldWallet);
        vcp.burn(user1, 30);

        assertEq(vcp.balanceOf(user1), 70);
    }

    function testNonAdminCannotBurn() public {
        vm.prank(hotWallet);
        vcp.mint(user1, 100, "Setup");

        vm.prank(hotWallet);
        vm.expectRevert();
        vcp.burn(user1, 30);
    }

    // ══════════════════════════════════════════════
    //           MEDAL NFT INTEGRATION
    // ══════════════════════════════════════════════

    function testMedalDynamicTraitsWithIntegerVCP() public {
        // Mint integer VCP (decimals=0)
        vm.prank(hotWallet);
        vcp.mint(user1, 500, "Task settlement");

        // Mint medal
        medal.mint(user1, 1);

        // Glow: (500 * 255) / 1000 = 127
        bytes32 glow = medal.getTraitValue(1, "glow_intensity");
        assertEq(uint256(glow), 127);

        // Rank: 500 >= 500 → Master (2)
        bytes32 rank = medal.getTraitValue(1, "reputation_rank");
        assertEq(uint256(rank), 2);
    }
}
