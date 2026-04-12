// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC20.sol";

interface IStablecoin is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function setTreasury(address _treasury) external;
    function setCollateralRatio(uint256 ratio) external;
    function getCollateralRatio() external view returns (uint256);
    
    event Minted(address indexed to, uint256 amount, uint256 collateral);
    event Burned(address indexed from, uint256 amount);
    event CollateralRatioUpdated(uint256 newRatio);
}
