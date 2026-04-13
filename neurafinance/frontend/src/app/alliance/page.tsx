'use client';

import { Users, Award, TrendingUp, User, Copy, Coins } from 'lucide-react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import toast from 'react-hot-toast';

const teamStats = [
  { icon: Users, label: 'Team Members', value: '0' },
  { icon: User, label: 'Active Members', value: '0' },
  { icon: TrendingUp, label: 'Team Business', value: '0.000 NEURON' },
];

const directStats = [
  { icon: Users, label: 'Direct Referrals', value: '0' },
  { icon: User, label: 'Active Direct Referrals', value: '0' },
  { icon: TrendingUp, label: 'Direct Business', value: '0.000 NEURON' },
];

const rewards = [
  { icon: Award, label: 'MY RANK', value: 'N/A' },
  { icon: Coins, label: 'MY STAKING', value: '0.000 NEURON' },
  { icon: Award, label: 'PRIME REWARD', value: '0.000 NEURON', highlight: true },
  { icon: Users, label: 'ALLIANCE REWARD', value: '0.000 NEURON', highlight: true },
  { icon: TrendingUp, label: 'GLOBAL REWARD', value: '0.000 NEURON', highlight: true },
];

const progressBars = [
  { label: 'My Stake', current: '0.000', target: '1,000', unit: 'USD', percent: 0 },
  { label: 'Team Business', current: '0.000', target: '10,000', unit: 'USD', percent: 0 },
  { label: 'Direct Active Referral Count', current: '0', target: '5', unit: 'Active Direct', percent: 0 },
];

export default function AlliancePage() {
  const { address, isConnected } = usePolygonData();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">NeuraFinance Public Alliance</h1>
        <p className="text-white/50">Build your team and earn rewards</p>
      </div>

      {/* Team Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Team Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {teamStats.map((stat, index) => (
            <div key={index} className="glass-aip p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-aip-green" />
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase">{stat.label}</p>
                  <p className="text-white font-semibold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Referral */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Direct Referral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {directStats.map((stat, index) => (
            <div key={index} className="glass-aip p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-aip-green" />
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase">{stat.label}</p>
                  <p className="text-white font-semibold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-aip p-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                <User className="w-6 h-6 text-aip-green" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase">Referral by</p>
                <p className="text-white font-mono text-sm">{isConnected ? '0xF97B...4788' : 'Not connected'}</p>
              </div>
            </div>
            <button 
              onClick={() => copyToClipboard('0xF97B5b2791899A0B572D4d1247C87dd8D6374788')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Copy className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
        <div className="glass-aip p-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                <User className="w-6 h-6 text-aip-green" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase">User Address</p>
                <p className="text-white font-mono text-sm">{isConnected ? address?.slice(0, 6) + '...' + address?.slice(-4) : 'Not connected'}</p>
              </div>
            </div>
            <button 
              onClick={() => isConnected && address && copyToClipboard(address)}
              disabled={!isConnected}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Copy className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </div>

      {/* Guild Expansion Reward */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Guild Expansion Reward</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {rewards.map((reward, index) => (
            <div key={index} className="glass-aip p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <reward.icon className={`w-4 h-4 ${reward.highlight ? 'text-aip-green' : 'text-white/40'}`} />
                <span className="text-white/40 text-xs uppercase">{reward.label}</span>
              </div>
              <p className={`font-semibold ${reward.highlight ? 'text-aip-green' : 'text-white'}`}>
                {reward.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Rank Progress */}
      <div className="glass-aip p-6 rounded-xl border border-white/10 mb-8">
        <h2 className="text-lg font-semibold text-white mb-1">Next Rank Progress</h2>
        <p className="text-aip-green text-sm mb-6">Next Rank: Nova</p>

        <div className="space-y-6">
          {progressBars.map((progress, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">{progress.label}</span>
                <span className="text-white/40 text-xs">PROGRESS</span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-aip-green">{progress.current} / {progress.target} {progress.unit}</span>
                <span className="text-white/40">{progress.percent}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-aip-green to-aip-green-light rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Referral List */}
      <div className="glass-aip p-6 rounded-xl border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-2">Direct Referral 0</h2>
        <p className="text-white/50 text-sm mb-4">No Referral Available</p>
        <p className="text-white/30 text-sm">Share your referral link to start building your team.</p>
      </div>
    </div>
  );
}
