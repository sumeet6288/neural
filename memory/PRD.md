# NeuraFinance PRD

## Project Overview
AI-Driven DeFi Platform - NeuraFinance. Full-stack Web3 application with smart contracts, backend automation, and Next.js frontend on Polygon.

## Architecture
- **Root**: Hardhat project for Solidity smart contracts (Polygon/Mumbai)
- **Backend**: Express.js (Node.js) + ethers.js blockchain service - port 3001
- **Frontend**: Next.js 14 (TypeScript) + Tailwind CSS + ethers.js - port 3000
- **Smart Contracts**: Solidity 0.8.19 (V1 + V2) - NeuronToken, Staking, Treasury, Lending, DAO, Referral, Stablecoin, AIEngine

## Complete Audit & Fix Log (Jan 2026)

### Session 1: Dependencies & Setup
- All dependencies installed (Hardhat + Express + Next.js)
- Environment files configured
- Production build + demo mode backend

### Session 2: Wallet Connection Fix
- Built WalletModal (MetaMask, Coinbase, Trust Wallet detection)
- Toast notifications for errors, single modal instance

### Session 3: Full Security Audit & Fix

#### REFERRAL SYSTEM AUDIT FINDINGS:
1. CRITICAL: Alliance page was 100% static/hardcoded - FIXED
2. CRITICAL: No referral link tracking (?ref= URL param never read) - FIXED
3. CRITICAL: registerReferrer() never called from frontend - FIXED
4. CRITICAL: Referral ABI mismatched with contract - FIXED
5. CRITICAL: "Referred by" hardcoded to 0xF97B...4788 - FIXED
6. HIGH: No circular referral prevention in V1 contract - DOCUMENTED
7. HIGH: V1 contract mints infinite tokens for rewards (inflation) - DOCUMENTED

#### SWAP SYSTEM AUDIT FINDINGS:
1. CRITICAL: Swap was 100% fake (toast message only) - FIXED
2. CRITICAL: Hardcoded exchange rate 2.17 - FIXED
3. CRITICAL: No DEX router integration - FIXED (QuickSwap)
4. CRITICAL: No approve → swap flow - FIXED
5. CRITICAL: No slippage settings - FIXED
6. CRITICAL: Token selector non-functional - FIXED
7. CRITICAL: Balance always 0.000 - FIXED (reads from chain)
8. HIGH: No gas estimation - FIXED
9. HIGH: No transaction hash display - FIXED

#### FILES CREATED:
- `src/utils/referralTracker.ts` - URL param reading, localStorage, auto-registration
- `src/hooks/useReferral.ts` - On-chain referral data + registration
- `src/hooks/useSwap.ts` - QuickSwap DEX integration (real swap)
- `src/components/ReferralTracker.tsx` - App-level referral init

#### FILES FIXED:
- `src/app/alliance/page.tsx` - Real blockchain data, contract status
- `src/app/swap/page.tsx` - Real DEX swap with QuickSwap router
- `src/config/abis.ts` - Fixed Referral ABI to match contract
- `src/app/layout.tsx` - Added ReferralTracker

### Smart Contract Audit Notes (Not Deployed Yet):
**V1 Referral:**
- Missing circular referral prevention (A→B→C→A possible)
- processReferralRewards mints new tokens (inflation risk)
- calculateRank ignores minStake field in RankInfo struct
**V2 Referral:**
- Better design (treasury-funded, 3-level, AccessControl)
- Rank bonus in _payLevelReward is not actually applied (commented logic)
**V1 Staking:**
- Uses Pausable + ReentrancyGuard (good)
- Has timelock emergency withdraw (good)
- Potential issue: unstake sends tokens + rewards in single transfer

## Backlog / Next Steps
- P0: Deploy smart contracts to Polygon testnet
- P0: Configure all contract addresses in .env.local
- P0: Fix V1 Referral circular prevention + minStake check
- P1: Add WalletConnect Project ID for mobile wallets
- P1: Wire dashboard to read live from deployed contracts
- P2: Implement V2 contracts for production
- P2: Add price chart / trading view integration
