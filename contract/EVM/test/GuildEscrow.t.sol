// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GuildEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 Token
contract MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock Aave Pool
contract MockAavePool is IPool {
    IERC20 public aToken;
    
    constructor(address _aToken) {
        aToken = IERC20(_aToken);
    }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external override {
        // Assume asset is transferred to this pool by the caller
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        
        // Mint same amount of aTokens to the depositor to simulate Aave
        MockToken(address(aToken)).mint(onBehalfOf, amount);
    }

    function withdraw(address asset, uint256 amount, address to) external override returns (uint256) {
        // Burn aTokens from the withdrawer
        // Note: MockToken doesn't have burn exposed by default, so we just transfer from to abstract it out
        aToken.transferFrom(msg.sender, address(this), amount);

        // Transfer raw asset back to the user
        IERC20(asset).transfer(to, amount);

        return amount; // return actual amount withdrawn
    }
}

contract GuildEscrowTest is Test {
    GuildEscrow escrow;
    MockToken token;
    MockToken aToken;
    MockToken vcpToken;
    MockAavePool aavePool;

    address creator = address(0x1);
    address expectedWorker = address(0x2);

    function setUp() public {
        token = new MockToken();
        aToken = new MockToken(); // Simulate aToken
        vcpToken = new MockToken(); // Simulate VCP Souldbound token
        aavePool = new MockAavePool(address(aToken));
        escrow = new GuildEscrow(address(aavePool), address(vcpToken));

        // Fund Creator with 10k tokens
        token.mint(creator, 10000 ether);
    }

    function test_LockTaskFunds() public {
        vm.startPrank(creator);
        // Approve Escrow Contract
        token.approve(address(escrow), 1000 ether);

        // Lock Funds
        escrow.lockTaskFunds(1, 1, address(token), 1000 ether);
        vm.stopPrank();

        bytes32 expectedEscrowId = keccak256(abi.encodePacked(uint256(1), uint256(1)));
        
        (
            uint256 bId, 
            uint256 tId, 
            address cAddr, 
            address tAddr, 
            uint256 prinAmt, 
            bool locked, 
            bool settled
        ) = escrow.escrowedTasks(expectedEscrowId);

        assertEq(bId, 1);
        assertEq(tId, 1);
        assertEq(cAddr, creator);
        assertEq(tAddr, address(token));
        assertEq(prinAmt, 1000 ether);
        assertTrue(locked);
        assertFalse(settled);

        // Also ensure aTokens were minted to the Escrow contract
        assertEq(aToken.balanceOf(address(escrow)), 1000 ether);
        
        // Ensure raw tokens are in Aave Pool
        assertEq(token.balanceOf(address(aavePool)), 1000 ether);
    }

    function test_SettleTaskFunds() public {
        vm.startPrank(creator);
        token.approve(address(escrow), 1000 ether);
        escrow.lockTaskFunds(1, 1, address(token), 1000 ether);

        // Now Settle
        // To be able to settle, Escrow needs to approve Aave to pull aTokens back during withdraw
        // Wait, IPool withdraw doesn't pull aTokens via allowance in standard Aave, you just call withdraw.
        // But our mock uses `transferFrom`, which requires the escrow to approve the aToken for the Aave pool.
        // Let's modify the MockAavePool to just burn/transfer instead so we don't have this artifact!
        // For this test we will just prank the Escrow to approve the pool or we fix the mock!
        vm.stopPrank();

        // Fix mock by giving approval
        vm.prank(address(escrow));
        aToken.approve(address(aavePool), type(uint256).max);

        vm.prank(creator);
        escrow.settleTaskFunds(1, 1, expectedWorker);

        bytes32 expectedEscrowId = keccak256(abi.encodePacked(uint256(1), uint256(1)));
        (,,,,,,bool settled) = escrow.escrowedTasks(expectedEscrowId);
        assertTrue(settled);

        // Worker should get 1000 tokens
        assertEq(token.balanceOf(expectedWorker), 1000 ether);
    }
}
