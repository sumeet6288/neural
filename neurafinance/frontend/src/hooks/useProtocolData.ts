import { useState, useEffect, useCallback } from 'react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import { getContract, getSigner } from '@/utils/web3';
import { NEURON_TOKEN_ABI, TREASURY_ABI, AI_ENGINE_ABI, STAKING_ABI } from '@/config/abis';
import { CONTRACTS } from '@/config/contracts';
import { formatUnits } from 'ethers';

interface ProtocolMetrics {
  totalSupply: string;
  totalStaked: string;
  tvl: string;
  tokenPrice: string;
  marketCap: string;
  stakingRatio: string;
  healthScore: string;
  isStable: boolean;
  priceDeviation: string;
}

interface UserMetrics {
  neuronBalance: string;
  usdtBalance: string;
  totalStaked: string;
  pendingRewards: string;
  referralCount: number;
  referralEarnings: string;
  rank: string;
}

export function useProtocolData() {
  const { address, isConnected } = usePolygonData();
  const [loading, setLoading] = useState(true);
  const [protocolMetrics, setProtocolMetrics] = useState<ProtocolMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);

  // Fetch protocol-wide metrics
  const fetchProtocolMetrics = useCallback(async () => {
    try {
      const signer = await getSigner();
      const provider = signer || (typeof window !== 'undefined' && window.ethereum);
      
      if (!provider) return null;

      const tokenContract = getContract(CONTRACTS.NEURON_TOKEN, NEURON_TOKEN_ABI, signer || undefined);
      const treasuryContract = getContract(CONTRACTS.TREASURY, TREASURY_ABI, signer || undefined);
      const aiEngineContract = getContract(CONTRACTS.AI_ENGINE, AI_ENGINE_ABI, signer || undefined);
      const stakingContract = getContract(CONTRACTS.STAKING, STAKING_ABI, signer || undefined);

      // Validate all contracts are initialized
      if (!tokenContract || !treasuryContract || !aiEngineContract || !stakingContract) {
        console.error('Contract addresses not configured');
        return null;
      }

      // Fetch all metrics in parallel
      const [
        totalSupply,
        totalStaked,
        tvl,
        tokenPrice,
        healthScore,
        stabilityCheck
      ] = await Promise.all([
        tokenContract.totalSupply(),
        stakingContract.globalTotalStaked(),
        treasuryContract.getTotalValueLocked(),
        aiEngineContract.getCurrentPrice(),
        aiEngineContract.getSystemHealth(),
        aiEngineContract.checkPriceStability()
      ]);

      // Calculate derived metrics
      const totalSupplyFormatted = parseFloat(formatUnits(totalSupply, 18));
      const totalStakedFormatted = parseFloat(formatUnits(totalStaked, 18));
      const tokenPriceFormatted = parseFloat(formatUnits(tokenPrice, 18));
      const marketCap = totalSupplyFormatted * tokenPriceFormatted;
      const stakingRatio = totalSupplyFormatted > 0 ? (totalStakedFormatted / totalSupplyFormatted) * 100 : 0;

      const metrics: ProtocolMetrics = {
        totalSupply: totalSupplyFormatted.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        totalStaked: totalStakedFormatted.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        tvl: parseFloat(formatUnits(tvl, 18)).toLocaleString('en-US', { maximumFractionDigits: 2 }),
        tokenPrice: `$${tokenPriceFormatted.toFixed(2)}`,
        marketCap: `$${marketCap.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        stakingRatio: `${stakingRatio.toFixed(2)}%`,
        healthScore: healthScore.toString(),
        isStable: stabilityCheck.isStable,
        priceDeviation: `${parseFloat(formatUnits(stabilityCheck.deviation, 18)).toFixed(2)}%`
      };

      setProtocolMetrics(metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to fetch protocol metrics:', error);
      return null;
    }
  }, []);

  // Fetch user-specific metrics
  const fetchUserMetrics = useCallback(async () => {
    if (!isConnected || !address) return null;

    try {
      const signer = await getSigner();
      if (!signer) return null;

      const tokenContract = getContract(CONTRACTS.NEURON_TOKEN, NEURON_TOKEN_ABI, signer);
      const stakingContract = getContract(CONTRACTS.STAKING, STAKING_ABI, signer);

      // Validate contracts
      if (!tokenContract || !stakingContract) {
        console.error('Contract addresses not configured');
        return null;
      }

      // Fetch user data in parallel
      const [
        neuronBalance,
        totalStaked
      ] = await Promise.all([
        tokenContract.balanceOf(address),
        stakingContract.getTotalStaked(address)
      ]);

      // Calculate pending rewards across all stakes
      const activeStakeIds = await stakingContract.getUserStakes(address);
      let totalPendingRewards = BigInt(0);
      
      for (const stakeId of activeStakeIds) {
        const pending = await stakingContract.calculatePendingRewards(address, stakeId);
        totalPendingRewards += pending;
      }

      const userMetrics: UserMetrics = {
        neuronBalance: parseFloat(formatUnits(neuronBalance, 18)).toFixed(3),
        usdtBalance: '0.000', // TODO: Add USDT balance fetch
        totalStaked: parseFloat(formatUnits(totalStaked, 18)).toFixed(3),
        pendingRewards: parseFloat(formatUnits(totalPendingRewards, 18)).toFixed(3),
        referralCount: 0, // TODO: Add referral contract integration
        referralEarnings: '0.000', // TODO: Add referral earnings
        rank: 'N/A' // TODO: Add rank calculation
      };

      setUserMetrics(userMetrics);
      return userMetrics;
    } catch (error) {
      console.error('Failed to fetch user metrics:', error);
      return null;
    }
  }, [isConnected, address]);

  // Auto-fetch on mount and when wallet connects - DISABLED for demo mode
  useEffect(() => {
    // Skip blockchain calls - using static demo data instead
    setLoading(false);
    
    // Set static demo data
    setProtocolMetrics({
      totalSupply: '7,986,831.94',
      totalStaked: '5,234,567.89',
      tvl: '3,711,771.81',
      tokenPrice: '$2.17',
      marketCap: '$17,316,457.99',
      stakingRatio: '65.54%',
      healthScore: '98',
      isStable: true,
      priceDeviation: '0.50%'
    });
    
    setUserMetrics({
      neuronBalance: '0.000',
      usdtBalance: '0.000',
      totalStaked: '0.000',
      pendingRewards: '0.000',
      referralCount: 0,
      referralEarnings: '0.000',
      rank: 'N/A'
    });
    
    // No interval - static data doesn't need refreshing
    return () => {};
    
    /*
    // Original blockchain fetching code - disabled
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProtocolMetrics(),
        fetchUserMetrics()
      ]);
      setLoading(false);
    };

    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
    */
  }, []);

  // Manual refresh function - disabled for demo mode
  const refresh = useCallback(async () => {
    // In demo mode, just return static data
    console.log('[Demo] Refresh called - returning static data');
    return {
      protocolMetrics,
      userMetrics
    };
    
    /*
    // Original blockchain refresh - disabled
    setLoading(true);
    await Promise.all([
      fetchProtocolMetrics(),
      fetchUserMetrics()
    ]);
    setLoading(false);
    */
  }, [protocolMetrics, userMetrics]);

  return {
    loading,
    protocolMetrics,
    userMetrics,
    refresh,
    fetchProtocolMetrics,
    fetchUserMetrics
  };
}
