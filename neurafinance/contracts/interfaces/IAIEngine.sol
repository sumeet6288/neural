// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAIEngine {
    // NEE - Neural Emission Engine
    function calculateEmission(uint256 totalSupply, uint256 stakedAmount) external view returns (uint256);
    function requestMint(uint256 amount) external;
    function requestBurn(uint256 amount) external;
    
    // ALS - Adaptive Liquidity Stabilizer
    function checkPriceStability() external view returns (bool isStable, uint256 deviation);
    function triggerBuyback(uint256 amount) external;
    function triggerSellPressure(uint256 amount) external;
    
    // ARP - Auto Reinvest Protocol
    function collectFees() external;
    function reinvestToLiquidity(uint256 amount) external;
    function distributeToTreasury(uint256 amount) external;
    
    // SIG - Supply Integrity Guard
    function validateMintRequest(uint256 amount) external view returns (bool);
    function validateSupplyHealth() external view returns (bool);
    function getMaxMintable() external view returns (uint256);
    
    // ALP - Adaptive Logic Predictor
    function adjustEmissionRate() external;
    function adjustRewardRates() external;
    function getSystemHealth() external view returns (uint256 healthScore);
    
    event EmissionCalculated(uint256 amount, uint256 timestamp);
    event BuybackTriggered(uint256 amount, uint256 price);
    event FeesCollected(uint256 amount);
    event SupplyValidated(bool healthy, uint256 ratio);
    event ParametersAdjusted(uint256 emissionRate, uint256 rewardRate);
}
