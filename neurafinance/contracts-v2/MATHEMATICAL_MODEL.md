# NeuraFinance V2 - Mathematical Model

## 1. COMPOUNDING ROI CALCULATION

### Formula (Correct Compound Interest)
```
A = P × (1 + r/n)^(n×t)

Where:
- A = Final amount
- P = Principal (initial stake)
- r = Annual interest rate (e.g., 0.80 for 80% APY)
- n = Compounding periods per year = 730 (12-hour cycles)
- t = Time in years
```

### Example Calculations
**Scenario: 1000 NEURON staked at 80% APY**

| Period | Simple Interest (Broken) | Compound Interest (Correct) |
|--------|-------------------------|----------------------------|
| 12 hours | 1.095 NEURON | 1.095 NEURON |
| 1 month | 65.75 NEURON | 67.52 NEURON |
| 6 months | 400 NEURON | 414.39 NEURON |
| 1 year | 800 NEURON | 1221.40 NEURON |

### Implementation
```solidity
function calculateCompoundReward(
    uint256 principal,
    uint256 annualRate,     // In basis points (8000 = 80%)
    uint256 startTime,
    uint256 currentTime
) internal pure returns (uint256) {
    uint256 timeElapsed = currentTime - startTime;
    uint256 periods = timeElapsed / CYCLE_DURATION; // 12 hours = 43200 seconds
    
    // r/n per period in precision
    uint256 periodRate = (annualRate * 1e18) / (730 * 10000);
    
    // (1 + r/n)^periods using compound formula
    uint256 compoundFactor = pow(1e18 + periodRate, periods);
    
    // A = P × compoundFactor / 1e18
    uint256 finalAmount = (principal * compoundFactor) / 1e18;
    
    return finalAmount - principal; // Return reward only
}
```

---

## 2. DYNAMIC EMISSION MODEL (NEE)

### Base Emission Formula
```
BaseEmission = TotalSupply × MaxAnnualRate / CompoundingPeriods

Where:
- MaxAnnualRate = 5% (500 basis points)
- CompoundingPeriods = 730 (12-hour cycles per year)
```

### Health-Adjusted Emission
```
AdjustedEmission = BaseEmission × HealthMultiplier

HealthMultiplier = min(1.0, CurrentBackingRatio / TargetBackingRatio)

Where:
- TargetBackingRatio = 30% (0.30)
- If backing < 30%, emission decreases proportionally
- If backing >= 30%, emission = BaseEmission
```

### Emission Schedule
| Year | Max Annual Rate | Effective Rate (at 30% backing) |
|------|----------------|--------------------------------|
| 1 | 5.0% | 5.0% |
| 2 | 4.0% | 4.0% |
| 3 | 3.0% | 3.0% |
| 4 | 2.5% | 2.5% |
| 5+ | 2.0% | 2.0% |

### Implementation
```solidity
function calculateEmission() public view returns (uint256) {
    uint256 totalSupply = neuronToken.totalSupply();
    uint256 maxSupply = neuronToken.maxSupply();
    
    // Don't exceed max supply
    if (totalSupply >= maxSupply) return 0;
    
    // Get current year emission rate
    uint256 yearsSinceLaunch = (block.timestamp - launchTime) / 365 days;
    uint256 annualRate = getYearlyRate(yearsSinceLaunch); // Returns basis points
    
    // Base emission per 12-hour cycle
    uint256 baseEmission = (totalSupply * annualRate) / (10000 * 730);
    
    // Apply health multiplier
    uint256 healthMultiplier = calculateHealthMultiplier();
    uint256 adjustedEmission = (baseEmission * healthMultiplier) / 10000;
    
    // Cap at remaining supply
    uint256 remaining = maxSupply - totalSupply;
    return adjustedEmission > remaining ? remaining : adjustedEmission;
}
```

---

## 3. TREASURY BACKING MODEL

### Backing Ratio Calculation
```
BackingRatio = TreasuryValueUSD / (CirculatingSupply × MarketPrice)

Where:
- TreasuryValueUSD = Sum of all assets in treasury (in USD)
- CirculatingSupply = TotalSupply - TreasuryHoldings
- MarketPrice = Current NEURON price from oracle
```

### Target Metrics
| Metric | Target | Minimum | Action Trigger |
|--------|--------|---------|----------------|
| Backing Ratio | 30% | 20% | Reduce emission if < 20% |
| Treasury Growth | 5% monthly | 0% | Alert if negative |
| Liquidity Ratio | 25% | 15% | Rebalance if < 15% |

### Buyback/Sell Mechanics (ALS)
```
PriceDeviation = (MarketPrice - TargetPrice) / TargetPrice

If PriceDeviation < -5% (price < $0.95):
    BuyAmount = min(TreasuryReserve * 0.10, RequiredToRestorePeg)
    Action: Treasury buys NEURON from market, burns it

If PriceDeviation > +5% (price > $1.05):
    SellAmount = min(TreasuryNEURON * 0.10, RequiredToRestorePeg)
    Action: Treasury sells NEURON to market

Cooldown: 12 hours between ALS actions
```

---

## 4. REFERRAL REWARD MODEL (Sustainable)

### Reward Structure (Treasury-Funded, Not Minted)
```
Level 1 (Direct): 3% of stake amount
Level 2: 1% of stake amount  
Level 3: 0.5% of stake amount

Total Max: 4.5% per referral chain
Source: Treasury reserve (pre-existing funds)
```

