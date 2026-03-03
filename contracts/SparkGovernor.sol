// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVCPToken {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function getVotes(address account) external view returns (uint256);
}

/**
 * @title SparkGovernor
 * @notice 星火广场提案 + 联署 + 链上表决合约
 *
 * 流程:
 *   1. createProposal() — 花 1 USDC 创建提案
 *   2. cosign()         — VCP 持有者联署（仅 gas）
 *   3. 当联署人 VCP 总和 ≥ totalSupply 的 1% → 自动激活
 *   4. castVote()       — 链上投票（按 getVotes 加权）
 *   5. finalizeProposal() — 投票期结束后结算
 */
contract SparkGovernor is Ownable, ReentrancyGuard {
    // ── 常量 ──
    uint256 public constant PROPOSAL_FEE = 1e6;       // 1 USDC (6 decimals)
    uint256 public constant THRESHOLD_BPS = 100;       // 1% = 100 basis points
    uint256 public constant VOTING_PERIOD = 3 days;

    IERC20 public immutable usdc;
    IVCPToken public immutable vcp;
    address public treasury;

    // ── 提案状态 ──
    enum Status { Signaling, Active, Passed, Rejected, Canceled }

    struct Proposal {
        address proposer;
        bytes32 contentHash;
        uint256 totalVCPSignaled;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 activatedAt;
        Status status;
        uint256 cosignerCount;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasCosigned;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // ── 事件 ──
    event ProposalCreated(uint256 indexed id, address proposer, bytes32 contentHash);
    event Cosigned(uint256 indexed id, address cosigner, uint256 vcpBalance);
    event ProposalActivated(uint256 indexed id, uint256 totalVCP);
    event VoteCast(uint256 indexed id, address voter, bool support, uint256 weight);
    event ProposalFinalized(uint256 indexed id, Status result);

    constructor(address _usdc, address _vcp, address _treasury) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        vcp = IVCPToken(_vcp);
        treasury = _treasury;
    }

    // ── 提案发起 (花费 1 USDC) ──
    function createProposal(bytes32 contentHash) external nonReentrant returns (uint256) {
        uint256 proposerVCP = vcp.balanceOf(msg.sender);
        require(proposerVCP > 0, "Must hold VCP");

        require(usdc.transferFrom(msg.sender, treasury, PROPOSAL_FEE), "USDC transfer failed");

        uint256 id = ++proposalCount;
        proposals[id] = Proposal({
            proposer: msg.sender,
            contentHash: contentHash,
            totalVCPSignaled: proposerVCP,
            votesFor: 0,
            votesAgainst: 0,
            activatedAt: 0,
            status: Status.Signaling,
            cosignerCount: 0
        });

        hasCosigned[id][msg.sender] = true;

        emit ProposalCreated(id, msg.sender, contentHash);

        _checkThreshold(id);

        return id;
    }

    // ── 附议联署 (仅 gas) ──
    function cosign(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.status == Status.Signaling, "Not in signaling phase");
        require(!hasCosigned[proposalId][msg.sender], "Already cosigned");

        uint256 cosignerVCP = vcp.balanceOf(msg.sender);
        require(cosignerVCP > 0, "Must hold VCP");

        hasCosigned[proposalId][msg.sender] = true;
        p.totalVCPSignaled += cosignerVCP;
        p.cosignerCount++;

        emit Cosigned(proposalId, msg.sender, cosignerVCP);

        _checkThreshold(proposalId);
    }

    // ── 链上投票 ──
    function castVote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(p.status == Status.Active, "Not in voting phase");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(block.timestamp <= p.activatedAt + VOTING_PERIOD, "Voting ended");

        uint256 weight = vcp.getVotes(msg.sender);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    // ── 结算提案 ──
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.status == Status.Active, "Not active");
        require(block.timestamp > p.activatedAt + VOTING_PERIOD, "Voting not ended");

        p.status = p.votesFor > p.votesAgainst ? Status.Passed : Status.Rejected;
        emit ProposalFinalized(proposalId, p.status);
    }

    // ── 内部：阈值检查 ──
    function _checkThreshold(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];
        uint256 threshold = vcp.totalSupply() * THRESHOLD_BPS / 10000;

        if (p.totalVCPSignaled >= threshold) {
            p.status = Status.Active;
            p.activatedAt = block.timestamp;
            emit ProposalActivated(proposalId, p.totalVCPSignaled);
        }
    }

    // ── View 函数 ──
    function getProposal(uint256 id) external view returns (Proposal memory) {
        return proposals[id];
    }

    function getThreshold() external view returns (uint256) {
        return vcp.totalSupply() * THRESHOLD_BPS / 10000;
    }

    function getVotingDeadline(uint256 id) external view returns (uint256) {
        Proposal storage p = proposals[id];
        if (p.activatedAt == 0) return 0;
        return p.activatedAt + VOTING_PERIOD;
    }
}
