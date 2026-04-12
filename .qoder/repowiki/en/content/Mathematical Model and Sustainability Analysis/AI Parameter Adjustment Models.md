# AI Parameter Adjustment Models

<cite>
**Referenced Files in This Document**
- [AIEngine.sol](file://neurafinance/contracts/ai-engine/AIEngine.sol)
- [IAIEngine.sol](file://neurafinance/contracts/interfaces/IAIEngine.sol)
- [AIEngine.sol](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol)
- [MathUtils.sol](file://neurafinance/contracts-v2/libraries/MathUtils.sol)
- [MATHEMATICAL_MODEL.md](file://neurafinance/contracts-v2/MATHEMATICAL_MODEL.md)
- [SUSTAINABILITY_ANALYSIS.md](file://neurafinance/contracts-v2/SUSTAINABILITY_ANALYSIS.md)
- [ARCHITECTURE.md](file://neurafinance/ARCHITECTURE.md)
- [ai-cycle.js](file://neurafinance/backend/src/jobs/ai-cycle.js)
- [monitor.js](file://neurafinance/backend/src/jobs/monitor.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document details the AI parameter adjustment models that govern the adaptive behavior of the AI engine. It explains the system health scoring mechanism (0–100 scale), including metric weightings, thresholds, and parameter adjustment triggers. It documents the mathematical formulations for the five AI modules: NEE neural emission control, ALS adaptive liquidity stabilization, ARP auto reinvest optimization, SIG supply integrity validation, and ALP adaptive logic prediction. It also covers feedback control loops, error correction algorithms, convergence criteria, machine learning and predictive modeling components, and stability/performance guarantees for AI-driven protocol management.

## Project Structure
The AI engine orchestrates five specialized modules that operate on a 12-hour cycle. The orchestration contract coordinates emissions, liquidity, fee reinvestment, supply integrity, and parameter adaptation. Backend automation jobs gather metrics, compute health, and trigger system updates.

```mermaid
graph TB
subgraph "Smart Contracts"
A["AIEngine V2<br/>Orchestrator"]
B["NeuronToken"]
C["Treasury"]
D["Staking"]
E["Lending"]
end
subgraph "Modules"
NEE["NEE<br/>Neural Emission Engine"]
ALS["ALS<br/>Adaptive Liquidity Stabilizer"]
ARP["ARP<br/>Auto Reinvest Protocol"]
SIG["SIG<br/>Supply Integrity Guard"]
ALP["ALP<br/>Adaptive Logic Predictor"]
end
subgraph "Backend"
JOB["AI Cycle Job"]
MON["Monitor Job"]
end
A --> NEE
A --> ALS
A --> ARP
A --> SIG
A --> ALP
NEE --> B
NEE --> C
ALS --> C
ARP --> C
SIG --> B
SIG --> C
ALP --> A
JOB --> A
MON --> A
```

**Diagram sources**
- [AIEngine.sol:17-111](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L17-L111)
- [ARCHITECTURE.md:40-54](file://neurafinance/ARCHITECTURE.md#L40-L54)
- [ai-cycle.js:13-85](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L85)
- [monitor.js:12-110](file://neurafinance/backend/src/jobs/monitor.js#L12-L110)

**Section sources**
- [ARCHITECTURE.md:1-239](file://neurafinance/ARCHITECTURE.md#L1-L239)
- [AIEngine.sol:17-111](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L17-L111)
- [ai-cycle.js:13-85](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L85)
- [monitor.js:12-110](file://neurafinance/backend/src/jobs/monitor.js#L12-L110)

## Core Components
- AIEngine orchestrator: Executes the 12-hour cycle, computes health, triggers modules, and manages roles and access control.
- NEE emission controller: Computes emission amounts based on supply, max supply, and health multiplier.
- ALS liquidity stabilizer: Monitors price deviation and triggers buybacks when price falls below a band.
- ARP auto reinvestor: Coordinates automatic compounding and fee reinvestment.
- SIG integrity guard: Validates mint requests and enforces supply/backing constraints.
- ALP adaptive predictor: Adjusts emission parameters based on health trends.

Key constants and roles:
- Basis points scaling, cycle duration, price bands, and target backing ratios.
- Roles: DEFAULT_ADMIN_ROLE, ADMIN_ROLE, KEEPER_ROLE.
- Backend jobs: AI cycle runs every 12 hours; monitor runs periodically.

**Section sources**
- [AIEngine.sol:24-82](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L24-L82)
- [AIEngine.sol:87-111](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L87-L111)
- [ai-cycle.js:148-160](file://neurafinance/backend/src/jobs/ai-cycle.js#L148-L160)
- [monitor.js:112-124](file://neurafinance/backend/src/jobs/monitor.js#L112-L124)

## Architecture Overview
The AI engine operates in a closed-loop system:
- Backend gathers metrics and triggers the 12-hour cycle.
- AIEngine computes health and applies module-specific logic.
- NEE emits tokens to the treasury; ALS stabilizes price via buybacks; ARP reinvests fees; SIG validates integrity; ALP adapts parameters.
- Monitoring tracks price, health, and treasury metrics for early warning.

```mermaid
sequenceDiagram
participant Cron as "AI Cycle Job"
participant Engine as "AIEngine"
participant Metrics as "Blockchain Metrics"
participant Treasury as "Treasury"
participant Token as "NeuronToken"
Cron->>Engine : executeCycle()
Engine->>Engine : _updateHealth()
Engine->>Engine : calculateEmission()
Engine->>Token : mint(Treasury, emission)
Engine->>Engine : triggerALS()
Engine->>Treasury : executeBuyback(amount)
Engine->>Engine : triggerARP()
Engine->>Engine : triggerSIG()
Engine->>Engine : triggerALP()
Engine-->>Cron : emit ModuleTriggered(...)
```

**Diagram sources**
- [ai-cycle.js:19-85](file://neurafinance/backend/src/jobs/ai-cycle.js#L19-L85)
- [AIEngine.sol:87-111](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L87-L111)
- [AIEngine.sol:117-128](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L117-L128)
- [AIEngine.sol:161-180](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L161-L180)
- [AIEngine.sol:196-204](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L196-L204)
- [AIEngine.sol:210-229](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L210-L229)

## Detailed Component Analysis

### System Health Scoring (0–100 Scale)
The health score is a weighted combination of four normalized components:
- Treasury backing ratio (weight 30)
- Staking ratio (weight 25)
- Price stability (weight 25)
- Growth rate (weight 20)

Formulas and thresholds:
- Normalized components are capped at 10000 basis points for internal computation.
- Weighted average yields a 0–100 score.
- Price stability computed as 10000 minus normalized deviation from $1.00, capped at 10000.
- Backing ratio normalized to target 30%; below 20% triggers critical checks.

```mermaid
flowchart TD
Start(["Compute Health"]) --> GetMetrics["Get backing, staked, supply, price"]
GetMetrics --> NormalizeBack["Normalize backing to target 30%"]
GetMetrics --> NormalizeStake["Normalize staking ratio to target 50%"]
GetMetrics --> PriceDev["Compute price deviation from $1.00"]
PriceDev --> NormDev["Normalize deviation (0..10000)"]
NormDev --> Stability["Stability = 10000 - deviation"]
NormalizeBack --> W1["Weighted score x30"]
NormalizeStake --> W2["Weighted score x25"]
Stability --> W3["Weighted score x25"]
W1 --> Sum["Sum weighted scores"]
W2 --> Sum
W3 --> Sum
Sum --> Growth["Add growth rate x20"]
Growth --> Score["Overall score (0..100)"]
Score --> End(["Return SystemHealth"])
```

**Diagram sources**
- [AIEngine.sol:234-268](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L234-L268)
- [AIEngine.sol:273-283](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L273-L283)

Practical example:
- Backing ratio 30% → score 30; Staking ratio 50% → score 25; Price deviation 3% → stability 97; Growth 10% → score 20. Total: 65/100.

Health-based actions (example tiers):
- Excellent (90–100): Full feature set
- Healthy (75–89): Normal operations
- Caution (60–74): Reduced emission
- Warning (40–59): Essential features only
- Critical (20–39): Emergency pause
- Emergency (0–19): Full pause

**Section sources**
- [AIEngine.sol:234-268](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L234-L268)
- [AIEngine.sol:273-283](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L273-L283)
- [MATHEMATICAL_MODEL.md:230-256](file://neurafinance/contracts-v2/MATHEMATICAL_MODEL.md#L230-L256)

### NEE Neural Emission Control
Purpose: Dynamically compute token emission based on supply dynamics and system health.

Mathematical model:
- Base emission per 12-hour cycle: (Supply × AnnualRate) / (BASIS_POINTS × 730)
- Health multiplier: min(10000, CurrentBackingRatio / TargetBackingRatio)
- Adjusted emission: BaseEmission × HealthMultiplier / 10000
- Cap at remaining supply (maxSupply − totalSupply)

Implementation highlights:
- Yearly emission rates decrease over time (5%, 4%, 3%, 2.5%, 2%).
- Emission minted to treasury, not directly to users.
- Daily emission cap enforced via validateMintRequest.

```mermaid
flowchart TD
S(["Start NEE"]) --> Supply["Read totalSupply, maxSupply"]
Supply --> Year["Compute year index from launch time"]
Year --> Rate["Select baseRate from yearlyRates"]
Rate --> Base["BaseEmission = Supply × Rate / (10000 × 730)"]
Base --> HealthMult["HealthMultiplier = min(10000, backing/TARGET)"]
HealthMult --> Adj["AdjustedEmission = Base × HM / 10000"]
Adj --> Cap["Cap at remaining supply"]
Cap --> Mint["mint(treasury, emission)"]
Mint --> E(["End"])
```

**Diagram sources**
- [AIEngine.sol:133-155](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L133-L155)
- [AIEngine.sol:305-323](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L305-L323)

Practical example:
- Supply 10M, Rate 5% (500), BaseEmission = 10000000 × 500 / 7300000 ≈ 684.93
- Backing 30% → HM = 10000 → AdjustedEmission ≈ 684.93
- Remaining supply 90M → Emission = 684.93

**Section sources**
- [AIEngine.sol:133-155](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L133-L155)
- [AIEngine.sol:305-323](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L305-L323)
- [MATHEMATICAL_MODEL.md:53-109](file://neurafinance/contracts-v2/MATHEMATICAL_MODEL.md#L53-L109)

### ALS Adaptive Liquidity Stabilizer
Purpose: Maintain price within ±5% of $1.00 using treasury buybacks.

Decision logic:
- If price < $0.95, trigger buyback.
- If price > $1.05, consider selling (rare and complex).
- Cooldown prevents frequent actions.

Mathematical model:
- Price deviation band: ±500 basis points around 10000.
- Buyback amount ≤ 10% of treasury value.
- Cooldown enforced between actions.

```mermaid
flowchart TD
P(["Poll Price"]) --> Dev["Compute deviation from $1.00"]
Dev --> Band{"Within ±5%?"}
Band --> |Yes| Hold["No action"]
Band --> |No| Low{"Price < $0.95?"}
Low --> |Yes| Buy["Calculate buyback ≤ 10% treasury"]
Buy --> DoBuy["executeBuyback(amount)"]
Low --> |No| High{"Price > $1.05?"}
High --> |Yes| Sell["Consider treasury sell (complex)"]
High --> |No| Hold
DoBuy --> End(["End"])
Sell --> End
Hold --> End
```

**Diagram sources**
- [AIEngine.sol:288-300](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L288-L300)
- [AIEngine.sol:348-352](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L348-L352)
- [AIEngine.sol:161-180](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L161-L180)

Practical example:
- Price $0.94, deviation = 6%. Trigger buyback up to 10% of treasury value.

**Section sources**
- [AIEngine.sol:288-300](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L288-L300)
- [AIEngine.sol:348-352](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L348-L352)
- [AIEngine.sol:161-180](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L161-L180)

### ARP Auto Reinvest Protocol
Purpose: Automate compounding and fee reinvestment to sustain rewards and liquidity.

Mechanics:
- Placeholder in AIEngine; actual batch compounding delegated to Staking contract.
- Fees collected and reinvested into liquidity and treasury according to fee distribution.

```mermaid
sequenceDiagram
participant Keeper as "Keeper"
participant Engine as "AIEngine"
participant Staking as "Staking"
participant Treasury as "Treasury"
Keeper->>Engine : triggerARP()
Engine->>Staking : batchAutoCompound(list)
Staking-->>Engine : processed
Engine->>Treasury : addLiquidity(feePortion)
Engine-->>Keeper : emit ModuleTriggered(ARP)
```

**Diagram sources**
- [AIEngine.sol:186-190](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L186-L190)
- [AIEngine.sol:135-138](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L135-L138)

**Section sources**
- [AIEngine.sol:186-190](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L186-L190)

### SIG Supply Integrity Guard
Purpose: Validate mint requests and ensure supply/backing health.

Checks:
- Max supply cap enforcement.
- Backing ratio threshold (minimum 20%).
- Daily emission cap (0.05% of supply).

```mermaid
flowchart TD
V(["validateMintRequest(amount)"]) --> Sup["totalSupply + amount ≤ maxSupply?"]
Sup --> |No| Deny1["Return false"]
Sup --> |Yes| Back["getBackingRatio() ≥ 2000?"]
Back --> |No| Deny2["Return false"]
Back --> |Yes| Daily["amount ≤ (totalSupply × 50) / 100 / 100?"]
Daily --> |No| Deny3["Return false"]
Daily --> |Yes| Allow["Return true"]
```

**Diagram sources**
- [AIEngine.sol:305-323](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L305-L323)

**Section sources**
- [AIEngine.sol:305-323](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L305-L323)

### ALP Adaptive Logic Predictor
Purpose: Adjust system parameters based on health trends.

Rules:
- If overall score ≥ 8000: maintain or slightly increase emission.
- If overall score < 4000: reduce emission by 50% (min 1%).
- Emits parameter change events.

```mermaid
flowchart TD
H(["Get SystemHealth"]) --> Score["Read overallScore"]
Score --> Healthy{"Score ≥ 8000?"}
Healthy --> |Yes| Keep["If currentRate < 5% → set to 5%"]
Healthy --> |No| Crit{"Score < 4000?"}
Crit --> |Yes| Cut["newRate = max(100, currentRate × 0.5)"]
Crit --> |No| Wait["No change"]
Keep --> Emit["Emit EmissionAdjusted(old,new)"]
Cut --> Emit
Emit --> End(["End"])
Wait --> End
```

**Diagram sources**
- [AIEngine.sol:210-229](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L210-L229)

**Section sources**
- [AIEngine.sol:210-229](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L210-L229)

### Feedback Control Loops and Convergence
Feedback loops:
- Health score drives ALP parameter adjustments.
- NEE emission feeds treasury value, affecting backing ratio and future emissions.
- ALS buybacks influence price, impacting health stability.

Error correction:
- SIG validates mint requests to prevent overshooting supply/backing.
- Price band triggers ALS actions to reduce deviations.
- Cooldown prevents oscillation in ALS.

Convergence criteria:
- Health score remains within target bands (backing ≥ 30%, price within ±5%).
- Emission rate converges toward sustainable levels based on backing ratio.

Stability analysis:
- Backing ratio floor at 20% prevents collapse.
- Decreasing emission schedules reduce inflationary pressure over time.
- Compound interest model ensures accurate reward accrual.

**Section sources**
- [AIEngine.sol:210-229](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L210-L229)
- [AIEngine.sol:305-323](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L305-L323)
- [AIEngine.sol:288-300](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L288-L300)
- [SUSTAINABILITY_ANALYSIS.md:1-399](file://neurafinance/contracts-v2/SUSTAINABILITY_ANALYSIS.md#L1-L399)

### Machine Learning and Predictive Modeling
- Real-time adaptation: ALP uses historical health scores to infer trends and adjust emission rates.
- Predictive signals: Backend jobs track price, health, and treasury metrics to anticipate stress.
- Automated triggers: When health drops below thresholds, backend jobs alert and AI engine responds.

Note: The current implementation relies on explicit thresholds and weighted scoring rather than neural networks. Predictive modeling is operational through historical health tracking and automated alerts.

**Section sources**
- [AIEngine.sol:50-51](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L50-L51)
- [ai-cycle.js:33-51](file://neurafinance/backend/src/jobs/ai-cycle.js#L33-L51)
- [monitor.js:67-84](file://neurafinance/backend/src/jobs/monitor.js#L67-L84)

### Performance Metrics and Monitoring
- Cycle cadence: 12-hour intervals for deterministic parameter updates.
- Backend monitoring: Periodic checks for price, health, and treasury balances.
- Alerts: Webhook/email notifications for critical deviations.

**Section sources**
- [ai-cycle.js:148-160](file://neurafinance/backend/src/jobs/ai-cycle.js#L148-L160)
- [monitor.js:112-124](file://neurafinance/backend/src/jobs/monitor.js#L112-L124)

## Dependency Analysis
The AI engine orchestrator depends on core contracts and libraries for precise computations and secure operations.

```mermaid
graph LR
Engine["AIEngine V2"] --> Intf["IAIEngine"]
Engine --> Acc["AccessControl"]
Engine --> Ren["ReentrancyGuard"]
Engine --> Lib["MathUtils"]
Engine --> Token["NeuronToken"]
Engine --> Treas["Treasury"]
Engine --> Stake["Staking"]
Lib --> Prec["PRECISION, BASIS_POINTS"]
Lib --> Pow["pow(base, exp)"]
```

**Diagram sources**
- [AIEngine.sol:4-10](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L4-L10)
- [MathUtils.sol:4-111](file://neurafinance/contracts-v2/libraries/MathUtils.sol#L4-L111)

**Section sources**
- [AIEngine.sol:4-10](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L4-L10)
- [MathUtils.sol:4-111](file://neurafinance/contracts-v2/libraries/MathUtils.sol#L4-L111)

## Performance Considerations
- Gas optimization: Batch operations and checkpoint patterns reduce on-chain costs.
- Precision: Basis points and fixed-point arithmetic ensure numerical stability.
- Access control: Roles minimize misuse and reduce reentrancy risks.
- Oracles: Chainlink integration planned for robust price discovery.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Emission not adjusting: Verify health score and backing ratio; ensure ALP thresholds are met.
- Price instability: Confirm ALS cooldown and buyback eligibility; check treasury capacity.
- Mint request rejected: Validate supply cap, backing ratio, and daily emission limits.
- Backend failures: Review cron scheduling and alert logs for errors.

**Section sources**
- [AIEngine.sol:305-323](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L305-L323)
- [ai-cycle.js:79-84](file://neurafinance/backend/src/jobs/ai-cycle.js#L79-L84)
- [monitor.js:34-36](file://neurafinance/backend/src/jobs/monitor.js#L34-L36)

## Conclusion
The AI parameter adjustment models establish a robust, mathematically grounded framework for autonomous protocol management. The health score provides a unified signal for adaptive behavior across modules, while explicit thresholds and weighted scoring ensure predictable, stable responses. Backend automation complements on-chain logic to deliver real-time monitoring and intervention. Together, these components support long-term sustainability and resilience.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Practical Examples Index
- Health score calculation: [AIEngine.sol:234-268](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L234-L268)
- Emission calculation: [AIEngine.sol:133-155](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L133-L155)
- ALS buyback trigger: [AIEngine.sol:288-300](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L288-L300)
- SIG mint validation: [AIEngine.sol:305-323](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L305-L323)
- ALP parameter adjustment: [AIEngine.sol:210-229](file://neurafinance/contracts-v2/ai-engine/AIEngine.sol#L210-L229)

### Backend Jobs Reference
- AI cycle scheduling and execution: [ai-cycle.js:148-160](file://neurafinance/backend/src/jobs/ai-cycle.js#L148-L160)
- Monitoring intervals and alerts: [monitor.js:112-124](file://neurafinance/backend/src/jobs/monitor.js#L112-L124)