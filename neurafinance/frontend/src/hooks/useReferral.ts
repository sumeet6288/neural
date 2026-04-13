import { useState, useCallback, useEffect } from 'react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import { ethers, Contract } from 'ethers';
import { 
  getStoredReferral, 
  isReferralRegistered, 
  markReferralRegistered,
  isSelfReferral,
  generateReferralLink
} from '@/utils/referralTracker';
import toast from 'react-hot-toast';

// Referral contract ABI matching actual Referral.sol
const REFERRAL_ABI = [
  "function registerReferrer(address referrer) external",
  "function getUserInfo(address user) external view returns (tuple(address referrer, uint256 referralCount, uint256 teamVolume, uint256 rank, uint256 totalEarned))",
  "function getRankRequirements(uint256 rank) external view returns (tuple(string name, uint256 minStake, uint256 minTeamVolume, uint256 minReferrals, uint256 bonusPercentage))",
  "function calculateRank(address user) external view returns (uint256)",
  "function getReferrals(address referrer) external view returns (address[])",
  "function getReferralCount(address referrer) external view returns (uint256)",
];

// V2 Referral ABI
const REFERRAL_V2_ABI = [
  "function setReferrer(address referrer) external",
  "function getUserInfo(address user) external view returns (tuple(address referrer, uint256 directReferrals, uint256 totalTeamVolume, uint256 rank, uint256 totalEarned))",
  "function getRankInfo(uint256 rank) external view returns (tuple(string name, uint256 minDirect, uint256 minVolume, uint256 feeShareBonus, uint256 governanceMultiplier))",
  "function getUserRank(address user) external view returns (uint256)",
  "function getDirectReferrals(address user) external view returns (address[])",
  "function levelRewards(uint256 level) external view returns (uint256)",
];

export interface ReferralUserInfo {
  referrer: string;
  referralCount: number;
  teamVolume: string;
  rank: number;
  rankName: string;
  totalEarned: string;
  directReferrals: string[];
}

export interface RankRequirements {
  name: string;
  minStake: string;
  minTeamVolume: string;
  minReferrals: number;
  bonusPercentage: number;
}

const RANK_NAMES = [
  'Novice', 'Explorer', 'Seeker', 'Apprentice', 'Journeyman',
  'Adept', 'Expert', 'Elite', 'Master', 'Grandmaster',
  'Legend', 'Mythic', 'Immortal', 'Transcendent', 'Cosmic'
];

export function useReferral() {
  const { address, isConnected } = usePolygonData();
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<ReferralUserInfo | null>(null);
  const [nextRank, setNextRank] = useState<RankRequirements | null>(null);
  const [contractDeployed, setContractDeployed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralContractAddress = process.env.NEXT_PUBLIC_REFERRAL_ADDRESS || '';
  const hasContract = referralContractAddress && referralContractAddress !== '' && referralContractAddress !== '0x0000000000000000000000000000000000000000';

  // Get read-only provider
  const getProvider = useCallback(() => {
    try {
      return new ethers.JsonRpcProvider('https://polygon-rpc.com');
    } catch {
      return null;
    }
  }, []);

  // Get signer for write operations
  const getSigner = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return null;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      return await provider.getSigner();
    } catch {
      return null;
    }
  }, []);

  // Fetch user referral data from contract
  const fetchUserInfo = useCallback(async () => {
    if (!isConnected || !address || !hasContract) {
      setContractDeployed(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      if (!provider) return;

      const contract = new Contract(referralContractAddress, REFERRAL_ABI, provider);
      
      // Verify contract exists
      const code = await provider.getCode(referralContractAddress);
      if (code === '0x') {
        setContractDeployed(false);
        setError('Referral contract not deployed');
        return;
      }
      
      setContractDeployed(true);

      const [info, directRefs] = await Promise.all([
        contract.getUserInfo(address),
        contract.getReferrals(address).catch(() => []),
      ]);

      const rankIndex = Number(info.rank || 0);

      setUserInfo({
        referrer: info.referrer,
        referralCount: Number(info.referralCount || 0),
        teamVolume: ethers.formatEther(info.teamVolume || 0n),
        rank: rankIndex,
        rankName: RANK_NAMES[rankIndex] || 'Unknown',
        totalEarned: ethers.formatEther(info.totalEarned || 0n),
        directReferrals: directRefs.map((a: string) => a),
      });

      // Fetch next rank requirements
      if (rankIndex < 14) {
        try {
          const nextRankInfo = await contract.getRankRequirements(rankIndex + 1);
          setNextRank({
            name: nextRankInfo.name,
            minStake: ethers.formatEther(nextRankInfo.minStake || 0n),
            minTeamVolume: ethers.formatEther(nextRankInfo.minTeamVolume || 0n),
            minReferrals: Number(nextRankInfo.minReferrals || 0),
            bonusPercentage: Number(nextRankInfo.bonusPercentage || 0) / 100,
          });
        } catch {
          // Next rank fetch failed, non-critical
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch referral info:', err);
      setError(err.message || 'Failed to fetch referral data');
      setContractDeployed(false);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, hasContract, referralContractAddress, getProvider]);

  // Register referrer on-chain
  const registerReferrer = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address || !hasContract) return false;
    if (isReferralRegistered()) return true;

    const storedReferrer = getStoredReferral();
    if (!storedReferrer) return false;
    if (isSelfReferral(address, storedReferrer)) {
      toast.error('Cannot refer yourself');
      return false;
    }

    setIsLoading(true);
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');

      const contract = new Contract(referralContractAddress, REFERRAL_ABI, signer);
      
      const tx = await contract.registerReferrer(storedReferrer);
      toast.loading('Registering referral...', { id: 'referral-register' });
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        markReferralRegistered();
        toast.success('Referral registered successfully!', { id: 'referral-register' });
        await fetchUserInfo();
        return true;
      } else {
        toast.error('Referral registration failed', { id: 'referral-register' });
        return false;
      }
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        markReferralRegistered();
        return true;
      }
      console.error('Referral registration failed:', err);
      toast.error(err.reason || err.message || 'Registration failed', { id: 'referral-register' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, hasContract, referralContractAddress, getSigner, fetchUserInfo]);

  // Auto-fetch on wallet connect
  useEffect(() => {
    if (isConnected && address) {
      fetchUserInfo();
    }
  }, [isConnected, address, fetchUserInfo]);

  // Get referral link
  const referralLink = address ? generateReferralLink(address) : '';

  return {
    isLoading,
    userInfo,
    nextRank,
    contractDeployed,
    error,
    referralLink,
    fetchUserInfo,
    registerReferrer,
    hasContract,
  };
}
