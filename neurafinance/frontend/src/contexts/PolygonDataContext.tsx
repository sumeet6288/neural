'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

export interface ContractData {
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalSupply: bigint;
  maxSupply: bigint;
  userBalance: bigint;
  totalStaked: bigint;
  userStakes: any[];
  totalUserStaked: bigint;
  totalPendingRewards: bigint;
  apys: Record<number, bigint>;
  health: any;
  emissionRate: bigint;
  healthMultiplier: bigint;
  lastCycleTime: bigint;
  treasuryValue: bigint;
  backingRatio: bigint;
  tokenPrice: bigint;
  priceDecimals: number;
  referralInfo: any;
}

interface PolygonDataContextType {
  // Connection
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToNetwork: (targetChainId: number) => Promise<void>;
  
  // Data (simplified for demo)
  totalSupply: bigint;
  maxSupply: bigint;
  userBalance: bigint;
  totalStaked: bigint;
  totalUserStaked: bigint;
  totalPendingRewards: bigint;
  treasuryValue: bigint;
  backingRatio: bigint;
  tokenPrice: bigint;
  emissionRate: bigint;
  healthScore: number;
  stakingRatio: string;
  referralRank: string;
  referralEarnings: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  
  // Formatted strings
  totalSupplyFormatted: string;
  maxSupplyFormatted: string;
  circulatingSupply: string;
  userBalanceFormatted: string;
  totalStakedFormatted: string;
  totalUserStakedFormatted: string;
  totalPendingRewardsFormatted: string;
  treasuryValueFormatted: string;
  backingRatioFormatted: string;
  tokenPriceFormatted: string;
  emissionRateFormatted: string;
}

const defaultContractData: ContractData = {
  tokenName: 'NeuraFinance',
  tokenSymbol: 'NEURON',
  tokenDecimals: 18,
  totalSupply: 7986831940000000000000000n, // ~7.98M
  maxSupply: 21000000000000000000000000n, // 21M
  userBalance: 0n,
  totalStaked: 5234567890000000000000000n, // ~5.23M
  userStakes: [],
  totalUserStaked: 0n,
  totalPendingRewards: 0n,
  apys: {},
  health: null,
  emissionRate: 0n,
  healthMultiplier: 0n,
  lastCycleTime: 0n,
  treasuryValue: 3711771810000000000000000n, // ~3.71M
  backingRatio: 0n,
  tokenPrice: 2170000000000000000n, // $2.17
  priceDecimals: 8,
  referralInfo: null,
};

const PolygonDataContext = createContext<PolygonDataContextType | undefined>(undefined);

export function PolygonDataProvider({ children }: { children: React.ReactNode }) {
  // Connection state
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Contract data state - using static demo data
  const [data] = useState<ContractData>(defaultContractData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  
  const isMounted = useRef(true);

  // Connect wallet
  const connect = useCallback(async () => {
    console.log('[Wallet] Connect button clicked');
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      console.log('[Wallet] Calling connectWallet()...');
      const result = await connectWallet();
      console.log('[Wallet] connectWallet result:', result);
      
      if (result) {
        setAddress(result.address);
        setChainId(result.chainId);
        setIsConnected(true);
        localStorage.setItem('walletConnected', 'true');
        console.log('[Wallet] Connected successfully:', result.address);
      }
    } catch (err: any) {
      console.error('[Wallet] Connection failed:', err);
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
  }, []);

  // Switch network
  const switchToNetwork = useCallback(async (targetChainId: number) => {
    try {
      const switched = await switchNetwork(targetChainId);
      if (!switched) {
        const added = await addNetwork(targetChainId);
        if (added) {
          await switchNetwork(targetChainId);
        }
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to switch network');
    }
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
        window.location.reload();
      }
    );

    return cleanup;
  }, [isConnected, disconnect]);

  // Calculate formatted values
  const formattedData = useMemo(() => {
    const formatTokenAmount = (value: bigint, decimals = 18) => {
      if (!value) return '0.000';
      return parseFloat(ethers.formatUnits(value, decimals)).toLocaleString('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      });
    };

    const formatCurrency = (value: bigint, decimals = 18) => {
      if (!value) return '$0.00';
      const num = parseFloat(ethers.formatUnits(value, decimals));
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatPrice = (value: bigint, decimals = 8) => {
      if (!value) return '$0.00';
      const num = parseFloat(ethers.formatUnits(value, decimals));
      return `$${num.toFixed(2)}`;
    };

    const totalSupplyNum = parseFloat(formatEther(data.totalSupply));
    const totalStakedNum = parseFloat(formatEther(data.totalStaked));
    const stakingRatio = totalSupplyNum > 0 ? ((totalStakedNum / totalSupplyNum) * 100).toFixed(2) : '0.00';

    return {
      totalSupplyFormatted: formatTokenAmount(data.totalSupply),
      maxSupplyFormatted: formatTokenAmount(data.maxSupply),
      circulatingSupply: formatTokenAmount(data.totalSupply - data.totalStaked),
      userBalanceFormatted: formatTokenAmount(data.userBalance),
      totalStakedFormatted: formatTokenAmount(data.totalStaked),
      totalUserStakedFormatted: formatTokenAmount(data.totalUserStaked),
      totalPendingRewardsFormatted: formatTokenAmount(data.totalPendingRewards),
      treasuryValueFormatted: formatCurrency(data.treasuryValue),
      backingRatioFormatted: `${(parseFloat(formatEther(data.backingRatio || 0n)) * 100).toFixed(2)}%`,
      tokenPriceFormatted: formatPrice(data.tokenPrice, data.priceDecimals),
      emissionRateFormatted: formatTokenAmount(data.emissionRate),
      stakingRatio: `${stakingRatio}%`,
      healthScore: 98,
      referralRank: 'N/A',
      referralEarnings: '0.000',
    };
  }, [data]);

  const refresh = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  const value = useMemo(() => ({
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
    refresh,
  }), [address, chainId, isConnected, isConnecting, connectionError, connect, disconnect, switchToNetwork, data, formattedData, isLoading, error, lastUpdated, refresh]);

  return (
    <PolygonDataContext.Provider value={value}>
      {children}
    </PolygonDataContext.Provider>
  );
}

export function usePolygonData() {
  const context = useContext(PolygonDataContext);
  if (context === undefined) {
    throw new Error('usePolygonData must be used within a PolygonDataProvider');
  }
  return context;
}
