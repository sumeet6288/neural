'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESSES,
  RPC_URLS,
  TOKEN_ABI,
  STAKING_ABI,
  AI_ENGINE_ABI,
  TREASURY_ABI,
  REFERRAL_ABI,
  PRICE_FEED_ABI,
  NETWORK_CONFIG,
} from '@/config/contracts';

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

export interface ProtocolData {
  // Token
  totalSupply: bigint;
  maxSupply: bigint;
  userBalance: bigint;
  
  // Staking
  totalStaked: bigint;
  userStakes: UserStake[];
  apys: { [key: number]: bigint };
  
  // AI Engine
  health: SystemHealth | null;
  emissionRate: bigint;
  lastCycleTime: bigint;
  
  // Treasury
  treasuryValue: bigint;
  backingRatio: bigint;
  
  // Price
  tokenPrice: bigint;
  
  // Referral
  referralInfo: {
    referrer: string;
    directReferrals: bigint;
    totalTeamVolume: bigint;
    rank: bigint;
    totalEarned: bigint;
  } | null;
}

// Global provider instance
let provider: ethers.Provider | null = null;
let signer: ethers.Signer | null = null;

export function useBlockchain() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize provider
  const getProvider = useCallback(() => {
    if (provider) return provider;
    
    if (typeof window !== 'undefined' && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      // Fallback to read-only provider
      provider = new ethers.JsonRpcProvider(RPC_URLS[137]); // Polygon mainnet
    }
    return provider;
  }, []);

  // Get signer
  const getSigner = useCallback(async () => {
    if (signer) return signer;
    const prov = getProvider();
    if (prov instanceof ethers.BrowserProvider) {
      signer = await prov.getSigner();
    }
    return signer;
  }, [getProvider]);

  // Get contract instances
  const getContracts = useCallback((useSigner = false) => {
    const prov = useSigner ? signer : getProvider();
    if (!prov || !chainId) return null;
    
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses) return null;

    return {
      token: new ethers.Contract(addresses.NEURON_TOKEN, TOKEN_ABI, prov),
      staking: new ethers.Contract(addresses.STAKING, STAKING_ABI, prov),
      aiEngine: new ethers.Contract(addresses.AI_ENGINE, AI_ENGINE_ABI, prov),
      treasury: new ethers.Contract(addresses.TREASURY, TREASURY_ABI, prov),
      referral: new ethers.Contract(addresses.REFERRAL, REFERRAL_ABI, prov),
      priceFeed: new ethers.Contract(addresses.PRICE_FEED, PRICE_FEED_ABI, prov),
    };
  }, [chainId, getProvider]);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await browserProvider.send('eth_requestAccounts', []);
      
      const newSigner = await browserProvider.getSigner();
      const userAddress = await newSigner.getAddress();
      const network = await browserProvider.getNetwork();
      
      signer = newSigner;
      provider = browserProvider;
      setAddress(userAddress);
      setChainId(Number(network.chainId));
      setIsConnected(true);
      
      // Store in localStorage
      localStorage.setItem('walletConnected', 'true');
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    signer = null;
    provider = null;
    localStorage.removeItem('walletConnected');
    
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetChainId: number) => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return false;
      
      const ethereum = window.ethereum as any;
      
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      
      return true;
    } catch (err: any) {
      if (err.code === 4902) {
        // Chain not added
        const config = NETWORK_CONFIG[targetChainId as keyof typeof NETWORK_CONFIG];
        if (!config) return false;
        
        try {
          const ethereum = window.ethereum as any;
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: config.name,
              nativeCurrency: config.nativeCurrency,
              rpcUrls: [RPC_URLS[targetChainId as keyof typeof RPC_URLS]],
              blockExplorerUrls: [config.blockExplorer],
            }],
          });
          return true;
        } catch (addError) {
          return false;
        }
      }
      return false;
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      if (wasConnected === 'true' && typeof window !== 'undefined' && window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await browserProvider.send('eth_accounts', []);
          
          if (accounts.length > 0) {
            const newSigner = await browserProvider.getSigner();
            const userAddress = await newSigner.getAddress();
            const network = await browserProvider.getNetwork();
            
            signer = newSigner;
            provider = browserProvider;
            setAddress(userAddress);
            setChainId(Number(network.chainId));
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Auto-connect failed:', err);
        }
      }
    };
    
    autoConnect();
  }, []);

  // Listen for account/network changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    const ethereum = window.ethereum as any;
    
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        disconnect();
      } else {
        setAddress(accs[0]);
      }
    };
    
    const handleChainChanged = (chainIdHex: unknown) => {
      setChainId(parseInt(chainIdHex as string, 16));
      window.location.reload();
    };
    
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);
    
    return () => {
      ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  return {
    address,
    chainId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
    getProvider,
    getSigner,
    getContracts,
  };
}
