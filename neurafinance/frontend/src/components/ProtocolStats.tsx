'use client';

import { usePolygonData } from '@/contexts/PolygonDataContext';
import { 
  TrendingUp, 
  Wallet, 
  PiggyBank, 
  Activity,
  RefreshCw,
  AlertCircle,
  Shield,
  Zap
} from 'lucide-react';

export default function ProtocolStats() {
  const {
    totalSupplyFormatted,
    maxSupplyFormatted,
    circulatingSupply,
    userBalanceFormatted,
    totalStakedFormatted,
    totalUserStakedFormatted,
    totalPendingRewardsFormatted,
    healthScore,
    emissionRateFormatted,
    treasuryValueFormatted,
    backingRatioFormatted,
    tokenPriceFormatted,
    stakingRatio,
    referralRank,
    referralEarnings,
    isLoading,
    error,
    lastUpdated,
    refresh,
    isConnected,
  } = usePolygonData();

  if (error) {
    return (
      <div className="glass-aip rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className="font-medium">Error Loading Data</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
        <button 
          onClick={refresh}
          className="btn-aip mt-4 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const stats = [
    {
      label: 'Total Supply',
      value: totalSupplyFormatted,
      subtext: `${circulatingSupply} circulating`,
      icon: Wallet,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Total Staked',
      value: totalStakedFormatted,
      subtext: `${stakingRatio} of supply`,
      icon: PiggyBank,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Treasury Value',
      value: treasuryValueFormatted,
      subtext: `${backingRatioFormatted} backing`,
      icon: Shield,
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Health Score',
      value: `${healthScore}/100`,
      subtext: `${emissionRateFormatted} emission`,
      icon: Activity,
      color: healthScore > 80 ? 'from-green-500 to-green-600' : 
             healthScore > 60 ? 'from-yellow-500 to-yellow-600' : 
             'from-red-500 to-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-aip-green to-aip-green-dark">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Protocol Overview</h3>
            {lastUpdated && (
              <p className="text-white/40 text-xs">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="btn-aip-icon"
          title="Refresh data"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="glass-aip p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/60 text-sm">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-white">
              {isLoading ? '...' : stat.value}
            </div>
            <div className="text-white/40 text-xs mt-1">{stat.subtext}</div>
          </div>
        ))}
      </div>

      {/* Token Price */}
      <div className="glass-aip p-4 rounded-xl border border-aip-green/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-aip-green to-aip-teal">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white/60 text-sm">NEURON Price</div>
              <div className="text-2xl font-bold text-white">
                {isLoading ? '...' : tokenPriceFormatted}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-sm">Market Cap</div>
            <div className="text-lg font-medium text-white">
              ${formatNumber(parseFloat(circulatingSupply.replace(/,/g, '')) * parseFloat(tokenPriceFormatted.replace('$', '').replace(/,/g, '')))}
            </div>
          </div>
        </div>
      </div>

      {/* User Stats (if connected) */}
      {isConnected && (parseFloat(userBalanceFormatted) > 0 || parseFloat(totalUserStakedFormatted) > 0) && (
        <div className="glass-aip p-4 rounded-xl border border-aip-green/10">
          <h4 className="text-white font-medium mb-4">Your Position</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-white/40 text-xs mb-1">Balance</div>
              <div className="text-white font-medium">{userBalanceFormatted}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Staked</div>
              <div className="text-aip-green font-medium">{totalUserStakedFormatted}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Pending</div>
              <div className="text-aip-teal font-medium">{totalPendingRewardsFormatted}</div>
            </div>
          </div>
          {referralRank !== 'N/A' && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-white/60 text-sm">Referral Rank</div>
                <div className="text-aip-green font-medium">{referralRank}</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-white/60 text-sm">Total Earned</div>
                <div className="text-aip-green font-medium">{referralEarnings} NEURON</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Health Indicator */}
      <div className="glass-aip p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">Protocol Health</span>
          <span className={`text-sm font-medium ${
            healthScore > 80 ? 'text-green-400' : 
            healthScore > 60 ? 'text-yellow-400' : 
            'text-red-400'
          }`}>
            {healthScore > 80 ? 'Excellent' : 
             healthScore > 60 ? 'Good' : 
             healthScore > 40 ? 'Caution' : 'Critical'}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              healthScore > 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
              healthScore > 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
              'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            style={{ width: `${Math.min(healthScore, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
