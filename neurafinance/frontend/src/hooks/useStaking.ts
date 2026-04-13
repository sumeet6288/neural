import { useState, useCallback } from 'react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import { getContract, getSigner } from '@/utils/web3';
import { STAKING_ABI, NEURON_TOKEN_ABI } from '@/config/abis';
import { CONTRACTS } from '@/config/contracts';
import toast from 'react-hot-toast';
import { parseUnits, formatUnits } from 'ethers';

interface StakeInfo {
  amount: bigint;
  startTime: bigint;
  endTime: bigint;
  rewardRate: bigint;
  lastClaimTime: bigint;
  pendingRewards: bigint;
  isFlexible: boolean;
  active: boolean;
}

export function useStaking() {
  const { address, isConnected } = usePolygonData();
  const [isLoading, setIsLoading] = useState(false);
  const [userStakes, setUserStakes] = useState<StakeInfo[]>([]);
  const [totalStaked, setTotalStaked] = useState<bigint>(BigInt(0));
  const [neuronBalance, setNeuronBalance] = useState<bigint>(BigInt(0));

  // Fetch user's NEURON token balance
  const fetchBalance = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      const signer = await getSigner();
      if (!signer) return;
      
      const tokenContract = getContract(CONTRACTS.NEURON_TOKEN, NEURON_TOKEN_ABI, signer);
      if (!tokenContract) {
        console.error('Token contract not initialized');
        return;
      }
      
      const balance = await tokenContract.balanceOf(address);
      setNeuronBalance(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [isConnected, address]);

  // Fetch user's staking positions
  const fetchStakes = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      const signer = await getSigner();
      if (!signer) return;
      
      const stakingContract = getContract(CONTRACTS.STAKING, STAKING_ABI, signer);
      if (!stakingContract) {
        console.error('Staking contract not initialized');
        return;
      }
      
      // Get total staked
      const total = await stakingContract.getTotalStaked(address);
      setTotalStaked(total);
      
      // Get active stake IDs
      const activeStakeIds = await stakingContract.getUserStakes(address);
      
      // Fetch details for each stake
      const stakes: StakeInfo[] = [];
      for (const stakeId of activeStakeIds) {
        const stakeInfo = await stakingContract.getStakeInfo(address, stakeId);
        stakes.push(stakeInfo);
      }
      
      setUserStakes(stakes);
    } catch (error) {
      console.error('Failed to fetch stakes:', error);
    }
  }, [isConnected, address]);

  // Stake tokens
  const stake = useCallback(async (amount: string, lockDuration: number) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');
      
      const amountWei = parseUnits(amount, 18);
      
      // First, approve token spending
      const tokenContract = getContract(CONTRACTS.NEURON_TOKEN, NEURON_TOKEN_ABI, signer);
      if (!tokenContract) throw new Error('Token contract not initialized');
      
      const approveTx = await tokenContract.approve(CONTRACTS.STAKING, amountWei);
      
      toast.loading('Approving token spending...', { id: 'approve' });
      await approveTx.wait();
      toast.success('Token approval confirmed', { id: 'approve' });
      
      // Then stake
      const stakingContract = getContract(CONTRACTS.STAKING, STAKING_ABI, signer);
      if (!stakingContract) throw new Error('Staking contract not initialized');
      
      const stakeTx = await stakingContract.stake(amountWei, lockDuration);
      
      toast.loading('Staking tokens...', { id: 'stake' });
      const receipt = await stakeTx.wait();
      
      if (receipt.status === 1) {
        toast.success(`Successfully staked ${amount} NEURON`, { id: 'stake' });
        
        // Refresh data
        await Promise.all([fetchBalance(), fetchStakes()]);
        return true;
      } else {
        toast.error('Staking transaction failed', { id: 'stake' });
        return false;
      }
    } catch (error: any) {
      console.error('Staking failed:', error);
      toast.error(error.reason || error.message || 'Staking failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, fetchBalance, fetchStakes]);

  // Unstake tokens
  const unstake = useCallback(async (stakeId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');
      
      const stakingContract = getContract(CONTRACTS.STAKING, STAKING_ABI, signer);
      if (!stakingContract) throw new Error('Staking contract not initialized');
      
      const tx = await stakingContract.unstake(stakeId);
      
      toast.loading('Unstaking tokens...', { id: 'unstake' });
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success('Successfully unstaked', { id: 'unstake' });
        await Promise.all([fetchBalance(), fetchStakes()]);
        return true;
      } else {
        toast.error('Unstaking failed', { id: 'unstake' });
        return false;
      }
    } catch (error: any) {
      console.error('Unstaking failed:', error);
      toast.error(error.reason || error.message || 'Unstaking failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, fetchBalance, fetchStakes]);

  // Claim rewards
  const claimRewards = useCallback(async (stakeId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');
      
      const stakingContract = getContract(CONTRACTS.STAKING, STAKING_ABI, signer);
      if (!stakingContract) throw new Error('Staking contract not initialized');
      
      const tx = await stakingContract.claimRewards(stakeId);
      
      toast.loading('Claiming rewards...', { id: 'claim' });
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success('Rewards claimed successfully', { id: 'claim' });
        await Promise.all([fetchBalance(), fetchStakes()]);
        return true;
      } else {
        toast.error('Claim failed', { id: 'claim' });
        return false;
      }
    } catch (error: any) {
      console.error('Claim failed:', error);
      toast.error(error.reason || error.message || 'Claim failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, fetchBalance, fetchStakes]);

  // Compound rewards
  const compoundRewards = useCallback(async (stakeId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsLoading(true);
    
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');
      
      const stakingContract = getContract(CONTRACTS.STAKING, STAKING_ABI, signer);
      if (!stakingContract) throw new Error('Staking contract not initialized');
      
      const tx = await stakingContract.compoundRewards(stakeId);
      
      toast.loading('Compounding rewards...', { id: 'compound' });
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success('Rewards compounded successfully', { id: 'compound' });
        await fetchStakes();
        return true;
      } else {
        toast.error('Compound failed', { id: 'compound' });
        return false;
      }
    } catch (error: any) {
      console.error('Compound failed:', error);
      toast.error(error.reason || error.message || 'Compound failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, fetchStakes]);

  return {
    isLoading,
    userStakes,
    totalStaked,
    neuronBalance,
    fetchBalance,
    fetchStakes,
    stake,
    unstake,
    claimRewards,
    compoundRewards,
  };
}
