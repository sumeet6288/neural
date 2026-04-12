# Getting Started

<cite>
**Referenced Files in This Document**
- [package.json](file://neurafinance/package.json)
- [hardhat.config.js](file://neurafinance/hardhat.config.js)
- [deploy.js](file://neurafinance/scripts/deploy.js)
- [ARCHITECTURE.md](file://neurafinance/ARCHITECTURE.md)
- [backend/package.json](file://neurafinance/backend/package.json)
- [backend/src/config/blockchain.js](file://neurafinance/backend/src/config/blockchain.js)
- [backend/src/config/contracts.js](file://neurafinance/backend/src/config/contracts.js)
- [backend/src/index.js](file://neurafinance/backend/src/index.js)
- [frontend/package.json](file://neurafinance/frontend/package.json)
- [frontend/next.config.js](file://neurafinance/frontend/next.config.js)
- [frontend/tailwind.config.js](file://neurafinance/frontend/tailwind.config.js)
- [frontend/src/utils/web3.ts](file://neurafinance/frontend/src/utils/web3.ts)
- [frontend/src/utils/contracts.ts](file://neurafinance/frontend/src/utils/contracts.ts)
- [test/NeuronToken.test.js](file://neurafinance/test/NeuronToken.test.js)
- [test/Staking.test.js](file://neurafinance/test/Staking.test.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Environment Setup](#environment-setup)
5. [Local Development Network](#local-development-network)
6. [Wallet Configuration](#wallet-configuration)
7. [Contracts Deployment](#contracts-deployment)
8. [Running Tests](#running-tests)
9. [Starting the Frontend](#starting-the-frontend)
10. [Backend Automation](#backend-automation)
11. [Verification Checklist](#verification-checklist)
12. [Troubleshooting](#troubleshooting)
13. [Conclusion](#conclusion)

## Introduction
This guide helps you set up the complete NeuraFinance development environment locally. It covers prerequisites, installation, environment configuration, local blockchain setup, wallet configuration, contract deployment, running tests, starting the frontend, and backend automation. The project is a multi-layered system integrating smart contracts, an AI engine, a backend automation service, and a Next.js frontend.

## Prerequisites
- Node.js and npm: Required for building and running the frontend, backend, and Hardhat-based contracts stack.
- Hardhat: Used for compiling Solidity contracts, running tests, and deploying to local and remote networks.
- Polygon wallet: MetaMask recommended for interacting with local and Polygon test/mainnet networks.
- Git: To clone the repository.

Key minimum versions and compatibility:
- Node.js: Backend requires Node.js version 18 or higher.
- Hardhat: The project uses Hardhat v2.19.0 and Hardhat Toolbox.
- Solidity: Configured to compile with Solidity 0.8.19.
- Polygon networks: Mumbai (testnet) and Polygon (mainnet) are supported via RPC URLs.

**Section sources**
- [backend/package.json:24-26](file://neurafinance/backend/package.json#L24-L26)
- [hardhat.config.js:6-14](file://neurafinance/hardhat.config.js#L6-L14)
- [frontend/src/utils/web3.ts:94-117](file://neurafinance/frontend/src/utils/web3.ts#L94-L117)

## Installation
Follow these steps to install the project locally:

1. Clone the repository to your machine.
2. Navigate to the root directory and install dependencies for the root project:
   - Run: npm install
3. Install backend dependencies:
   - From the root, run: cd backend && npm install
4. Install frontend dependencies:
   - From the root, run: cd frontend && npm install

Notes:
- The root package.json defines scripts for compiling contracts, running tests, deploying to local/Mumbai/Polygon, and starting backend/frontend apps.
- Backend requires Node.js 18+ as per engines specification.
- Frontend uses Next.js 14 and Tailwind CSS for styling.

**Section sources**
- [package.json:5-15](file://neurafinance/package.json#L5-L15)
- [backend/package.json:12-20](file://neurafinance/backend/package.json#L12-L20)
- [frontend/package.json:11-29](file://neurafinance/frontend/package.json#L11-L29)

## Environment Setup
Create a .env file at the root of the project with the following keys:

- PRIVATE_KEY: Your wallet private key for signing transactions on Polygon/Mumbai.
- POLYGON_RPC_URL: Polygon mainnet RPC endpoint (fallback included in Hardhat config).
- MUMBAI_RPC_URL: Mumbai testnet RPC endpoint (fallback included in Hardhat config).
- POLYGONSCAN_API_KEY: Optional, for contract verification on Etherscan-like explorers.

Backend-specific environment variables:
- POLYGON_RPC_URL: Same RPC URL used by backend.
- PRIVATE_KEY: Same private key used by backend.
- NEURON_TOKEN_ADDRESS, TREASURY_ADDRESS, STAKING_ADDRESS, REFERRAL_ADDRESS, DAO_ADDRESS, LENDING_ADDRESS, STABLECOIN_ADDRESS, AI_ENGINE_ADDRESS: Contract addresses after deployment.

Frontend-specific environment variables:
- NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: WalletConnect project identifier for modal integrations.
- NEXT_PUBLIC_BACKEND_URL: Backend API URL (default http://localhost:3001).
- NEXT_PUBLIC_NEURON_TOKEN_ADDRESS ... NEXT_PUBLIC_AI_ENGINE_ADDRESS: Contract addresses after deployment.

Notes:
- Hardhat config reads RPC URLs and private key from environment variables.
- Frontend reads contract addresses from NEXT_PUBLIC_* environment variables.
- Backend reads contract addresses from environment variables and initializes contract instances.

**Section sources**
- [hardhat.config.js:20-28](file://neurafinance/hardhat.config.js#L20-L28)
- [backend/src/config/blockchain.js:5-20](file://neurafinance/backend/src/config/blockchain.js#L5-L20)
- [frontend/src/utils/contracts.ts:67-75](file://neurafinance/frontend/src/utils/contracts.ts#L67-L75)
- [frontend/next.config.js:18-21](file://neurafinance/frontend/next.config.js#L18-L21)

## Local Development Network
NeuraFinance uses Hardhat’s in-process local network for development and testing. The Hardhat config sets up:
- Solidity compiler settings with optimizer enabled.
- Local network named hardhat with chainId 31337.
- Remote networks: polygon (chainId 137) and mumbai (chainId 80001) with optional RPC fallbacks.

To start a local node:
- Run: npm run node

This starts a local Ethereum-compatible RPC endpoint you can connect your wallet to.

**Section sources**
- [hardhat.config.js:15-19](file://neurafinance/hardhat.config.js#L15-L19)
- [package.json:12](file://neurafinance/package.json#L12)

## Wallet Configuration
Configure your wallet (MetaMask) for local and Polygon networks:

- Local network: Add a network with RPC URL pointing to your local Hardhat node and chainId 31337.
- Polygon Mumbai: Use the RPC URL configured in Hardhat or your own.
- Polygon Mainnet: Use the RPC URL configured in Hardhat or your own.

Frontend helpers:
- The frontend provides a web3 utility module to connect wallets, get accounts, switch networks, and listen for changes.
- It includes constants for Polygon Mainnet and Mumbai testnet with chain IDs, RPC URLs, and block explorer URLs.

Frontend contract integration:
- Contract addresses are loaded from NEXT_PUBLIC_* environment variables.
- Contract ABIs are defined in the frontend contracts utility module.

**Section sources**
- [frontend/src/utils/web3.ts:27-84](file://neurafinance/frontend/src/utils/web3.ts#L27-L84)
- [frontend/src/utils/web3.ts:94-117](file://neurafinance/frontend/src/utils/web3.ts#L94-L117)
- [frontend/src/utils/contracts.ts:67-75](file://neurafinance/frontend/src/utils/contracts.ts#L67-L75)

## Contracts Deployment
The project includes a deployment script that deploys contracts in a specific order and sets up inter-contract relationships.

Deployment order:
1. NeuronToken
2. Stablecoin
3. Treasury
4. Staking
5. Referral
6. DAO
7. Lending
8. AI Engine

Post-deployment setup:
- Authorizes minters across relevant contracts.
- Sets fee recipients and recipients for liquidity and rewards.
- Links contracts (e.g., referral contract in staking, AI Engine in token).
- Saves deployment info including network, chainId, deployer, and contract addresses.

To deploy locally:
- Run: npm run deploy:local

To deploy to Mumbai:
- Run: npm run deploy:mumbai

To deploy to Polygon:
- Run: npm run deploy:polygon

Verification:
- After deployment, you can verify contracts on Etherscan using the verify script if API keys are configured.

**Section sources**
- [deploy.js:3-162](file://neurafinance/scripts/deploy.js#L3-L162)
- [package.json:8-11](file://neurafinance/package.json#L8-L11)
- [hardhat.config.js:30-35](file://neurafinance/hardhat.config.js#L30-L35)

## Running Tests
Unit tests are provided for core contracts. Run them using Hardhat:

- Compile contracts: npm run compile
- Run tests: npm run test

Example test coverage:
- NeuronToken: deployment checks, transfers, mint/burn permissions, fee configuration, whitelist functionality.
- Staking: flexible and bond staking, unstaking rules, reward rates, and owner-controlled rate updates.

Tests use Hardhat’s built-in Chai matchers and ethers utilities to assert state changes and reverts.

**Section sources**
- [test/NeuronToken.test.js:4-95](file://neurafinance/test/NeuronToken.test.js#L4-L95)
- [test/Staking.test.js:4-106](file://neurafinance/test/Staking.test.js#L4-L106)
- [package.json:7](file://neurafinance/package.json#L7)

## Starting the Frontend
Navigate to the frontend directory and start the development server:

- From the root: cd frontend && npm run dev

The frontend uses Next.js 14 with React and Tailwind CSS. It integrates with the wallet via Web3Modal and interacts with deployed contracts using the ABI constants and environment-provided addresses.

Build and production:
- Build: npm run build
- Start in production: npm run start

**Section sources**
- [frontend/package.json:5-10](file://neurafinance/frontend/package.json#L5-L10)
- [frontend/next.config.js:1-25](file://neurafinance/frontend/next.config.js#L1-L25)
- [frontend/tailwind.config.js:1-123](file://neurafinance/frontend/tailwind.config.js#L1-L123)

## Backend Automation
The backend is a Node.js service that exposes REST endpoints and runs scheduled jobs to monitor and manage the DeFi ecosystem.

Key capabilities:
- Health check endpoint returning block number and system health score.
- Metrics endpoints for total supply, staked amounts, TVL, token price, and stablecoin supply.
- Price stability checks and treasury TVL queries.
- Scheduled jobs: AI cycle and monitoring jobs.

To start the backend:
- From the root: cd backend && npm start

Development mode with auto-reload:
- From the root: cd backend && npm run dev

Environment variables:
- POLYGON_RPC_URL, PRIVATE_KEY, and contract addresses must be set as described earlier.

**Section sources**
- [backend/src/index.js:22-165](file://neurafinance/backend/src/index.js#L22-L165)
- [backend/src/config/blockchain.js:5-32](file://neurafinance/backend/src/config/blockchain.js#L5-L32)
- [backend/src/config/contracts.js:136-146](file://neurafinance/backend/src/config/contracts.js#L136-L146)
- [backend/package.json:6-11](file://neurafinance/backend/package.json#L6-L11)

## Verification Checklist
After completing setup, verify your environment:

- Local node: npm run node should start successfully.
- Dependencies: All npm install commands completed without errors.
- Environment variables: .env file exists with PRIVATE_KEY, RPC URLs, and contract addresses.
- Compilation: npm run compile succeeds.
- Tests: npm run test passes for core contracts.
- Frontend: npm run dev starts the Next.js app on the expected port.
- Backend: npm start runs the Express server and logs health/wallet info.
- Wallet: MetaMask connects to local or Mumbai/Polygon networks and displays accounts.

**Section sources**
- [package.json:5-15](file://neurafinance/package.json#L5-L15)
- [frontend/package.json:5-10](file://neurafinance/frontend/package.json#L5-L10)
- [backend/src/index.js:152-165](file://neurafinance/backend/src/index.js#L152-L165)

## Troubleshooting
Common setup issues and resolutions:

- Node.js version mismatch:
  - Symptom: Backend fails to start or throws engine-related errors.
  - Resolution: Ensure Node.js 18+ is installed as required by backend.

- Missing environment variables:
  - Symptom: Hardhat deployment fails or backend exits early.
  - Resolution: Create a .env file with PRIVATE_KEY, RPC URLs, and contract addresses.

- Hardhat network connectivity:
  - Symptom: Cannot connect to local node or remote networks.
  - Resolution: Verify RPC URLs in Hardhat config and .env; ensure firewall allows connections.

- Frontend contract addresses:
  - Symptom: UI shows empty balances or connection errors.
  - Resolution: Set NEXT_PUBLIC_* contract addresses after deployment; confirm ABI constants align with deployed contract interfaces.

- Wallet switching:
  - Symptom: Wallet does not switch networks or shows “chain not added”.
  - Resolution: Use the frontend web3 utility to add and switch networks programmatically.

- Backend job scheduling:
  - Symptom: Jobs do not run or appear stuck.
  - Resolution: Confirm environment variables and that the server logs indicate scheduled jobs started.

**Section sources**
- [backend/package.json:24-26](file://neurafinance/backend/package.json#L24-L26)
- [hardhat.config.js:20-28](file://neurafinance/hardhat.config.js#L20-L28)
- [frontend/src/utils/web3.ts:54-68](file://neurafinance/frontend/src/utils/web3.ts#L54-L68)
- [frontend/src/utils/contracts.ts:67-75](file://neurafinance/frontend/src/utils/contracts.ts#L67-L75)
- [backend/src/index.js:161-165](file://neurafinance/backend/src/index.js#L161-L165)

## Conclusion
You now have a fully configured NeuraFinance development environment. You can compile and test contracts, deploy to local or Polygon networks, run the frontend and backend, and integrate with a Polygon wallet. Use the verification checklist to confirm everything is working, and refer to the troubleshooting section for common issues. For advanced usage, consult the architecture overview and deployment steps documented in the project’s architecture file.

**Section sources**
- [ARCHITECTURE.md:204-212](file://neurafinance/ARCHITECTURE.md#L204-L212)