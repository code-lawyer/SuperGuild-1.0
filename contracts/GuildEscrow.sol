// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GuildEscrow
 * @notice SuperGuild P2P collaboration escrow with optimistic milestone settlement.
 *
 * Settlement flow per milestone:
 *   1. publisher.deposit()           → locks USDC, creates milestone structure
 *   2. worker.submitProof()          → submits deliverable hash, starts 7-day window
 *   3a. publisher.confirmMilestone() → immediate USDC release to worker
 *   3b. resolver.autoRelease()       → optimistic release after 7-day window (hot wallet)
 *   3c. publisher.disputeMilestone() → 10% penalty to treasury, enters arbitration
 *   4.  resolver.resolveDispute()    → Hand of Justice result applied (hot wallet)
 *
 * Cross-chain note:
 *   Hand of Justice NFT (#4) lives on Sepolia ETH; this contract runs on Arbitrum Sepolia.
 *   NFT ownership is verified off-chain by the backend. The `resolver` hot wallet submits
 *   the final arbitration outcome on-chain after tallying votes from NFT holders.
 *   This resolver address is upgradeable by the owner for future decentralization.
 *
 * VCP mint trigger:
 *   Listen for MilestoneSettled events. When isAllSettled() returns true for a collabId,
 *   the hot wallet calls VCPToken.mint() for the worker.
 */
contract GuildEscrow is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Constants ────────────────────────────────────────────────────────────
    uint256 public constant OPTIMISTIC_WINDOW = 7 days;
    uint256 public constant DISPUTE_FEE_BPS   = 1000;  // 10%
    uint256 public constant BPS_DENOMINATOR   = 10000;

    // ── Storage ──────────────────────────────────────────────────────────────
    IERC20  public immutable usdc;
    address public treasury;
    address public resolver; // hot wallet: calls autoRelease + resolveDispute

    enum MilestoneStatus {
        Locked,    // funded, waiting for proof submission
        Submitted, // proof on-chain, 7-day optimistic window running
        Settled,   // USDC released to worker
        Disputed,  // in arbitration (10% already sent to treasury)
        Cancelled  // refunded to publisher
    }

    struct Milestone {
        uint256         amount;       // USDC amount (6 decimals)
        bytes32         contentHash;  // keccak256 of deliverable evidence
        uint256         submittedAt;  // block.timestamp of submitProof call
        MilestoneStatus status;
    }

    struct Collab {
        address publisher;
        address worker;
        uint256 milestoneCount;
        bool    cancelled;
        mapping(uint256 => Milestone) milestones;
    }

    mapping(bytes32 => Collab)  private _collabs;
    mapping(address => bool)    public  blacklist;

    // ── Events ───────────────────────────────────────────────────────────────
    event Deposited(
        bytes32 indexed collabId,
        address indexed publisher,
        address indexed worker,
        uint256 totalAmount,
        uint256 milestoneCount
    );
    event ProofSubmitted(
        bytes32 indexed collabId,
        uint256 milestoneIdx,
        bytes32 contentHash,
        uint256 deadline
    );
    event MilestoneSettled(
        bytes32 indexed collabId,
        uint256 milestoneIdx,
        address indexed worker,
        uint256 amount
    );
    event MilestoneDisputed(
        bytes32 indexed collabId,
        uint256 milestoneIdx,
        uint256 penaltyToTreasury,
        uint256 heldForArbitration
    );
    event DisputeResolved(
        bytes32 indexed collabId,
        uint256 milestoneIdx,
        bool    workerWon,
        address indexed recipient,
        uint256 amount
    );
    event CollabCancelled(bytes32 indexed collabId, uint256 refundAmount);
    event AddedToBlacklist(address indexed account, bytes32 indexed collabId);
    event TreasuryUpdated(address indexed newTreasury);
    event ResolverUpdated(address indexed newResolver);

    // ── Errors ───────────────────────────────────────────────────────────────
    error CollabAlreadyExists();
    error CollabNotFound();
    error NotPublisher();
    error NotWorker();
    error NotResolver();
    error InvalidMilestoneAmounts();
    error WrongMilestoneStatus(MilestoneStatus expected, MilestoneStatus actual);
    error OptimisticWindowNotExpired();
    error CollabAlreadyCancelled();
    error Blacklisted();
    error ZeroAddress();
    error MilestoneIndexOutOfRange();

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _usdc,
        address _treasury,
        address _resolver
    ) Ownable(msg.sender) {
        if (_usdc == address(0) || _treasury == address(0) || _resolver == address(0))
            revert ZeroAddress();
        usdc      = IERC20(_usdc);
        treasury  = _treasury;
        resolver  = _resolver;
    }

    // ── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyPublisher(bytes32 collabId) {
        if (_collabs[collabId].publisher != msg.sender) revert NotPublisher();
        _;
    }

    modifier onlyWorker(bytes32 collabId) {
        if (_collabs[collabId].worker != msg.sender) revert NotWorker();
        _;
    }

    modifier onlyResolver() {
        if (msg.sender != resolver) revert NotResolver();
        _;
    }

    modifier notCancelled(bytes32 collabId) {
        if (_collabs[collabId].cancelled) revert CollabAlreadyCancelled();
        _;
    }

    modifier notBlacklisted() {
        if (blacklist[msg.sender]) revert Blacklisted();
        _;
    }

    // ── Publisher: Deposit ───────────────────────────────────────────────────

    /**
     * @notice Publisher creates a collab and deposits USDC for all milestones.
     * @param collabId  bytes32 identifier (frontend: keccak256(collabUUID))
     * @param worker    Worker's wallet address
     * @param amounts   USDC amount per milestone in order (6 decimals each)
     *
     * Requirements:
     * - Caller must have approved this contract for sum(amounts) USDC
     * - collabId must not already exist
     * - All amounts must be > 0
     */
    function deposit(
        bytes32          collabId,
        address          worker,
        uint256[] calldata amounts
    ) external nonReentrant notBlacklisted {
        if (_collabs[collabId].publisher != address(0)) revert CollabAlreadyExists();
        if (worker == address(0))                       revert ZeroAddress();
        if (amounts.length == 0)                        revert InvalidMilestoneAmounts();

        uint256 total;
        for (uint256 i; i < amounts.length; ++i) {
            if (amounts[i] == 0) revert InvalidMilestoneAmounts();
            total += amounts[i];
        }

        Collab storage c = _collabs[collabId];
        c.publisher      = msg.sender;
        c.worker         = worker;
        c.milestoneCount = amounts.length;

        for (uint256 i; i < amounts.length; ++i) {
            c.milestones[i] = Milestone({
                amount:      amounts[i],
                contentHash: bytes32(0),
                submittedAt: 0,
                status:      MilestoneStatus.Locked
            });
        }

        usdc.safeTransferFrom(msg.sender, address(this), total);

        emit Deposited(collabId, msg.sender, worker, total, amounts.length);
    }

    // ── Worker: Submit Proof ─────────────────────────────────────────────────

    /**
     * @notice Worker submits evidence hash for a milestone.
     *         Starts the 7-day optimistic window.
     * @param contentHash  keccak256 of all deliverable URLs + file hashes
     */
    function submitProof(
        bytes32 collabId,
        uint256 milestoneIdx,
        bytes32 contentHash
    ) external nonReentrant notBlacklisted notCancelled(collabId) onlyWorker(collabId) {
        Milestone storage m = _milestone(collabId, milestoneIdx);
        _requireStatus(m, MilestoneStatus.Locked);

        m.contentHash = contentHash;
        m.submittedAt = block.timestamp;
        m.status      = MilestoneStatus.Submitted;

        emit ProofSubmitted(
            collabId,
            milestoneIdx,
            contentHash,
            block.timestamp + OPTIMISTIC_WINDOW
        );
    }

    // ── Publisher: Confirm or Dispute ────────────────────────────────────────

    /**
     * @notice Publisher explicitly approves milestone — releases USDC to worker immediately.
     */
    function confirmMilestone(
        bytes32 collabId,
        uint256 milestoneIdx
    ) external nonReentrant notCancelled(collabId) onlyPublisher(collabId) {
        Milestone storage m = _milestone(collabId, milestoneIdx);
        _requireStatus(m, MilestoneStatus.Submitted);

        uint256 amount = m.amount;
        address worker = _collabs[collabId].worker;
        m.status = MilestoneStatus.Settled;

        usdc.safeTransfer(worker, amount);

        emit MilestoneSettled(collabId, milestoneIdx, worker, amount);
    }

    /**
     * @notice Publisher opens a dispute.
     *         10% of milestone amount is immediately and irrevocably sent to treasury
     *         as a sunk arbitration cost. The remaining 90% is held pending resolution.
     */
    function disputeMilestone(
        bytes32 collabId,
        uint256 milestoneIdx
    ) external nonReentrant notCancelled(collabId) onlyPublisher(collabId) {
        Milestone storage m = _milestone(collabId, milestoneIdx);
        _requireStatus(m, MilestoneStatus.Submitted);

        uint256 penalty = (m.amount * DISPUTE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 held    = m.amount - penalty;
        m.status = MilestoneStatus.Disputed;

        usdc.safeTransfer(treasury, penalty);

        emit MilestoneDisputed(collabId, milestoneIdx, penalty, held);
    }

    // ── Resolver (Hot Wallet): Auto-Release & Arbitration ────────────────────

    /**
     * @notice Optimistically releases USDC to worker after the 7-day window expires.
     *         Called by the platform's hot wallet (resolver) monitoring on-chain deadlines.
     *         Worker is protected: if publisher takes no action, funds auto-release.
     */
    function autoRelease(
        bytes32 collabId,
        uint256 milestoneIdx
    ) external nonReentrant onlyResolver notCancelled(collabId) {
        Milestone storage m = _milestone(collabId, milestoneIdx);
        _requireStatus(m, MilestoneStatus.Submitted);

        if (block.timestamp < m.submittedAt + OPTIMISTIC_WINDOW)
            revert OptimisticWindowNotExpired();

        uint256 amount = m.amount;
        address worker = _collabs[collabId].worker;
        m.status = MilestoneStatus.Settled;

        usdc.safeTransfer(worker, amount);

        emit MilestoneSettled(collabId, milestoneIdx, worker, amount);
    }

    /**
     * @notice Submits final arbitration outcome after Hand of Justice NFT holder vote.
     *         Called by the resolver hot wallet after the backend tallies votes from
     *         Hand of Justice (#4) NFT holders on Sepolia ETH.
     *
     * @param workerWon     true  → 90% held amount released to worker
     *                      false → 90% held amount refunded to publisher
     * @param penalizeLoser true  → losing party is added to blacklist
     */
    function resolveDispute(
        bytes32 collabId,
        uint256 milestoneIdx,
        bool    workerWon,
        bool    penalizeLoser
    ) external nonReentrant onlyResolver {
        Milestone storage m = _milestone(collabId, milestoneIdx);
        _requireStatus(m, MilestoneStatus.Disputed);

        // 10% was already sent to treasury in disputeMilestone(); held = 90%
        uint256 penalty   = (m.amount * DISPUTE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 held      = m.amount - penalty;

        address worker    = _collabs[collabId].worker;
        address publisher = _collabs[collabId].publisher;
        address recipient = workerWon ? worker : publisher;

        m.status = MilestoneStatus.Settled;

        usdc.safeTransfer(recipient, held);

        if (penalizeLoser) {
            address loser = workerWon ? publisher : worker;
            blacklist[loser] = true;
            emit AddedToBlacklist(loser, collabId);
        }

        emit DisputeResolved(collabId, milestoneIdx, workerWon, recipient, held);
    }

    // ── Cancel ───────────────────────────────────────────────────────────────

    /**
     * @notice Publisher cancels the collab and reclaims all Locked milestone funds.
     *         Milestones already in Submitted or Disputed state are NOT refunded here —
     *         those must first be resolved via confirm/dispute/autoRelease.
     *         Milestones already Settled remain settled.
     */
    function cancel(
        bytes32 collabId
    ) external nonReentrant onlyPublisher(collabId) notCancelled(collabId) {
        Collab storage c = _collabs[collabId];
        c.cancelled = true;

        uint256 refund;
        for (uint256 i; i < c.milestoneCount; ++i) {
            Milestone storage m = c.milestones[i];
            if (m.status == MilestoneStatus.Locked) {
                refund += m.amount;
                m.status = MilestoneStatus.Cancelled;
            }
            // Submitted / Disputed milestones must be resolved first
        }

        if (refund > 0) {
            usdc.safeTransfer(c.publisher, refund);
        }

        emit CollabCancelled(collabId, refund);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    function getMilestone(bytes32 collabId, uint256 milestoneIdx)
        external view
        returns (
            uint256         amount,
            bytes32         contentHash,
            uint256         submittedAt,
            MilestoneStatus status,
            uint256         deadline
        )
    {
        Milestone storage m = _milestone(collabId, milestoneIdx);
        deadline = m.submittedAt > 0 ? m.submittedAt + OPTIMISTIC_WINDOW : 0;
        return (m.amount, m.contentHash, m.submittedAt, m.status, deadline);
    }

    function getCollab(bytes32 collabId)
        external view
        returns (
            address publisher,
            address worker,
            uint256 milestoneCount,
            bool    cancelled
        )
    {
        Collab storage c = _collabs[collabId];
        if (c.publisher == address(0)) revert CollabNotFound();
        return (c.publisher, c.worker, c.milestoneCount, c.cancelled);
    }

    /**
     * @notice Returns true when every milestone is Settled.
     *         Backend monitors this to trigger VCP mint via VCPToken.mint().
     */
    function isAllSettled(bytes32 collabId) external view returns (bool) {
        Collab storage c = _collabs[collabId];
        if (c.publisher == address(0)) revert CollabNotFound();
        for (uint256 i; i < c.milestoneCount; ++i) {
            if (c.milestones[i].status != MilestoneStatus.Settled) return false;
        }
        return true;
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setResolver(address _resolver) external onlyOwner {
        if (_resolver == address(0)) revert ZeroAddress();
        resolver = _resolver;
        emit ResolverUpdated(_resolver);
    }

    function removeFromBlacklist(address account) external onlyOwner {
        blacklist[account] = false;
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    function _milestone(bytes32 collabId, uint256 idx)
        internal view
        returns (Milestone storage)
    {
        Collab storage c = _collabs[collabId];
        if (c.publisher == address(0))  revert CollabNotFound();
        if (idx >= c.milestoneCount)    revert MilestoneIndexOutOfRange();
        return c.milestones[idx];
    }

    function _requireStatus(Milestone storage m, MilestoneStatus expected) internal view {
        if (m.status != expected) revert WrongMilestoneStatus(expected, m.status);
    }
}
