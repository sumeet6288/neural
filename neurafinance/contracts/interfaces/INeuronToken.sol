// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC20.sol";

interface INeuronToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function setFeeRecipients(address treasury, address liquidity, address rewards) external;
    function setFeePercentages(uint256 buyFee, uint256 sellFee) external;
    function setMaxTxAmount(uint256 maxTxAmount) external;
    function whitelistAddress(address account, bool isWhitelisted) external;
    function isWhitelisted(address account) external view returns (bool);
    
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event FeeDistributed(address indexed recipient, uint256 amount, string feeType);
}
