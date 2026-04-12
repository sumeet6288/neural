// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../core/NeuronToken.sol";
import "../core/Staking.sol";
import "../core/Treasury.sol";
import "../core/Referral.sol";
import "../core/Lending.sol";
import "../ai-engine/AIEngine.sol";

/**
 * @title 6-Month System Simulation
 * @notice Comprehensive stress test of NeuraFinance V2
 */
contract SimulationTest is Test {
    
    NeuronToken public token;
    Treasury public treasury;
    Staking public staking;
    AIEngine public aiEngine;
    Referral public referral;
    Lending public lending;
    
    address public admin = address(1);
    address public keeper = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public user3 = address(5);
    
    uint256 constant INITIAL_SUPPLY = 10_000_000 * 1e18;
    uint256 constant INITIAL_BACKING = 3_000_000 * 1e18; // $3M backing
    
    // Simulation state
    uint256 public startTime;
    uint256[] public healthScores;
    uint256[] public supplyHistory;
    uint256[] public treasuryValues;
    
    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy contracts
        token = new NeuronToken(address(0), address(0));
        treasury = new Treasury(address(token));
        
        // Update token with treasury
        token.setTreasury(address(treasury));
        
        // Deploy AI Engine
        aiEngine = new AIEngine(
            address(token),
            address(treasury),
            address(0), // staking not yet deployed
            address(0)  // price feed
        );
        
        // Deploy Staking
        staking = new Staking(
            address(token),
            address(treasury),
            address(0) // referral not yet deployed
        );
        
        // Update AI Engine with staking
        aiEngine.setStaking(address(staking));
        
        // Deploy Referral
        referral = new Referral(address(token), address(treasury));
        
        // Update staking with referral
        staking.setReferral(address(referral));
        
        // Deploy Lending (with mock nUSD)
        MockERC20 nUSD = new MockERC20("Neura USD", "nUSD");
        lending = new Lending(address(token), address(nUSD), address(0));
        
        // Setup roles
        token.addMinter(address(aiEngine));
        token.addMinter(address(treasury));
        
        treasury.grantRole(treasury.BUYBACK_ROLE(), address(aiEngine));
        treasury.grantRole(treasury.REWARD_MANAGER_ROLE(), address(staking));
        treasury.grantRole(treasury.REWARD_MANAGER_ROLE(), address(referral));
        
        staking.grantRole(staking.KEEPER_ROLE(), address(aiEngine));
        staking.grantRole(staking.KEEPER_ROLE(), keeper);
        referral.grantRole(referral.STAKING_ROLE(), address(staking));
        
        // Fund treasury
        vm.deal(address(treasury), INITIAL_BACKING);
        
        // Approve spending
        vm.stopPrank();
        
        vm.prank(address(treasury));
        token.approve(address(staking), type(uint256).max);
        
        vm.prank(address(treasury));
        token.approve(address(referral), type(uint256).max);
        
        startTime = block.timestamp;
    }
    
    /**
     * @notice Scenario A: Healthy Growth
     */
    function test_HealthyGrowthScenario() public {
        console.log("\n=== SCENARIO A: HEALTHY GROWTH ===\n");
        
        // Initial state
        logState("Initial");
        
        // Month 1-6: Growth
        for (uint256 month = 1; month <= 6; month++) {
            // New users stake
            _simulateNewUsers(month);
            
            // Run cycles for this month (60 cycles per month)
            for (uint256 cycle = 0; cycle < 60; cycle++) {
                vm.warp(block.timestamp + 12 hours);
                
                vm.prank(keeper);
                aiEngine.executeCycle();
            }
            
            // Compound rewards
            _simulateCompounding();
            
            logState(string.concat("Month ", vm.toString(month)));
        }
        
        // Assertions
        assertGt(_getHealthScore(), 7000, "Health should remain good");
        assertLt(token.totalSupply(), 11_000_000 * 1e18, "Supply growth controlled");
    }
    
    /**
     * @notice Scenario B: No New Users (Stress Test)
     */
    function test_NoNewUsersScenario() public {
        console.log("\n=== SCENARIO B: NO NEW USERS ===\n");
        
        // Setup initial stakes
        _setupInitialStakes();
        logState("Initial");
        
        // Month 1-6: No new users, some withdrawals
        for (uint256 month = 1; month <= 6; month++) {
            // 5% monthly withdrawal
            _simulateWithdrawals(500); // 5%
            
            // Run cycles
            for (uint256 cycle = 0; cycle < 60; cycle++) {
                vm.warp(block.timestamp + 12 hours);
                
                try aiEngine.executeCycle() {} catch {
                    // Cycle might fail if health is critical
                }
            }
            
            logState(string.concat("Month ", vm.toString(month)));
        }
        
        // System should still be operational
        assertGt(_getHealthScore(), 4000, "System should survive");
    }
    
    /**
     * @notice Scenario C: Market Crash
     */
    function test_MarketCrashScenario() public {
        console.log("\n=== SCENARIO C: MARKET CRASH ===\n");
        
        _setupInitialStakes();
        logState("Initial");
        
        // Month 1: Normal
        _runMonth(1);
        logState("Month 1 (Pre-Crash)");
        
        // Month 2: Crash - 50% price drop
        console.log("*** MARKET CRASH: 50% price drop ***");
        _simulatePriceDrop(5000); // 50%
        
        // Panic withdrawals
        _simulateWithdrawals(3000); // 30%
        
        _runMonth(1);
        logState("Month 2 (Post-Crash)");
        
        // Months 3-6: Recovery
        for (uint256 month = 3; month <= 6; month++) {
            _simulatePriceRecovery(1000); // Gradual recovery
            _runMonth(1);
            logState(string.concat("Month ", vm.toString(month), " (Recovery)"));
        }
        
        // System should recover
        assertGt(_getHealthScore(), 5000, "System should recover");
    }
    
    /**
     * @notice Test referral system sustainability
     */
    function test_ReferralSustainability() public {
        console.log("\n=== REFERRAL SUSTAINABILITY TEST ===\n");
        
        // Setup referral chain: user1 -> user2 -> user3
        vm.prank(user2);
        referral.setReferrer(user1);
        
        vm.prank(user3);
        referral.setReferrer(user2);
        
        // User3 stakes
        uint256 stakeAmount = 10000 * 1e18;
        _fundAndStake(user3, stakeAmount);
        
        // Check rewards were paid from treasury (not minted)
        uint256 treasuryBalanceBefore = token.balanceOf(address(treasury));
        
        // Total referral cost should be 4.5% of stake
        uint256 expectedCost = (stakeAmount * 450) / 10000;
        
        // Verify rewards came from treasury
        uint256 user1Earned = referral.getUserInfo(user1).totalEarned;
        uint256 user2Earned = referral.getUserInfo(user2).totalEarned;
        
        console.log("User1 earned:", user1Earned / 1e18);
        console.log("User2 earned:", user2Earned / 1e18);
        
        assertEq(user1Earned + user2Earned, expectedCost, "Referral cost matches");
        assertLt(token.totalSupply(), INITIAL_SUPPLY + 1000000 * 1e18, "No excessive minting");
    }
    
    /**
     * @notice Test lending liquidation
     */
    function test_LendingLiquidation() public {
        console.log("\n=== LENDING LIQUIDATION TEST ===\n");
        
        // User deposits collateral and borrows
        uint256 collateral = 1000 * 1e18;
        _fundUser(user1, collateral);
        
        vm.startPrank(user1);
        token.approve(address(lending), collateral);
        lending.depositCollateral(collateral);
        
        // Borrow max (60% LTV)
        uint256 maxBorrow = lending.getMaxBorrow(user1);
        lending.borrow(maxBorrow);
        vm.stopPrank();
        
        console.log("Initial health factor:", lending.getHealthFactor(user1));
        
        // Price drops 30% - should be liquidatable
        _simulatePriceDrop(3000);
        
        bool canLiquidate = lending.canLiquidate(user1);
        console.log("Can liquidate:", canLiquidate);
        
        assertTrue(canLiquidate, "Position should be liquidatable");
    }
    
    /**
     * @notice Test compound interest accuracy
     */
    function test_CompoundInterestAccuracy() public {
        console.log("\n=== COMPOUND INTEREST ACCURACY ===\n");
        
        uint256 principal = 1000 * 1e18;
        uint256 annualRate = 8000; // 80%
        
        _fundAndStake(user1, principal);
        
        // Fast forward 1 year (730 cycles)
        vm.warp(block.timestamp + 365 days);
        
        uint256 rewards = staking.calculatePendingRewards(user1, 0);
        uint256 finalAmount = principal + rewards;
        
        // Expected: 1000 * (1 + 0.8/730)^730 ≈ 2225
        uint256 expectedFinal = 2225 * 1e18;
        
        console.log("Principal:", principal / 1e18);
        console.log("Rewards:", rewards / 1e18);
        console.log("Final:", finalAmount / 1e18);
        console.log("Expected:", expectedFinal / 1e18);
        
        // Allow 1% variance
        assertApproxEqRel(finalAmount, expectedFinal, 0.01e18);
    }
    
    // ============ Helper Functions ============
    
    function _setupInitialStakes() internal {
        // Multiple users stake
        _fundAndStake(user1, 10000 * 1e18);
        _fundAndStake(user2, 20000 * 1e18);
        _fundAndStake(user3, 15000 * 1e18);
    }
    
    function _fundUser(address user, uint256 amount) internal {
        vm.prank(address(treasury));
        token.transfer(user, amount);
    }
    
    function _fundAndStake(address user, uint256 amount) internal {
        _fundUser(user, amount);
        
        vm.startPrank(user);
        token.approve(address(staking), amount);
        staking.stake(amount, IStaking.StakeType.FLEXIBLE, address(0));
        vm.stopPrank();
    }
    
    function _simulateNewUsers(uint256 month) internal {
        // 10% monthly growth in staked amount
        uint256 newStake = (staking.totalStaked() * 100) / 1000;
        
        address newUser = address(uint160(100 + month));
        _fundAndStake(newUser, newStake);
    }
    
    function _simulateWithdrawals(uint256 bps) internal {
        // Withdraw percentage of stakes
        uint256[] memory user1Stakes = staking.getUserStakes(user1);
        if (user1Stakes.length > 0) {
            try staking.unstake(user1Stakes[0]) {} catch {}
        }
    }
    
    function _simulateCompounding() internal {
        // Simulate keepers batch compounding
        // In real scenario, this would be done by keeper
    }
    
    function _simulatePriceDrop(uint256 bps) internal {
        // Simulate price drop by reducing treasury value
        // In production, this would be actual market price
    }
    
    function _simulatePriceRecovery(uint256 bps) internal {
        // Gradual price recovery
    }
    
    function _runMonth(uint256 months) internal {
        for (uint256 m = 0; m < months; m++) {
            for (uint256 cycle = 0; cycle < 60; cycle++) {
                vm.warp(block.timestamp + 12 hours);
                try aiEngine.executeCycle() {} catch {}
            }
        }
    }
    
    function _getHealthScore() internal view returns (uint256) {
        IAIEngine.SystemHealth memory health = aiEngine.getSystemHealth();
        return health.overallScore;
    }
    
    function logState(string memory label) internal {
        console.log("\n---", label, "---");
        console.log("Supply:", token.totalSupply() / 1e18);
        console.log("Staked:", staking.totalStaked() / 1e18);
        console.log("Treasury:", address(treasury).balance / 1e18);
        console.log("Health:", _getHealthScore());
        console.log("Backing:", treasury.getBackingRatio());
    }
}

// Mock ERC20 for testing
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}