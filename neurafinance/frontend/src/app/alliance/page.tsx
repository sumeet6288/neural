'use client';

import { useEffect } from 'react';
import { Users, Award, TrendingUp, User, Copy, Coins, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import { useReferral } from '@/hooks/useReferral';
import { getStoredReferral } from '@/utils/referralTracker';
import { shortenAddress } from '@/lib/ethers';
import toast from 'react-hot-toast';

export default function AlliancePage() {
  const { address, isConnected, setShowWalletModal } = usePolygonData();
  const { 
    isLoading, userInfo, nextRank, contractDeployed, error, 
    referralLink, fetchUserInfo, registerReferrer, hasContract 
  } = useReferral();

  const storedReferrer = getStoredReferral();

  // Auto-register referrer when wallet connects
  useEffect(() => {
    if (isConnected && address && storedReferrer && hasContract && contractDeployed) {
      registerReferrer();
    }
  }, [isConnected, address, storedReferrer, hasContract, contractDeployed, registerReferrer]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Calculate progress percentages for next rank
  const calcProgress = (current: number, target: number): number => {
    if (target <= 0) return 0;
    return Math.min(100, (current / target) * 100);
  };

  const teamVolume = parseFloat(userInfo?.teamVolume || '0');
  const referralCount = userInfo?.referralCount || 0;
  const nextRankMinVolume = parseFloat(nextRank?.minTeamVolume || '0');
  const nextRankMinReferrals = nextRank?.minReferrals || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-testid="alliance-page">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">NeuraFinance Public Alliance</h1>
        <p className="text-white/50">Build your team and earn referral rewards</p>
      </div>

      {/* Contract Status Banner */}
      {!hasContract && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3" data-testid="contract-not-deployed-warning">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-yellow-200 text-sm font-medium">Referral Contract Not Deployed</p>
            <p className="text-yellow-200/60 text-xs mt-1">
              The referral smart contract has not been deployed yet. Data shown below will be populated once contracts are live on Polygon.
            </p>
          </div>
        </div>
      )}

      {/* Not Connected Banner */}
      {!isConnected && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <p className="text-white/60 text-sm">Connect your wallet to view your alliance data</p>
          <button 
            onClick={() => setShowWalletModal(true)}
            className="btn-aip-primary py-2 px-4 text-sm"
            data-testid="connect-wallet-alliance"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Referral Link */}
      {isConnected && (
        <div className="glass-aip p-4 rounded-xl border border-white/10 mb-8" data-testid="referral-link-section">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-white/60 text-sm whitespace-nowrap">Your Referral Link:</span>
            <div className="flex-1 relative">
              <input 
                type="text"
                value={referralLink}
                readOnly
                className="input-aip w-full pr-12 text-sm font-mono"
                data-testid="referral-link-input"
              />
              <button 
                onClick={() => copyToClipboard(referralLink)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-aip-green transition-colors"
                data-testid="copy-referral-link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-aip-green animate-spin" />
          <span className="text-white/60 ml-3">Loading alliance data...</span>
        </div>
      )}

      {/* Team Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Team Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-aip p-4 rounded-xl border border-white/10" data-testid="team-members-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-aip-green" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase">Team Members</p>
                <p className="text-white font-semibold">{userInfo?.referralCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="glass-aip p-4 rounded-xl border border-white/10" data-testid="direct-referrals-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                <User className="w-6 h-6 text-aip-green" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase">Direct Referrals</p>
                <p className="text-white font-semibold">{userInfo?.directReferrals?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="glass-aip p-4 rounded-xl border border-white/10" data-testid="team-volume-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-aip-green" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase">Team Volume</p>
                <p className="text-white font-semibold">
                  {parseFloat(userInfo?.teamVolume || '0').toLocaleString('en-US', { maximumFractionDigits: 3 })} NEURON
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-aip p-4 rounded-xl border border-white/10" data-testid="referred-by-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                <User className="w-6 h-6 text-aip-green" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase">Referred By</p>
                <p className="text-white font-mono text-sm">
                  {userInfo?.referrer && userInfo.referrer !== '0x0000000000000000000000000000000000000000'
                    ? shortenAddress(userInfo.referrer)
                    : storedReferrer 
                      ? `${shortenAddress(storedReferrer)} (pending)`
                      : 'No referrer'}
                </p>
              </div>
            </div>
            {userInfo?.referrer && userInfo.referrer !== '0x0000000000000000000000000000000000000000' && (
              <button 
                onClick={() => copyToClipboard(userInfo.referrer)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Copy className="w-4 h-4 text-white/40" />
              </button>
            )}
          </div>
        </div>
        <div className="glass-aip p-4 rounded-xl border border-white/10" data-testid="user-address-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                <User className="w-6 h-6 text-aip-green" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase">Your Address</p>
                <p className="text-white font-mono text-sm">
                  {isConnected && address ? shortenAddress(address) : 'Not connected'}
                </p>
              </div>
            </div>
            {isConnected && address && (
              <button 
                onClick={() => copyToClipboard(address)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Copy className="w-4 h-4 text-white/40" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Guild Expansion Rewards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="glass-aip p-4 rounded-xl border border-white/10" data-testid="rank-card">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-white/40" />
              <span className="text-white/40 text-xs uppercase">My Rank</span>
            </div>
            <p className="font-semibold text-white">{userInfo?.rankName || 'Novice'}</p>
          </div>
          <div className="glass-aip p-4 rounded-xl border border-white/10" data-testid="total-earned-card">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-aip-green" />
              <span className="text-white/40 text-xs uppercase">Total Earned</span>
            </div>
            <p className="font-semibold text-aip-green">
              {parseFloat(userInfo?.totalEarned || '0').toLocaleString('en-US', { maximumFractionDigits: 3 })} NEURON
            </p>
          </div>
          <div className="glass-aip p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-aip-green" />
              <span className="text-white/40 text-xs uppercase">Direct Reward</span>
            </div>
            <p className="font-semibold text-aip-green">10%</p>
          </div>
          <div className="glass-aip p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-aip-green" />
              <span className="text-white/40 text-xs uppercase">Levels</span>
            </div>
            <p className="font-semibold text-aip-green">5 Levels</p>
          </div>
          <div className="glass-aip p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-aip-green" />
              <span className="text-white/40 text-xs uppercase">Rank Bonus</span>
            </div>
            <p className="font-semibold text-aip-green">
              {nextRank ? `${nextRank.bonusPercentage}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Next Rank Progress */}
      <div className="glass-aip p-6 rounded-xl border border-white/10 mb-8" data-testid="rank-progress">
        <h2 className="text-lg font-semibold text-white mb-1">Next Rank Progress</h2>
        <p className="text-aip-green text-sm mb-6">
          Next Rank: {nextRank?.name || 'Explorer'}
        </p>

        <div className="space-y-6">
          {/* Team Volume Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Team Volume</span>
              <span className="text-white/40 text-xs">PROGRESS</span>
            </div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-aip-green">
                {teamVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {nextRankMinVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })} NEURON
              </span>
              <span className="text-white/40">{calcProgress(teamVolume, nextRankMinVolume).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-aip-green to-aip-green-light rounded-full transition-all duration-500"
                style={{ width: `${calcProgress(teamVolume, nextRankMinVolume)}%` }}
              />
            </div>
          </div>

          {/* Referral Count Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Direct Referrals</span>
              <span className="text-white/40 text-xs">PROGRESS</span>
            </div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-aip-green">
                {referralCount} / {nextRankMinReferrals} Referrals
              </span>
              <span className="text-white/40">{calcProgress(referralCount, nextRankMinReferrals).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-aip-green to-aip-green-light rounded-full transition-all duration-500"
                style={{ width: `${calcProgress(referralCount, nextRankMinReferrals)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Direct Referral List */}
      <div className="glass-aip p-6 rounded-xl border border-white/10" data-testid="referral-list">
        <h2 className="text-lg font-semibold text-white mb-2">
          Direct Referrals ({userInfo?.directReferrals?.length || 0})
        </h2>
        {userInfo?.directReferrals && userInfo.directReferrals.length > 0 ? (
          <div className="space-y-2 mt-4">
            {userInfo.directReferrals.map((ref, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white font-mono text-sm">{shortenAddress(ref)}</span>
                <button 
                  onClick={() => copyToClipboard(ref)}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-white/50 text-sm mb-2">No referrals yet</p>
            <p className="text-white/30 text-sm">Share your referral link to start building your team.</p>
          </div>
        )}
      </div>
    </div>
  );
}