### Rank Progression (Realistic)
```
Rank 1 - Member: 0-5 direct referrals
Rank 2 - Advocate: 5+ direct, $10K team volume
Rank 3 - Ambassador: 20+ direct, $100K team volume
Rank 4 - Partner: 50+ direct, $500K team volume
Rank 5 - Council: 100+ direct, $1M team volume
```

### Rank Benefits (Non-Inflationary)
```
Member: Base referral rate
Advocate: +20% fee share from referred users
Ambassador: +50% fee share, governance multiplier 1.2x
Partner: +100% fee share, governance multiplier 1.5x
Council: +200% fee share, governance multiplier 2x
```

---

## 5. LENDING & BORROWING MODEL

### Collateralization
```
MaxBorrow = CollateralValue × LTV_Ratio

Where:
- LTV_Ratio = 60% (conservative)
- CollateralValue = NEURON_Amount × NEURON_Price
- LiquidationThreshold = 75%
```

### Health Factor
```
HealthFactor = (CollateralValue × LiquidationThreshold) / DebtValue

If HealthFactor < 1.0: Position eligible for liquidation
If HealthFactor < 1.25: Warning issued to borrower
```

### Interest Rate Model
```
BorrowRate = BaseRate + (Utilization × Multiplier)

Where:
- BaseRate = 2% APR
- Multiplier = 10% APR at 100% utilization
- Utilization = TotalBorrowed / TotalSupplied

Example rates:
- 0% utilization: 2% APR
- 50% utilization: 7% APR
- 80% utilization: 10% APR
- 100% utilization: 12% APR
```

### Liquidation Math
```
LiquidationBonus = 3% of collateral value
ProtocolFee = 2% of collateral value
TotalPenalty = 5% of collateral value

Liquidator receives: DebtRepaid + (DebtRepaid × 0.03)
Protocol receives: DebtRepaid × 0.02
Borrower receives: Remaining collateral - penalties
```

---

## 6. SYSTEM HEALTH SCORE

### Health Score Formula (0-100)
```
HealthScore = 
    (TreasuryBacking × 30) +
    (StakingRatio × 25) +
    (PriceStability × 25) +
    (GrowthRate × 20)

Where each component is 0-1 normalized:
- TreasuryBacking = min(1, CurrentRatio / 0.30)
- StakingRatio = min(1, StakedAmount / (TotalSupply × 0.50))
- PriceStability = 1 - min(1, |Price - 1.0| / 0.20)
- GrowthRate = min(1, MonthlyGrowth / 0.10)
```

### Health-Based Actions
| Health | Score | Emission | Features | Alert Level |
|--------|-------|----------|----------|-------------|
| Excellent | 90-100 | 100% | All | None |
| Healthy | 75-89 | 100% | All | Info |
| Caution | 60-74 | 75% | All | Warning |
| Warning | 40-59 | 50% | Limited | High |
| Critical | 20-39 | 25% | Essential Only | Critical |
| Emergency | 0-19 | 0% | Paused | Emergency |

---

## 7. 6-MONTH SIMULATION PARAMETERS

### Initial State
```
Initial Supply: 10,000,000 NEURON
Initial Price: $1.00
Treasury Backing: $3,000,000 (30%)
Staked Amount: 5,000,000 NEURON (50%)
Users: 1,000
```

### Growth Scenarios

#### Scenario A: Healthy Growth
```
Monthly new users: +10%
Monthly staking growth: +8%
Price volatility: ±5%
Treasury growth: +5% monthly

Result after 6 months:
- Supply: 10,250,000 (+2.5%)
- Price: $1.08
- Treasury: $4,000,000
- Health Score: 85 (Healthy)
```

#### Scenario B: No New Users (Stress Test)
```
Monthly new users: 0%
Withdrawal rate: 5% monthly
Price decline: 2% monthly

Result after 6 months:
- Supply: 10,150,000 (+1.5%)
- Price: $0.89
- Treasury: $2,800,000
- Health Score: 65 (Caution)
- System Status: Operational with reduced emission
```

#### Scenario C: Market Crash (Extreme)
```
Price drop: 50% in month 1
Panic withdrawals: 30% of stakes

System Response:
- Emission reduced to 0%
- Buyback activated at $0.80
- Health Score: 35 (Critical)
- Recovery time: 3-4 months
```

---

## 8. GAS OPTIMIZATION MODEL

### Batch Operations
```
BatchSize = min(PendingOperations, 100)
Gas per operation (batched) = 15,000 gas
Gas per operation (individual) = 45,000 gas
Savings = 66%
```

### Checkpoint Pattern
```
Instead of updating every block:
- Update user state on: deposit, withdrawal, claim, compound
- Calculate rewards on-demand using formula
- Global state updated every 12 hours by keeper
```

---

## 9. SECURITY THRESHOLDS

### Circuit Breakers
```
Max Daily Emission: 0.05% of supply
Max Single Mint: 1% of supply
Max Treasury Move: 10% of treasury
Price Deviation Alert: >10% from oracle
```

### Time Locks
```
Parameter Changes: 24 hours
Treasury Moves >$100K: 48 hours
Emergency Actions: Immediate (multisig only)
```

---

## Summary: Key Improvements Over V1

| Aspect | V1 (Vulnerable) | V2 (Secure) |
|--------|----------------|-------------|
| Interest | Simple (incorrect) | Compound (correct) |
| Emission | Unlimited | 5% max, health-adjusted |
| Referral | Infinite mint | Treasury-funded |
| Price | Mock ($1 always) | Chainlink oracle |
| Liquidation | Broken | Functional with 60% LTV |
| Backing | None required | 30% minimum |
| Supply | Infinite | 100M hard cap |
