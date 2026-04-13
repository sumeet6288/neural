# NeuraFinance PRD

## Project Overview
AI-Driven DeFi Platform - NeuraFinance. A full-stack Web3 application with smart contracts, backend automation, and a Next.js frontend.

## Architecture
- **Root**: Hardhat project for Solidity smart contracts (Polygon/Mumbai networks)
- **Backend**: Express.js server (Node.js) with ethers.js blockchain integration, scheduled AI cycles, monitoring jobs
- **Frontend**: Next.js 14 (TypeScript) + Tailwind CSS + Web3Modal + ethers.js
- **Smart Contracts**: Solidity 0.8.19 - NeuronToken, Staking, Treasury, Lending, DAO, Referral, Stablecoin, AIEngine (v1 + v2)

## Tech Stack
- Solidity 0.8.19 / Hardhat
- Express.js / Node.js 18+
- Next.js 14 / React 18 / TypeScript
- Tailwind CSS 3 / Headless UI / Heroicons / Lucide React
- ethers.js 6 / Web3Modal 3
- recharts / react-hot-toast

## What's Been Implemented (Jan 2026)
- All dependencies installed (root Hardhat + backend Express + frontend Next.js)
- Environment files configured (.env.local for frontend, .env for backend)
- Next.js dev server running on port 3000
- All pages loading: Home, Dashboard, Staking, Bond, Swap, Alliance, Council, Calculator, Account

## Pages
- `/` - Landing page (Hero, Features, HowItWorks, AI Engine, Token Section, FAQ, Footer)
- `/dashboard` - Protocol statistics dashboard (Market Cap, Treasury, Total Supply, Token Price, etc.)
- `/staking` - Staking interface
- `/bond` - Bond page
- `/swap` - Token swap
- `/alliance` - Alliance page
- `/council` - Council/governance
- `/calculator` - Calculator tool
- `/account` - User account

## Core Requirements
- Web3 wallet connection (MetaMask, WalletConnect)
- Polygon blockchain integration
- AI-driven DeFi automation (AI cycles, monitoring)
- Staking, Lending, Bonding, Swapping functionality
- DAO governance

## Backlog / Next Steps
- P0: Deploy smart contracts to testnet/mainnet and configure contract addresses
- P0: Configure WalletConnect Project ID for wallet connections
- P1: Set up backend with proper RPC URL and private key for AI automation
- P1: End-to-end testing with connected wallet
- P2: Production build optimization
- P2: Security audit integration
