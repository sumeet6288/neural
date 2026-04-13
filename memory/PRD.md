# NeuraFinance PRD

## Project Overview
AI-Driven DeFi Platform - NeuraFinance. Full-stack Web3 application with smart contracts, backend automation, and Next.js frontend.

## Architecture
- **Root**: Hardhat project for Solidity smart contracts (Polygon/Mumbai networks)
- **Backend**: Express.js server (Node.js) with ethers.js blockchain integration, scheduled AI cycles, monitoring jobs - runs on port 3001
- **Frontend**: Next.js 14 (TypeScript) + Tailwind CSS + Web3Modal + ethers.js - runs on port 3000
- **Smart Contracts**: Solidity 0.8.19 - NeuronToken, Staking, Treasury, Lending, DAO, Referral, Stablecoin, AIEngine (v1 + v2)

## What's Been Implemented (Jan 2026)
- All dependencies installed (root Hardhat + backend Express + frontend Next.js)
- Environment files configured (.env.local for frontend, .env for backend)
- **Performance fix**: Next.js production build (from ~883ms dev to ~2ms prod response)
- **Backend fix**: Graceful demo mode when no blockchain configured (no more crash on missing PRIVATE_KEY)
- Backend API serving with response caching (~20ms responses)
- New `/api/dashboard` aggregate endpoint for single-call dashboard data
- All pages loading: Home, Dashboard, Staking, Bond, Swap, Alliance, Council, Calculator, Account

## Performance Improvements Done
- Switched Next.js from dev mode to production build (static prerendering of all 12 pages)
- Backend now serves demo data instantly instead of failing blockchain calls
- Added response caching layer (30s TTL) on backend APIs
- Disabled unnecessary blockchain polling jobs in demo mode

## Backlog / Next Steps
- P0: Deploy smart contracts to testnet/mainnet and configure contract addresses
- P0: Configure WalletConnect Project ID for wallet connections
- P1: Set up backend with proper RPC URL and private key for live blockchain data
- P1: Wire frontend to fetch from backend APIs instead of client-side blockchain calls
- P2: Production build optimization (standalone mode)
- P2: Security audit integration
