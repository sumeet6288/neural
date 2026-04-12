'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ethers } from 'ethers';
import { 
  getJsonRpcProvider, 
  getBrowserProvider, 
  getSigner,
  formatEther, 
  parseEther,
  connectWallet,
  getAccount,
  switchNetwork,
  addNetwork,
  setupEventListeners,
  resetProviders,
} from '@/lib/ethers';
import { CONTRACT_ADDRESSES, SUPPORTED_NETWORKS, getNetworkConfig } from '@/config/polygon';
import { ABIS } from '@/config/abis';

// Types
export interface StakeInfo {
  amount: bigint;
  startTime: bigint;
  endTime: bigint;
  lastCompoundTime: bigint;
  rewardRate: bigint;
  stakeType: number;
  active: boolean;
  autoCompound: boolean;
}

export interface SystemHealth {
  treasuryBacking: bigint;
  stakingRatio: bigint;
  priceStability: bigint;
  growthRate: bigint;
  overallScore: bigint;
}

export interface UserStake {
  stakeId: bigint;
  info: StakeInfo;
  pendingRewards: bigint;
}

export interface ContractData {
  // Token
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalSupply: bigint;
  maxSupply: bigint;
  userBalance: bigint;
  
  // Staking
  totalStaked: bigint;
  userStakes: UserStake[];
  totalUserStaked: bigint;
  totalPendingRewards: bigint;
  apys: { [key: number]: bigint };
  
  // AI Engine
  health: SystemHealth | null;
  emissionRate: bigint;
  healthMultiplier: bigint;
  lastCycleTime: bigint;
  
  // Treasury
  treasuryValue: bigint;
  backingRatio: bigint;
  
  // Price
  tokenPrice: bigint;
  priceDecimals: number;
  
  // Referral
  referralInfo: {
    referrer: string;
    directReferrals: bigint;
    totalTeamVolume: bigint;
    rank: bigint;
    totalEarned: bigint;
  } | null;
}

// AIPF-Style 12-Hour Compounding Calculation
// EXACT match to smart contract logic
export function calculateAIPFCompound(
  principal: bigint,
  annualRate: bigint, // in basis points
  periods: number
): bigint {
  if (periods === 0 || annualRate === 0n || principal === 0n) return 0n;
  
  // Constants from contract
  const PERIODS_PER_YEAR = 730; // 365 * 2 (12-hour cycles)
  const BASIS_POINTS = 10000n;
  
  // periodRate = annualRate / PERIODS_PER_YEAR / BASIS_POINTS
  // Using fixed-point arithmetic like the contract
  const periodRate = (annualRate * ethers.WeiPerEther) / (BigInt(PERIODS_PER_YEAR) * BASIS_POINTS);
  
  // Compound: A = P * (1 + r)^n
  // We use iterative multiplication for precision (like contract)
  let compoundFactor = ethers.WeiPerEther; // Start with 1.0
  
  for (let i = 0; i < periods; i++) {
    // (1 + periodRate) multiplication
    compoundFactor = (compoundFactor * (ethers.WeiPerEther + periodRate)) / ethers.WeiPerEther;
  }
  
  // finalAmount = principal * compoundFactor / 1e18
  const finalAmount = (principal * compoundFactor) / ethers.WeiPerEther;
  
  return finalAmount - principal; // Return reward only
}

// Calculate full projection
export interface ProjectionResult {
  daily: bigint;
  weekly: bigint;
  monthly: bigint;
  yearly: bigint;
  finalAmount: bigint;
  totalReward: bigint;
  // 12-hour breakdown
  firstCycle: bigint;
  secondCycle: bigint;
  afterFirstDay: bigint;
}

export function calculateProjection(
  principal: bigint,
  annualRate: bigint
): ProjectionResult {
  const dailyPeriods = 2;    // 2 cycles per day
  const weeklyPeriods = 14;  // 7 days * 2
  const monthlyPeriods = 60; // 30 days * 2
  const yearlyPeriods = 730; // 365 days * 2
  
  const daily = calculateAIPFCompound(principal, annualRate, dailyPeriods);
  const weekly = calculateAIPFCompound(principal, annualRate, weeklyPeriods);
  const monthly = calculateAIPFCompound(principal, annualRate, monthlyPeriods);
  const yearly = calculateAIPFCompound(principal, annualRate, yearlyPeriods);
  
  // 12-hour breakdown
  const firstCycle = calculateAIPFCompound(principal, annualRate, 1);
  const principalAfterFirst = principal + firstCycle;
  const secondCycle = calculateAIPFCompound(principalAfterFirst, annualRate, 1);
  const afterFirstDay = principal + daily;
  
  return {
    daily,
    weekly,
    monthly,
    yearly,
    finalAmount: principal + yearly,
    totalReward: yearly,
    firstCycle,
    secondCycle,
    afterFirstDay,
  };
}

