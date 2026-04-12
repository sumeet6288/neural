// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library MathUtils {
    uint256 internal constant PRECISION = 1e18;
    uint256 internal constant BASIS_POINTS = 10000;
    uint256 internal constant CYCLE_DURATION = 12 hours;
    uint256 internal constant PERIODS_PER_YEAR = 730; // 365 * 2 (12-hour cycles)
    
    /**
     * @notice Calculate compound interest: A = P * (1 + r/n)^(n*t)
     * @param principal Initial amount
     * @param annualRate Annual rate in basis points (e.g., 8000 = 80%)
     * @param periods Number of compounding periods elapsed
     * @return Final amount after compounding
     */
    function compound(
        uint256 principal,
        uint256 annualRate,
        uint256 periods
    ) internal pure returns (uint256) {
        if (periods == 0 || annualRate == 0) return principal;
        
        // Rate per period: r/n
        uint256 periodRate = (annualRate * PRECISION) / (PERIODS_PER_YEAR * BASIS_POINTS);
        
        // Compound factor: (1 + r/n)^periods
        uint256 compoundFactor = pow(PRECISION + periodRate, periods);
        
        // A = P * compoundFactor / PRECISION
        return (principal * compoundFactor) / PRECISION;
    }
    
    /**
     * @notice Calculate reward from compounding
     */
    function calculateCompoundReward(
        uint256 principal,
        uint256 annualRate,
        uint256 periods
    ) internal pure returns (uint256) {
        uint256 finalAmount = compound(principal, annualRate, periods);
        return finalAmount > principal ? finalAmount - principal : 0;
    }
    
    /**
     * @notice Power function: base^exp
     * Uses binary exponentiation for efficiency
     */
    function pow(uint256 base, uint256 exp) internal pure returns (uint256) {
        if (exp == 0) return PRECISION;
        if (base == 0) return 0;
        
        uint256 result = PRECISION;
        uint256 b = base;
        uint256 e = exp;
        
        while (e > 0) {
            if (e & 1 == 1) {
                result = (result * b) / PRECISION;
            }
            b = (b * b) / PRECISION;
            e >>= 1;
        }
        
        return result;
    }
    
    /**
     * @notice Calculate periods elapsed since start time
     */
    function getPeriodsElapsed(uint256 startTime, uint256 currentTime) internal pure returns (uint256) {
        if (currentTime <= startTime) return 0;
        return (currentTime - startTime) / CYCLE_DURATION;
    }
    
    /**
     * @notice Calculate percentage of a value
     */
    function percentageOf(uint256 value, uint256 percent) internal pure returns (uint256) {
        return (value * percent) / BASIS_POINTS;
    }
    
    /**
     * @notice Calculate minimum of two values
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    /**
     * @notice Calculate maximum of two values
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
    
    /**
     * @notice Calculate weighted average
     */
    function weightedAverage(
        uint256 value1,
        uint256 weight1,
        uint256 value2,
        uint256 weight2
    ) internal pure returns (uint256) {
        uint256 totalWeight = weight1 + weight2;
        if (totalWeight == 0) return 0;
        return ((value1 * weight1) + (value2 * weight2)) / totalWeight;
    }
}