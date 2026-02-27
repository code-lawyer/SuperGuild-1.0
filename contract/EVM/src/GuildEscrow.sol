// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IVCPToken.sol";

// Minimal Aave V3 Pool Interface
interface IPool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

/**
 * @title GuildEscrow
 * @dev Decentralized escrow engine with Aave V3 yield generation for P2P Collaborations
 */
contract GuildEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IPool public immutable aavePool;
    IVCPToken public vcpToken;

    struct EscrowTask {
        uint256 boardId;
        uint256 taskId;
        address creator;
        address token;
        uint256 principalAmount;
        bool isLocked;
        bool isSettled;
    }

    // Mapping from a composite ID (hash of boardId & taskId) to the Escrow details
    mapping(bytes32 => EscrowTask) public escrowedTasks;

    // Total yield generated globally by this contract, claimable by Guild DAO
    mapping(address => uint256) public guildTreasuryYield;

    event FundsLocked(
        bytes32 indexed escrowId,
        uint256 boardId,
        uint256 taskId,
        address indexed creator,
        address token,
        uint256 amount
    );

    event FundsSettled(
        bytes32 indexed escrowId,
        address indexed worker,
        address token,
        uint256 principal,
        uint256 yieldGenerated
    );

    event YieldClaimed(address token, uint256 amount);

    event MilestoneSettled(
        bytes32 indexed escrowId,
        uint256 indexed boardId,
        uint256 indexed taskId,
        address worker,
        uint256 vcpMinted
    );

    /**
     * @param _aavePool Address of the Aave V3 Pool on the target network
     * @param _vcpToken Address of the VCP ERC-5192 Soulbound Token
     */
    constructor(address _aavePool, address _vcpToken) Ownable(msg.sender) {
        require(_aavePool != address(0), "Invalid Aave Pool address");
        require(_vcpToken != address(0), "Invalid VCP Token address");
        aavePool = IPool(_aavePool);
        vcpToken = IVCPToken(_vcpToken);
    }

    /**
     * @dev Lock funds into the Escrow and immediately supply to Aave to start generating yield.
     */
    function lockTaskFunds(
        uint256 _boardId,
        uint256 _taskId,
        address _token,
        uint256 _amount
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(_token != address(0), "Invalid token address");

        bytes32 escrowId = getEscrowId(_boardId, _taskId);
        require(!escrowedTasks[escrowId].isLocked, "Task already locked in escrow");

        // 1. Transfer funds from user (Creator) to this Escrow
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // 2. Approve Aave Pool to spend the token
        IERC20(_token).approve(address(aavePool), _amount);

        // 3. Supply tokens to Aave V3 to start earning aTokens (yield)
        aavePool.supply(_token, _amount, address(this), 0);

        // 4. Record Escrow Data
        escrowedTasks[escrowId] = EscrowTask({
            boardId: _boardId,
            taskId: _taskId,
            creator: msg.sender,
            token: _token,
            principalAmount: _amount,
            isLocked: true,
            isSettled: false
        });

        emit FundsLocked(escrowId, _boardId, _taskId, msg.sender, _token, _amount);
    }

    /**
     * @dev Settles the task. The principal is transferred to the worker, and any accrued yield
     * remains in the contract as Guild Treasury Revenue. 
     * In a full implementation, this should only be callable by the verified BountyBoard or the Creator.
     */
    function settleTaskFunds(
        uint256 _boardId,
        uint256 _taskId,
        address _worker
    ) external nonReentrant {
        bytes32 escrowId = getEscrowId(_boardId, _taskId);
        EscrowTask storage task = escrowedTasks[escrowId];

        require(task.isLocked, "Task is not locked");
        require(!task.isSettled, "Task is already settled");
        // Simplified authorization mechanism for MVP: only creator or owner can settle
        require(msg.sender == task.creator || msg.sender == owner(), "Unauthorized to settle");

        task.isSettled = true;
        uint256 principal = task.principalAmount;
        address token = task.token;

        // Note on Aave: Withdrawing `type(uint256).max` withdraws the entire balance + yield.
        // For precision in this module, we withdraw exactly the principal.
        // We will then withdraw the remainder (the yield) in a separate sweep, or just leave aTokens.

        // 1. Withdraw Principal from Aave
        uint256 withdrawnPrincipal = aavePool.withdraw(token, principal, address(this));
        require(withdrawnPrincipal >= principal, "Withdrawal failed or insufficient liquidity");

        // 2. Transfer Principal to Worker
        IERC20(token).safeTransfer(_worker, principal);

        // 3. Mint VCP Token Reputation (10% of Principal value simplified for MVP)
        uint256 vcpReward = principal / 10;
        vcpToken.mint(_worker, vcpReward);

        // 4. Emit MilestoneSettled for Alchemy Webhook
        emit MilestoneSettled(escrowId, _boardId, _taskId, _worker, vcpReward);

        // Note: The aTokens generated as yield remain in this contract and accumulate.
        // The Guild owner can claim them later using `claimYield`.

        // Since we didn't withdraw the yield side above, let's just log it generically.
        // Real yield calculation requires tracking the exact aToken balance before and after.
        emit FundsSettled(escrowId, _worker, token, principal, 0); // 0 yield tracked per-transaction for simplicity
    }

    /**
     * @dev Allows Guild DAO to withdraw all accumulated interest (yield) for a specific token.
     */
    function claimYield(address _token, address _aToken) external onlyOwner nonReentrant {
        // Find how many aTokens we have
        uint256 totalATokens = IERC20(_aToken).balanceOf(address(this));
        
        // Find total locked principal across all unresolved tasks for this token
        // In a production contract, we would track totalLockedPrincipal globally.
        // Here, we just assume that any withdrawable amount BEYOND locked principal is yield.
        
        // Since we are mocking the interaction, if we withdraw type(uint256).max, it takes everything 
        // including locked principal! So we must calculate:
        // Yield = totalATokens - activeLockedPrincipal
        // [Stub implementation]
    }

    // --- Helper Functions ---

    function getEscrowId(uint256 _boardId, uint256 _taskId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_boardId, _taskId));
    }
}
