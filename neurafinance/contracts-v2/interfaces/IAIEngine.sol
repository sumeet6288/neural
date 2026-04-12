// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAIEngine {
    // Module identifiers
    enum ModuleType { NEE, ALS, ARP, SIG, ALP }
    
    // System health data
    struct SystemHealth {
        uint256 treasuryBacking;      // In basis points
        uint256 stakingRatio;         // In basis points
        uint256 priceStability;       // In basis points (10000 = perfect)
        uint256 growthRate;           // Monthly growth in basis points
        uint256 overallScore;         // 0-10000
    }
    
    // Events
    event ModuleTriggered(ModuleType indexed module, uint256 timestamp);
    event HealthUpdated(uint256 newScore, uint256 timestamp);
    event EmissionAdjusted(uint256 oldRate, uint256 newRate);
    event ParametersAdjusted(string param, uint256 oldValue, uint256 newValue);
    
    // View functions
    function getSystemHealth() external view returns (SystemHealth memory);
    function getEmissionRate() external view returns (uint256); // Annual rate in basis points
    function getHealthMultiplier() external view returns (uint256); // In basis points
    function shouldStabilize() external view returns (bool, bool); // (shouldAct, isBuy)
    function validateMintRequest(uint256 amount) external view returns (bool);
    
    // Core cycle function (called every 12 hours)
    function executeCycle() external;
    
    // Individual module triggers
    function triggerNEE() external returns (uint256 emissionAmount);
    function triggerALS() external;
    function triggerARP() external;
    function triggerSIG() external;
    function triggerALP() external;
}