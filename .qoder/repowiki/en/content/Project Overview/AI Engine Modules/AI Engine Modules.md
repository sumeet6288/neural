# AI Engine Modules

<cite>
**Referenced Files in This Document**
- [AIEngine.sol](file://neurafinance/contracts/ai-engine/AIEngine.sol)
- [IAIEngine.sol](file://neurafinance/contracts/interfaces/IAIEngine.sol)
- [ARCHITECTURE.md](file://neurafinance/ARCHITECTURE.md)
- [ai-cycle.js](file://neurafinance/backend/src/jobs/ai-cycle.js)
- [monitor.js](file://neurafinance/backend/src/jobs/monitor.js)
- [BlockchainService.js](file://neurafinance/backend/src/services/BlockchainService.js)
- [PriceService.js](file://neurafinance/backend/src/services/PriceService.js)
- [alerts.js](file://neurafinance/backend/src/utils/alerts.js)
- [logger.js](file://neurafinance/backend/src/utils/logger.js)
- [blockchain.js](file://neurafinance/backend/src/config/blockchain.js)
- [contracts.js](file://neurafinance/backend/src/config/contracts.js)
- [index.js](file://neurafinance/backend/src/index.js)
- [AIEngine.tsx](file://neurafinance/frontend/src/components/AIEngine.tsx)
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

## Introduction
This document explains the AI Engine modules that orchestrate the DeFi ecosystem. The AI Engine serves as the central coordinator for five specialized AI systems:
- NEE (Neural Emission Engine): Dynamic emission control based on staking participation
- ALS (Adaptive Liquidity Stabilizer): Price stability mechanisms via buybacks and sell pressure
- ARP (Auto Reinvest Protocol): Strategic fee reinvestment into liquidity and treasury
- SIG (Supply Integrity Guard): Security validation for mint requests and supply health
- ALP (Adaptive Logic Predictor): Predictive parameter adjustment based on system health

The system follows a modular architecture enabling independent updates and replacements, with robust monitoring, alerting, and emergency response capabilities. It integrates machine learning insights with real-time decision-making and executes actions through smart contracts.

## Project Structure
The AI Engine spans smart contracts, backend automation, and frontend presentation:

```mermaid
graph TB
subgraph "Smart Contracts"
AIE["AIEngine.sol"]
IAI["IAIEngine.sol"]
end
subgraph "Backend Automation"
IDX["index.js"]
ACJ["ai-cycle.js"]
MJ["monitor.js"]
BCS["BlockchainService.js"]
PS["PriceService.js"]
ALS["alerts.js"]
LOG["logger.js"]
CFG["blockchain.js"]
ABI["contracts.js"]
end
subgraph "Frontend"
FE["AIEngine.tsx"]
end
AIE --> IAI
IDX --> ACJ
IDX --> MJ
ACJ --> BCS
MJ --> BCS
ACJ --> PS
ACJ --> ALS
MJ --> ALS
BCS --> CFG
BCS --> ABI
FE --> IDX
```

**Diagram sources**
- [AIEngine.sol:15-309](file://neurafinance/contracts/ai-engine/AIEngine.sol#L15-L309)
- [IAIEngine.sol:4-36](file://neurafinance/contracts/interfaces/IAIEngine.sol#L4-L36)
- [index.js:15-165](file://neurafinance/backend/src/index.js#L15-L165)
- [ai-cycle.js:13-161](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L161)
- [monitor.js:12-125](file://neurafinance/backend/src/jobs/monitor.js#L12-L125)
- [BlockchainService.js:12-216](file://neurafinance/backend/src/services/BlockchainService.js#L12-L216)
- [PriceService.js:4-77](file://neurafinance/backend/src/services/PriceService.js#L4-L77)
- [alerts.js:4-82](file://neurafinance/backend/src/utils/alerts.js#L4-L82)
- [logger.js:1-28](file://neurafinance/backend/src/utils/logger.js#L1-L28)
- [blockchain.js:1-33](file://neurafinance/backend/src/config/blockchain.js#L1-L33)
- [contracts.js:136-145](file://neurafinance/backend/src/config/contracts.js#L136-L145)
- [AIEngine.tsx:39-123](file://neurafinance/frontend/src/components/AIEngine.tsx#L39-L123)

**Section sources**
- [ARCHITECTURE.md:8-130](file://neurafinance/ARCHITECTURE.md#L8-L130)
- [ARCHITECTURE.md:178-194](file://neurafinance/ARCHITECTURE.md#L178-L194)

## Core Components
- AIEngine (smart contract): Orchestrator coordinating all AI modules, exposing module interfaces, and executing actions on core contracts (NeuronToken, Treasury, Staking).
- AI Engine Interfaces: Defines module APIs for NEE, ALS, ARP, SIG, and ALP.
- Backend Jobs: AI Cycle Job runs scheduled system updates; Monitor Job continuously tracks treasury, price, health, and blockchain metrics.
- Services: BlockchainService wraps contract interactions; PriceService provides market data with caching.
- Utilities: AlertService and Logger handle notifications and logging.
- Frontend: AIEngine.tsx presents module descriptions and health indicators.

Key responsibilities:
- Modular orchestration with access control and module address management
- Real-time system health scoring and parameter adjustments
- Automated emission calculations, buybacks, and liquidity reinvestment
- Supply validation and security checks
- Machine learning-informed decisions integrated with smart contract operations

**Section sources**
- [AIEngine.sol:15-309](file://neurafinance/contracts/ai-engine/AIEngine.sol#L15-L309)
- [IAIEngine.sol:4-36](file://neurafinance/contracts/interfaces/IAIEngine.sol#L4-L36)
- [ai-cycle.js:13-161](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L161)
- [monitor.js:12-125](file://neurafinance/backend/src/jobs/monitor.js#L12-L125)
- [BlockchainService.js:12-216](file://neurafinance/backend/src/services/BlockchainService.js#L12-L216)
- [PriceService.js:4-77](file://neurafinance/backend/src/services/PriceService.js#L4-L77)
- [alerts.js:4-82](file://neurafinance/backend/src/utils/alerts.js#L4-L82)
- [logger.js:1-28](file://neurafinance/backend/src/utils/logger.js#L1-L28)
- [AIEngine.tsx:39-123](file://neurafinance/frontend/src/components/AIEngine.tsx#L39-L123)

## Architecture Overview
The AI Engine operates as a central coordinator with a layered architecture:

```mermaid
graph TB
subgraph "Layer 1: Smart Contracts"
NEU["NeuronToken"]
TRE["Treasury"]
STK["Staking"]
AI["AIEngine"]
end
subgraph "Layer 2: AI Engine Modules"
NEE["NEE"]
ALS["ALS"]
ARP["ARP"]
SIG["SIG"]
ALP["ALP"]
end
subgraph "Layer 3: Backend Automation"
ACJ["AI Cycle Job"]
MJ["Monitor Job"]
BCS["BlockchainService"]
PS["PriceService"]
ALS["AlertService"]
LOG["Logger"]
end
subgraph "Layer 4: Frontend"
FE["AIEngine.tsx"]
end
AI --> NEE
AI --> ALS
AI --> ARP
AI --> SIG
AI --> ALP
ACJ --> BCS
MJ --> BCS
ACJ --> PS
ACJ --> ALS
MJ --> ALS
AI --> NEU
AI --> TRE
AI --> STK
FE --> AI
```

**Diagram sources**
- [ARCHITECTURE.md:8-130](file://neurafinance/ARCHITECTURE.md#L8-L130)
- [AIEngine.sol:15-309](file://neurafinance/contracts/ai-engine/AIEngine.sol#L15-L309)
- [ai-cycle.js:13-161](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L161)
- [monitor.js:12-125](file://neurafinance/backend/src/jobs/monitor.js#L12-L125)
- [BlockchainService.js:12-216](file://neurafinance/backend/src/services/BlockchainService.js#L12-L216)
- [PriceService.js:4-77](file://neurafinance/backend/src/services/PriceService.js#L4-L77)
- [alerts.js:4-82](file://neurafinance/backend/src/utils/alerts.js#L4-L82)
- [AIEngine.tsx:39-123](file://neurafinance/frontend/src/components/AIEngine.tsx#L39-L123)

## Detailed Component Analysis

### AIEngine Orchestration and Module Interfaces
AIEngine implements the IAIEngine interface and coordinates all five modules. It maintains module addresses, enforces access control, and exposes functions for emission calculation, price stability checks, fee collection and reinvestment, supply validation, and system health scoring.

```mermaid
classDiagram
class AIEngine {
+address owner
+address pendingOwner
+address neeModule
+address alsModule
+address arpModule
+address sigModule
+address alpModule
+uint256 lastSystemUpdate
+uint256 updateInterval
+uint256 targetSupplyRatio
+uint256 maxEmissionRate
+calculateEmission(totalSupply, stakedAmount) uint256
+requestMint(amount) void
+requestBurn(amount) void
+checkPriceStability() (bool,uint256)
+triggerBuyback(amount) void
+triggerSellPressure(amount) void
+collectFees() void
+reinvestToLiquidity(amount) void
+distributeToTreasury(amount) void
+validateMintRequest(amount) bool
+validateSupplyHealth() bool
+getMaxMintable() uint256
+adjustEmissionRate() void
+adjustRewardRates() void
+getSystemHealth() uint256
+triggerSystemUpdate() void
+setModule(name, addr) void
+setCoreContracts(token, treasury, staking) void
+setUpdateInterval(interval) void
+setTargetSupplyRatio(ratio) void
}
class IAIEngine {
<<interface>>
+calculateEmission(totalSupply, stakedAmount) uint256
+requestMint(amount) void
+requestBurn(amount) void
+checkPriceStability() (bool,uint256)
+triggerBuyback(amount) void
+triggerSellPressure(amount) void
+collectFees() void
+reinvestToLiquidity(amount) void
+distributeToTreasury(amount) void
+validateMintRequest(amount) bool
+validateSupplyHealth() bool
+getMaxMintable() uint256
+adjustEmissionRate() void
+adjustRewardRates() void
+getSystemHealth() uint256
}
AIEngine ..|> IAIEngine
```

**Diagram sources**
- [AIEngine.sol:15-309](file://neurafinance/contracts/ai-engine/AIEngine.sol#L15-L309)
- [IAIEngine.sol:4-36](file://neurafinance/contracts/interfaces/IAIEngine.sol#L4-L36)

**Section sources**
- [AIEngine.sol:15-309](file://neurafinance/contracts/ai-engine/AIEngine.sol#L15-L309)
- [IAIEngine.sol:4-36](file://neurafinance/contracts/interfaces/IAIEngine.sol#L4-L36)

### AI Cycle Management and Monitoring
The AI Cycle Job runs every 12 hours to gather system metrics, compute health scores, check price stability, calculate emission, trigger system updates, and check for liquidations. The Monitor Job runs every 5 minutes to track treasury TVL, price movements, system health trends, and blockchain block progress.

```mermaid
sequenceDiagram
participant Cron as "Scheduler"
participant ACJ as "AI Cycle Job"
participant BCS as "BlockchainService"
participant AIE as "AIEngine"
participant ALS as "AlertService"
Cron->>ACJ : "Schedule every 12h"
ACJ->>ACJ : "gatherMetrics()"
ACJ->>BCS : "getSystemHealth()"
BCS-->>ACJ : "healthScore"
ACJ->>BCS : "checkPriceStability()"
BCS-->>ACJ : "isStable, deviation"
ACJ->>BCS : "calculateEmission(totalSupply, totalStaked)"
BCS-->>ACJ : "emission"
ACJ->>BCS : "triggerSystemUpdate()"
BCS->>AIE : "triggerSystemUpdate()"
AIE-->>BCS : "tx receipt"
BCS-->>ACJ : "tx hash"
ACJ->>ALS : "aiCycleCompleted(emission, health)"
```

**Diagram sources**
- [ai-cycle.js:13-85](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L85)
- [BlockchainService.js:106-143](file://neurafinance/backend/src/services/BlockchainService.js#L106-L143)
- [AIEngine.sol:240-261](file://neurafinance/contracts/ai-engine/AIEngine.sol#L240-L261)

**Section sources**
- [ai-cycle.js:13-161](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L161)
- [monitor.js:12-125](file://neurafinance/backend/src/jobs/monitor.js#L12-L125)
- [BlockchainService.js:106-143](file://neurafinance/backend/src/services/BlockchainService.js#L106-L143)

### System Health Scoring Methodology
AIEngine computes a composite health score from three dimensions:
- Staking ratio: proportion of supply staked (up to 40 points)
- Treasury backing: treasury value versus supply (up to 30 points)
- Price stability: deviation from target ($1.00) (up to 30 points)

The final score determines parameter adjustments and intervention triggers.

```mermaid
flowchart TD
Start(["Compute Health Score"]) --> GetMetrics["Get supply, staked, treasury value, current price"]
GetMetrics --> StakingScore["Calculate staking ratio score (0-40)"]
GetMetrics --> BackingScore["Calculate backing ratio score (0-30)"]
GetMetrics --> StabilityScore["Derive stability score from deviation (0-30)"]
StakingScore --> Sum["Sum scores"]
BackingScore --> Sum
StabilityScore --> Sum
Sum --> Health["Final health score"]
Health --> Decision{"Score < 40?"}
Decision --> |Yes| IncreaseIncentives["Increase emission rate<br/>and adjust reward rates"]
Decision --> |No| NormalOps["Normal operations"]
IncreaseIncentives --> End(["Apply adjustments"])
NormalOps --> End
```

**Diagram sources**
- [AIEngine.sol:202-225](file://neurafinance/contracts/ai-engine/AIEngine.sol#L202-L225)
- [AIEngine.sol:180-200](file://neurafinance/contracts/ai-engine/AIEngine.sol#L180-L200)

**Section sources**
- [AIEngine.sol:202-225](file://neurafinance/contracts/ai-engine/AIEngine.sol#L202-L225)

### Parameter Adjustment Triggers
- Emission rate increases when health falls below 40% and caps at 20%
- Emission rate decreases when health exceeds 80%
- Reward rates adjust based on participation (module-specific logic)
- Price stability triggers buybacks when deviation exceeds thresholds

```mermaid
flowchart TD
A["Adjust Emission Rate"] --> B{"Health > 80%?"}
B --> |Yes| C["Decrease emission rate by ~5%"]
B --> |No| D{"Health < 40%?"}
D --> |Yes| E["Increase emission rate by ~5%<br/>cap at 20%"]
D --> |No| F["Keep current emission rate"]
C --> G["Emit ParametersAdjusted"]
E --> G
F --> G
```

**Diagram sources**
- [AIEngine.sol:180-194](file://neurafinance/contracts/ai-engine/AIEngine.sol#L180-L194)

**Section sources**
- [AIEngine.sol:180-194](file://neurafinance/contracts/ai-engine/AIEngine.sol#L180-L194)

### Machine Learning Integration and Real-Time Decision Making
- The backend periodically queries system metrics and health from smart contracts.
- PriceService caches market data and falls back to contract-derived prices when APIs fail.
- Alerts are sent via webhook/email for critical events (low health, price deviations, liquidation warnings).
- The AI Cycle simulates ML-driven decisions by invoking AIEngine functions and observing contract reactions.

```mermaid
graph LR
ACJ["AI Cycle Job"] --> BCS["BlockchainService"]
ACJ --> PS["PriceService"]
ACJ --> ALS["AlertService"]
PS --> |Cache/Fallback| ACJ
BCS --> |Read-only| AIE["AIEngine"]
ACJ --> |Write| AIE
```

**Diagram sources**
- [ai-cycle.js:13-85](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L85)
- [PriceService.js:4-77](file://neurafinance/backend/src/services/PriceService.js#L4-L77)
- [BlockchainService.js:106-143](file://neurafinance/backend/src/services/BlockchainService.js#L106-L143)
- [alerts.js:4-82](file://neurafinance/backend/src/utils/alerts.js#L4-L82)

**Section sources**
- [ai-cycle.js:13-85](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L85)
- [PriceService.js:4-77](file://neurafinance/backend/src/services/PriceService.js#L4-L77)
- [BlockchainService.js:106-143](file://neurafinance/backend/src/services/BlockchainService.js#L106-L143)
- [alerts.js:4-82](file://neurafinance/backend/src/utils/alerts.js#L4-L82)

### Relationship Between AI Signals and Smart Contract Operations
- AI signals originate from health computations and price stability checks.
- AIEngine validates mint requests (SIG), calculates emissions (NEE), stabilizes price (ALS), and reinvests fees (ARP).
- Operations are executed through core contracts: mint/burn on NeuronToken, buybacks/addLiquidity on Treasury, and staking reward adjustments via Staking.

```mermaid
sequenceDiagram
participant ALP as "ALP"
participant AI as "AIEngine"
participant SIG as "SIG"
participant NEE as "NEE"
participant ALS as "ALS"
participant ARP as "ARP"
participant CORE as "Core Contracts"
ALP->>AI : "adjustEmissionRate()"
AI->>SIG : "validateMintRequest(amount)"
SIG-->>AI : "valid/invalid"
AI->>NEE : "calculateEmission(totalSupply, stakedAmount)"
NEE-->>AI : "emission"
AI->>CORE : "requestMint(amount)"
AI->>ALS : "checkPriceStability()"
ALS-->>AI : "isStable, deviation"
AI->>CORE : "triggerBuyback(amount) if unstable"
AI->>ARP : "collectFees()"
ARP-->>AI : "fees collected"
AI->>CORE : "reinvestToLiquidity(amount)"
```

**Diagram sources**
- [AIEngine.sol:75-97](file://neurafinance/contracts/ai-engine/AIEngine.sol#L75-L97)
- [AIEngine.sol:101-125](file://neurafinance/contracts/ai-engine/AIEngine.sol#L101-L125)
- [AIEngine.sol:129-143](file://neurafinance/contracts/ai-engine/AIEngine.sol#L129-L143)
- [AIEngine.sol:147-176](file://neurafinance/contracts/ai-engine/AIEngine.sol#L147-L176)
- [AIEngine.sol:180-200](file://neurafinance/contracts/ai-engine/AIEngine.sol#L180-L200)

**Section sources**
- [AIEngine.sol:75-97](file://neurafinance/contracts/ai-engine/AIEngine.sol#L75-L97)
- [AIEngine.sol:101-125](file://neurafinance/contracts/ai-engine/AIEngine.sol#L101-L125)
- [AIEngine.sol:129-143](file://neurafinance/contracts/ai-engine/AIEngine.sol#L129-L143)
- [AIEngine.sol:147-176](file://neurafinance/contracts/ai-engine/AIEngine.sol#L147-L176)
- [AIEngine.sol:180-200](file://neurafinance/contracts/ai-engine/AIEngine.sol#L180-L200)

### Emergency Response Protocols
- Low system health (<30): critical alert and potential parameter tightening/incentives
- Price deviation (>5%): automatic buyback via Treasury if stability is compromised
- Liquidation monitoring: backend scans recent loans for health factor breaches and logs warnings
- Treasury thresholds: alerts when TVL drops below configured levels

**Section sources**
- [ai-cycle.js:37-51](file://neurafinance/backend/src/jobs/ai-cycle.js#L37-L51)
- [ai-cycle.js:118-146](file://neurafinance/backend/src/jobs/ai-cycle.js#L118-L146)
- [monitor.js:31-33](file://neurafinance/backend/src/jobs/monitor.js#L31-L33)
- [alerts.js:67-78](file://neurafinance/backend/src/utils/alerts.js#L67-L78)

## Dependency Analysis
The AI Engine relies on well-defined interfaces and services:

```mermaid
graph TB
AIE["AIEngine.sol"] --> IAI["IAIEngine.sol"]
AIE --> NEU["NeuronToken"]
AIE --> TRE["Treasury"]
AIE --> STK["Staking"]
ACJ["ai-cycle.js"] --> BCS["BlockchainService.js"]
MJ["monitor.js"] --> BCS
BCS --> CFG["blockchain.js"]
BCS --> ABI["contracts.js"]
IDX["index.js"] --> ACJ
IDX --> MJ
FE["AIEngine.tsx"] --> IDX
```

**Diagram sources**
- [AIEngine.sol:15-309](file://neurafinance/contracts/ai-engine/AIEngine.sol#L15-L309)
- [IAIEngine.sol:4-36](file://neurafinance/contracts/interfaces/IAIEngine.sol#L4-L36)
- [ai-cycle.js:13-161](file://neurafinance/backend/src/jobs/ai-cycle.js#L13-L161)
- [monitor.js:12-125](file://neurafinance/backend/src/jobs/monitor.js#L12-L125)
- [BlockchainService.js:12-216](file://neurafinance/backend/src/services/BlockchainService.js#L12-L216)
- [blockchain.js:1-33](file://neurafinance/backend/src/config/blockchain.js#L1-L33)
- [contracts.js:136-145](file://neurafinance/backend/src/config/contracts.js#L136-L145)
- [index.js:15-165](file://neurafinance/backend/src/index.js#L15-L165)
- [AIEngine.tsx:39-123](file://neurafinance/frontend/src/components/AIEngine.tsx#L39-L123)

**Section sources**
- [ARCHITECTURE.md:8-130](file://neurafinance/ARCHITECTURE.md#L8-L130)
- [BlockchainService.js:18-37](file://neurafinance/backend/src/services/BlockchainService.js#L18-L37)
- [contracts.js:136-145](file://neurafinance/backend/src/config/contracts.js#L136-L145)

## Performance Considerations
- Batched reads: Metrics gathering uses concurrent promises to minimize latency.
- Caching: PriceService caches results to reduce API calls and fallback overhead.
- Interval tuning: AI cycles run every 12 hours; monitoring runs every 5 minutes to balance responsiveness and cost.
- Gas optimization: Smart contract functions avoid unnecessary state writes; only validated operations are executed.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- AI Cycle failures: Check backend logs for errors during contract interactions or API unavailability; verify RPC connectivity and private key configuration.
- Health score anomalies: Confirm contract addresses and ABI correctness; ensure module addresses are properly set.
- Price deviation alerts: Validate oracle integration and fallback logic; review price service configuration.
- Treasury TVL alerts: Investigate reserve composition and liquidity provision; confirm Treasury contract permissions.

Operational checks:
- Health endpoint: Use `/health` to verify blockchain connectivity and system health retrieval.
- Metrics endpoint: Use `/api/metrics` to inspect total supply, staked amounts, TVL, price, and health score.
- Manual trigger: Use `/api/admin/ai-cycle` to force-run the AI cycle for diagnostics.

**Section sources**
- [index.js:22-143](file://neurafinance/backend/src/index.js#L22-L143)
- [logger.js:1-28](file://neurafinance/backend/src/utils/logger.js#L1-L28)
- [blockchain.js:1-33](file://neurafinance/backend/src/config/blockchain.js#L1-L33)
- [BlockchainService.js:106-143](file://neurafinance/backend/src/services/BlockchainService.js#L106-L143)

## Conclusion
The AI Engine modules form a cohesive, modular system that balances decentralized control with intelligent automation. Through structured orchestration, health-based parameter adjustments, and real-time monitoring, the system sustains tokenomics, price stability, and protocol security. The frontend provides transparency, while the backend ensures reliability and observability. This architecture supports independent evolution of modules and resilient operation under varying market conditions.