// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IDAO {
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes callData;
        address target;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }
    
    struct ProposalView {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes callData;
        address target;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
    }
    
    function createProposal(string calldata title, string calldata description, address target, bytes calldata callData) external returns (uint256);
    function castVote(uint256 proposalId, bool support) external;
    function executeProposal(uint256 proposalId) external;
    function cancelProposal(uint256 proposalId) external;
    function getVotingPower(address user) external view returns (uint256);
    function getProposal(uint256 proposalId) external view returns (ProposalView memory);
    function state(uint256 proposalId) external view returns (ProposalState);
    
    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Executed, Expired }
    
    event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint256 startTime, uint256 endTime);
    event VoteCast(address indexed voter, uint256 indexed proposalId, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
}
