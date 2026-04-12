# NeuraFinance V2 Deployment Guide

## Contract Deployment Order

### 1. Core Infrastructure (First)
```solidity
// Deploy libraries first
MathUtils - Library (no deployment needed, linked)

// Deploy token
NeuronTokenV2:
  - _treasury: address(0) initially, update after treasury deploy
  - _liquidityPool: address(0) initially, update after DEX setup

// Deploy treasury
TreasuryV2:
  - _neuronToken: NeuronTokenV2 address
```

### 2. Update Token with Treasury
```solidity
NeuronTokenV2.setTreasury(TreasuryV2.address)
```

### 3. AI Engine & Staking
```solidity
// Deploy AI Engine
AIEngineV2:
  - _neuronToken: NeuronTokenV2 address
  - _treasury: TreasuryV2 address
  - _staking: address(0) initially
  - _priceFeed: Chainlink NEURON/USD feed

// Deploy Staking
StakingV2:
  - _neuronToken: NeuronTokenV2 address
  - _treasury: TreasuryV2 address
  - _referral: address(0) initially
```

### 4. Update AI Engine with Staking
```solidity
AIEngineV2.setStaking(StakingV2.address)
```

### 5. Referral System
```solidity
ReferralV2:
  - _neuronToken: NeuronTokenV2 address
  - _treasury: TreasuryV2 address

// Update staking with referral
StakingV2.setReferral(ReferralV2.address)
```

### 6. Lending System
```solidity
// Deploy mock nUSD (or use real stablecoin)
nUSD = deploy MockERC20("Neura USD", "nUSD")

LendingV2:
  - _neuronToken: NeuronTokenV2 address
  - _nUSD: nUSD address
  - _priceFeed: Chainlink NEURON/USD feed
```

### 7. Grant Roles & Permissions
```solidity
// NeuronToken
grantRole(MINTER_ROLE, AIEngineV2)
grantRole(MINTER_ROLE, TreasuryV2)

// Treasury
grantRole(BUYBACK_ROLE, AIEngineV2)
grantRole(REWARD_MANAGER_ROLE, StakingV2)
grantRole(REWARD_MANAGER_ROLE, ReferralV2)

// Staking
grantRole(KEEPER_ROLE, AIEngineV2)
grantRole(STAKING_ROLE, ReferralV2)

// Lending
grantRole(LIQUIDATOR_ROLE, keeper_bot_address)
```

### 8. Fund Treasury
```solidity
// Send initial liquidity to treasury
NeuronTokenV2.transfer(TreasuryV2, 5_000_000 * 1e18) // 5M tokens
TreasuryV2.depositETH{value: 1000 ether}() // ETH backing
```

### 9. Approve Spending
```solidity
// Treasury approves staking for reward distribution
TreasuryV2.approve(NeuronTokenV2, StakingV2, type(uint256).max)

// Treasury approves referral for reward distribution
TreasuryV2.approve(NeuronTokenV2, ReferralV2, type(uint256).max)
```

## Configuration Parameters

### Token
- Transfer Fee: 0.5% (50 basis points)
- Fee Split: 40% treasury, 30% liquidity, 30% burn
- Max Supply: 100,000,000 NEURON

### Staking
- Flexible APY: 40%
- 30-day Bond: 60%
- 90-day Bond: 80%
- 180-day Bond: 120%
- Deposit Fee: 0.5%
- Cycle: 12 hours

### Emission (NEE)
- Year 1: 5% annual
- Year 2: 4% annual
- Year 3: 3% annual
- Year 4: 2.5% annual
- Year 5+: 2% annual
- Health multiplier: 0-100% based on backing

### Treasury
- Target Backing: 30%
- Minimum Backing: 20%
- Max Buyback: 10% of treasury per action
- Reward Reserve: 50% of treasury

### Referral
- Level 1: 3%
- Level 2: 1%
- Level 3: 0.5%
- Max total: 4.5% (from treasury)

### Lending
- LTV: 60%
- Liquidation Threshold: 75%
- Liquidation Bonus: 3%
- Protocol Fee: 2%
- Base Rate: 2% APR
- Max Rate: 12% APR

## Post-Deployment Verification

### 1. Token Tests
- [ ] Mint initial supply to treasury
- [ ] Verify max supply cap
- [ ] Test transfer fees
- [ ] Test burn mechanism

### 2. Staking Tests
- [ ] Stake with all bond types
- [ ] Verify compound interest calculation
- [ ] Test early withdrawal (should fail for bonds)
- [ ] Test reward claims
- [ ] Verify auto-compound

### 3. AI Engine Tests
- [ ] Execute full cycle
- [ ] Verify emission calculation
- [ ] Test health score computation
- [ ] Verify price stabilization triggers

### 4. Treasury Tests
- [ ] Deposit ETH and tokens
- [ ] Verify backing ratio
- [ ] Test buyback execution
- [ ] Verify reward funding

### 5. Referral Tests
- [ ] Set referrer
- [ ] Process referral rewards
- [ ] Verify rank upgrades
- [ ] Test 3-level depth

### 6. Lending Tests
- [ ] Deposit collateral
- [ ] Borrow nUSD
- [ ] Accrue interest
- [ ] Test liquidation
- [ ] Verify health factor

## Keeper Setup

### Required Keepers
1. **Cycle Keeper**: Calls AIEngine.executeCycle() every 12 hours
2. **Auto-Compound Keeper**: Calls Staking.batchAutoCompound() daily
3. **Liquidation Keeper**: Monitors and liquidates unhealthy positions
4. **Stabilization Keeper**: Triggers ALS when price deviates

### Keeper Addresses (Example)
```
CycleKeeper: 0x... (bot wallet with ETH for gas)
CompoundKeeper: 0x... (bot wallet)
Liquidator: 0x... (bot wallet with liquidator role)
```

## Emergency Procedures

### Pause System
```solidity
// Admin can pause individual contracts
StakingV2.pause()
LendingV2.pause()
```

### Emergency Withdrawal
```solidity
// Only for critical situations
TreasuryV2.emergencyWithdraw(token, amount, recipient)
```

### Parameter Adjustment
```solidity
// All parameter changes have 24-hour timelock in production
AIEngineV2.setYearlyRates([...])
StakingV2.setRewardRates(...)
```

## Monitoring

### Key Metrics to Track
1. Treasury Backing Ratio (target: 30%)
2. Health Score (target: >75)
3. Total Staked / Supply Ratio (target: 50%)
4. Emission Rate vs Target
5. Liquidation Events
6. Referral Rewards Distributed

### Alerts
- Health Score < 40: Critical
- Backing Ratio < 20%: Critical
- Price deviation > 10%: Warning
- Failed keeper execution: Error
