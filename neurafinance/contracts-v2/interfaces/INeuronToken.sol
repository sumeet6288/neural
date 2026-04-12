// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface INeuronToken is IERC20 {
    // Events
    event Mint(address indexed to, uint256 amount, string reason);
    event Burn(address indexed from, uint256 amount, string reason);
    event FeeDistributed(uint256 treasuryAmount, uint256 liquidityAmount, uint256 burnAmount);
    
    // View functions
    function maxSupply() external view returns (uint256);
    function totalBurned() external view returns (uint256);
    function getCirculatingSupply() external view returns (uint256);
    
    // Minting (controlled)
    function mint(address to, uint256 amount, string calldata reason) external;
    
    // Burning
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    
    // Fee handling
    function setFeeExempt(address account, bool exempt) external;
    function isFeeExempt(address account) external view returns (bool);
}