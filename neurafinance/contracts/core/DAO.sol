// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IDAO.sol";
import "../interfaces/IStaking.sol";
import "../interfaces/INeuronToken.sol";
import "../libraries/SafeMath.sol";

contract DAO is IDAO {
    using SafeMath for uint256;
    
    // Proposal storage
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // Configuration
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 7 days;
    uint256 public proposalThreshold = 10000 * 10**18; // 10k tokens to propose
    uint256 public quorumVotes = 100000 * 10**18; // 100k votes required
    
    // Contracts
    IStaking public stakingContract;
    INeuronToken public neuronToken;
    
    address public owner;
    address public pendingOwner;
    address public timelock;
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TimelockUpdated(address indexed timelock);
    event VotingConfigUpdated(uint256 delay, uint256 period, uint256 threshold, uint256 quorum);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "DAO: not owner");
        _;
    }
    
    modifier onlyTimelock() {
        require(msg.sender == timelock, "DAO: not timelock");
        _;
    }
    
    constructor(address _staking, address _token) {
        owner = msg.sender;
        stakingContract = IStaking(_staking);
        neuronToken = INeuronToken(_token);
    }
    
    function createProposal(
        string calldata title,
        string calldata description,
        address target,
        bytes calldata callData
    ) external override returns (uint256) {
        require(getVotingPower(msg.sender) >= proposalThreshold, "DAO: below proposal threshold");
        require(target != address(0), "DAO: zero target");
        
        uint256 proposalId = proposalCount++;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.callData = callData;
        newProposal.target = target;
        newProposal.startTime = block.timestamp.add(votingDelay);
        newProposal.endTime = newProposal.startTime.add(votingPeriod);
        newProposal.executed = false;
        newProposal.canceled = false;
        
        emit ProposalCreated(proposalId, msg.sender, title, newProposal.startTime, newProposal.endTime);
        
        return proposalId;
    }
    
    function castVote(uint256 proposalId, bool support) external override {
        Proposal storage proposal = proposals[proposalId];
        
        require(state(proposalId) == ProposalState.Active, "DAO: voting not active");
        require(!proposal.hasVoted[msg.sender], "DAO: already voted");
        
        uint256 votes = getVotingPower(msg.sender);
        require(votes > 0, "DAO: no voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.forVotes = proposal.forVotes.add(votes);
        } else {
            proposal.againstVotes = proposal.againstVotes.add(votes);
        }
        
        emit VoteCast(msg.sender, proposalId, support, votes);
    }
    
    function executeProposal(uint256 proposalId) external override {
        require(state(proposalId) == ProposalState.Succeeded, "DAO: proposal not succeeded");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        
        // Execute the proposal call
        (bool success, ) = proposal.target.call(proposal.callData);
        require(success, "DAO: execution failed");
        
        emit ProposalExecuted(proposalId);
    }
    
    function cancelProposal(uint256 proposalId) external override {
        Proposal storage proposal = proposals[proposalId];
        
        require(
            msg.sender == proposal.proposer || 
            msg.sender == owner ||
            getVotingPower(proposal.proposer) < proposalThreshold,
            "DAO: cannot cancel"
        );
        require(state(proposalId) != ProposalState.Executed, "DAO: already executed");
        
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId);
    }
    
    function state(uint256 proposalId) public view override returns (ProposalState) {
        require(proposalId < proposalCount, "DAO: invalid proposal id");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.canceled) {
            return ProposalState.Canceled;
        }
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.timestamp <= proposal.startTime) {
            return ProposalState.Pending;
        }
        
        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }
        
        if (proposal.forVotes.add(proposal.againstVotes) < quorumVotes) {
            return ProposalState.Defeated;
        }
        
        if (proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        }
        
        return ProposalState.Succeeded;
    }
    
    function getVotingPower(address user) public view override returns (uint256) {
        // Voting power = staked amount + (rank bonus if applicable)
        uint256 staked = stakingContract.getTotalStaked(user);
        
        // Add token balance as well
        uint256 balance = neuronToken.balanceOf(user);
        
        return staked.add(balance);
    }
    
    function getProposal(uint256 proposalId) external view override returns (ProposalView memory) {
        Proposal storage p = proposals[proposalId];
        return ProposalView({
            id: p.id,
            proposer: p.proposer,
            title: p.title,
            description: p.description,
            callData: p.callData,
            target: p.target,
            forVotes: p.forVotes,
            againstVotes: p.againstVotes,
            startTime: p.startTime,
            endTime: p.endTime,
            executed: p.executed,
            canceled: p.canceled
        });
    }
    
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }
    
    // Admin functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DAO: zero address");
        pendingOwner = newOwner;
    }
    
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "DAO: not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
    
    function setTimelock(address _timelock) external onlyOwner {
        timelock = _timelock;
        emit TimelockUpdated(_timelock);
    }
    
    function setVotingConfig(
        uint256 _delay,
        uint256 _period,
        uint256 _threshold,
        uint256 _quorum
    ) external onlyOwner {
        votingDelay = _delay;
        votingPeriod = _period;
        proposalThreshold = _threshold;
        quorumVotes = _quorum;
        emit VotingConfigUpdated(_delay, _period, _threshold, _quorum);
    }
    
    function setStakingContract(address _staking) external onlyOwner {
        stakingContract = IStaking(_staking);
    }
    
    function setTokenContract(address _token) external onlyOwner {
        neuronToken = INeuronToken(_token);
    }
}