export function usePolygonData() {
  // Connection state
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Contract data state
  const [data, setData] = useState<ContractData>({
    tokenName: '',
    tokenSymbol: 'NEURON',
    tokenDecimals: 18,
    totalSupply: 0n,
    maxSupply: 0n,
    userBalance: 0n,
    totalStaked: 0n,
    userStakes: [],
    totalUserStaked: 0n,
    totalPendingRewards: 0n,
    apys: {},
    health: null,
    emissionRate: 0n,
    healthMultiplier: 0n,
    lastCycleTime: 0n,
    treasuryValue: 0n,
    backingRatio: 0n,
    tokenPrice: 0n,
    priceDecimals: 8,
    referralInfo: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  // Get contract instances
  const getContracts = useCallback(async (useSigner = false) => {
    if (!chainId) return null;
    
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses) return null;

    let provider;
    if (useSigner) {
      const signer = await getSigner();
      if (!signer) return null;
      provider = signer;
    } else {
      provider = getJsonRpcProvider(chainId);
    }

    return {
      token: new ethers.Contract(addresses.NEURON_TOKEN, ABIS.NEURON_TOKEN, provider),
      staking: new ethers.Contract(addresses.STAKING, ABIS.STAKING, provider),
      aiEngine: new ethers.Contract(addresses.AI_ENGINE, ABIS.AI_ENGINE, provider),
      treasury: new ethers.Contract(addresses.TREASURY, ABIS.TREASURY, provider),
      referral: new ethers.Contract(addresses.REFERRAL, ABIS.REFERRAL, provider),
      priceFeed: new ethers.Contract(addresses.PRICE_FEED, ABIS.PRICE_FEED, provider),
    };
  }, [chainId]);

  // Fetch all contract data
  const fetchData = useCallback(async () => {
    if (!chainId || !isMounted.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const contracts = await getContracts();
      if (!contracts) {
        throw new Error('Failed to initialize contracts');
      }

      const { token, staking, aiEngine, treasury, referral, priceFeed } = contracts;

      // Fetch all data in parallel with error handling
      const fetchWithFallback = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
        try {
          return await promise;
        } catch {
          return fallback;
        }
      };

      const [
        tokenName,
        tokenSymbol,
        tokenDecimals,
        totalSupply,
        maxSupply,
        totalStaked,
        health,
        emissionRate,
        healthMultiplier,
        lastCycle,
        treasuryValue,
        backingRatio,
        priceData,
        priceDecimals,
      ] = await Promise.all([
        fetchWithFallback(token.name(), 'NeuraFinance Token'),
        fetchWithFallback(token.symbol(), 'NEURON'),
        fetchWithFallback(token.decimals(), 18),
        fetchWithFallback(token.totalSupply(), 0n),
        fetchWithFallback(token.maxSupply(), 0n),
        fetchWithFallback(staking.totalStaked(), 0n),
        fetchWithFallback(aiEngine.getSystemHealth(), null),
        fetchWithFallback(aiEngine.getEmissionRate(), 0n),
        fetchWithFallback(aiEngine.getHealthMultiplier(), 0n),
        fetchWithFallback(aiEngine.lastCycleTime(), 0n),
        fetchWithFallback(treasury.getTreasuryValue(), 0n),
        fetchWithFallback(treasury.getBackingRatio(), 0n),
        fetchWithFallback(priceFeed.latestRoundData(), null),
        fetchWithFallback(priceFeed.decimals(), 8),
      ]);

      // Fetch user-specific data
      let userBalance = 0n;
      let userStakes: UserStake[] = [];
      let totalUserStaked = 0n;
      let totalPendingRewards = 0n;
      let referralInfo = null;
      let apys: { [key: number]: bigint } = {};

      if (address && isConnected) {
        // Fetch user stakes
        const stakeIds = await fetchWithFallback(staking.getUserStakes(address), []);
        
        // Fetch stake details and APYs in parallel
        const stakePromises = stakeIds.map(async (stakeId: bigint) => {
          const [info, rewards] = await Promise.all([
            fetchWithFallback(staking.getStakeInfo(address, stakeId), null),
            fetchWithFallback(staking.calculatePendingRewards(address, stakeId), 0n),
          ]);
          
          if (info && info.active) {
            return { stakeId, info, pendingRewards: rewards };
          }
          return null;
        });

        const apyPromises = [0, 1, 2, 3].map(async (stakeType) => {
          const apy = await fetchWithFallback(staking.calculateAPY(stakeType), 0n);
          return { [stakeType]: apy };
        });

        const [balance, refInfo, ...stakeResults] = await Promise.all([
          fetchWithFallback(token.balanceOf(address), 0n),
          fetchWithFallback(referral.getUserInfo(address), null),
          ...stakePromises,
        ]);

        const apyResults = await Promise.all(apyPromises);
        
        userBalance = balance;
        referralInfo = refInfo;
        userStakes = stakeResults.filter((s): s is UserStake => s !== null);
        apys = apyResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        
        totalUserStaked = userStakes.reduce((sum, s) => sum + s.info.amount, 0n);
        totalPendingRewards = userStakes.reduce((sum, s) => sum + s.pendingRewards, 0n);
      } else {
        // Fetch APYs even if not connected
        const apyPromises = [0, 1, 2, 3].map(async (stakeType) => {
          const apy = await fetchWithFallback(staking.calculateAPY(stakeType), 0n);
          return { [stakeType]: apy };
        });
        const apyResults = await Promise.all(apyPromises);
        apys = apyResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      }

      // Process price data (Chainlink returns [roundId, answer, startedAt, updatedAt, answeredInRound])
      let tokenPrice = 0n;
      if (priceData && Array.isArray(priceData) && priceData[1]) {
        // Convert Chainlink price (8 decimals) to 18 decimals
        const price = BigInt(priceData[1] as bigint);
        const decimalDiff = 18 - Number(priceDecimals);
        tokenPrice = price * BigInt(10 ** decimalDiff);
      }

      if (isMounted.current) {
        setData({
          tokenName,
          tokenSymbol,
          tokenDecimals,
          totalSupply,
          maxSupply,
          userBalance,
          totalStaked,
          userStakes,
          totalUserStaked,
          totalPendingRewards,
          apys,
          health,
          emissionRate,
          healthMultiplier,
          lastCycleTime: lastCycle,
          treasuryValue,
          backingRatio,
          tokenPrice,
          priceDecimals,
          referralInfo,
        });
        setLastUpdated(new Date());
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to fetch protocol data');
        setIsLoading(false);
      }
    }
  }, [address, chainId, isConnected, getContracts]);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await connectWallet();
      if (result) {
        setAddress(result.address);
        setChainId(result.chainId);
        setIsConnected(true);
        localStorage.setItem('walletConnected', 'true');
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    resetProviders();
    localStorage.removeItem('walletConnected');
    
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
  }, []);

  // Switch network
  const switchToNetwork = useCallback(async (targetChainId: number) => {
    try {
      const switched = await switchNetwork(targetChainId);
      if (!switched) {
        // Try to add network
        const added = await addNetwork(targetChainId);
        if (added) {
          await switchNetwork(targetChainId);
        }
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to switch network');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      if (wasConnected === 'true') {
        try {
          const account = await getAccount();
          if (account) {
            const provider = await getBrowserProvider();
            if (provider) {
              const network = await provider.getNetwork();
              setAddress(account);
              setChainId(Number(network.chainId));
              setIsConnected(true);
            }
          }
        } catch (err) {
          console.error('Auto-connect failed:', err);
        }
      }
    };
    
    autoConnect();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!isConnected) return;

    const cleanup = setupEventListeners(
      (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
        }
      },
      (chainIdHex) => {
        setChainId(parseInt(chainIdHex, 16));
        // Reload page on chain change to reset contracts
        window.location.reload();
      }
    );

    return cleanup;
  }, [isConnected, disconnect]);

  // Auto-refresh data - only when connected and visible
  useEffect(() => {
    if (!isConnected || !chainId) return;
    
    // Initial fetch with small delay to not block UI
    const initialTimer = setTimeout(() => {
      fetchData();
    }, 100);
    
    // Refresh every 30 seconds (less aggressive)
    refreshInterval.current = setInterval(fetchData, 30000);
    
    return () => {
      clearTimeout(initialTimer);
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [isConnected, chainId, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  // Calculate circulating supply
  const circulatingSupply = useMemo(() => {
    return data.totalSupply - data.userBalance; // Simplified - adjust based on actual logic
  }, [data.totalSupply, data.userBalance]);

  // Memoized formatted values
  const formattedData = useMemo(() => ({
    // Token
    totalSupply: formatEther(data.totalSupply),
    maxSupply: formatEther(data.maxSupply),
    circulatingSupply: formatEther(circulatingSupply),
    userBalance: formatEther(data.userBalance),
    
    // Staking
    totalStaked: formatEther(data.totalStaked),
    totalUserStaked: formatEther(data.totalUserStaked),
    totalPendingRewards: formatEther(data.totalPendingRewards),
    apys: Object.entries(data.apys).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: (Number(value) / 100).toFixed(2), // Convert basis points to percentage
    }), {}),
    
    // AI Engine
    healthScore: data.health ? Number(data.health.overallScore) / 100 : 0,
    emissionRate: (Number(data.emissionRate) / 100).toFixed(2),
    healthMultiplier: (Number(data.healthMultiplier) / 10000).toFixed(4),
    lastCycleTime: data.lastCycleTime ? new Date(Number(data.lastCycleTime) * 1000) : null,
    
    // Treasury
    treasuryValue: formatEther(data.treasuryValue),
    backingRatio: (Number(data.backingRatio) / 100).toFixed(2),
    
    // Price
    tokenPrice: (Number(data.tokenPrice) / 1e18).toFixed(4),
    
    // Referral
    referralRank: data.referralInfo ? Number(data.referralInfo.rank) : 0,
    referralEarnings: data.referralInfo ? formatEther(data.referralInfo.totalEarned) : '0',
  }), [data, circulatingSupply]);

  return {
    // Connection
    address,
    chainId,
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    switchToNetwork,
    
    // Data
    ...data,
    ...formattedData,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchData,
    
    // Helpers
    calculateProjection: (principal: string, stakeType: number) => {
      const principalBigInt = parseEther(principal || '0');
      const apy = data.apys[stakeType] || 0n;
      return calculateProjection(principalBigInt, apy);
    },
  };
}
