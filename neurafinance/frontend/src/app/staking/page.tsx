'use client';

import { useState } from 'react';
import { Coins, Clock, Award, ChevronRight } from 'lucide-react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import CountdownTimer from '@/components/CountdownTimer';

const stakingOptions = [
  { type: 'Flexible', period: '24h', bonus: '0.6%', apy: '80%' },
  { type: 'Fixed', period: '45 Days', bonus: '0.7%', apy: '85%' },
  { type: 'Fixed', period: '90 Days', bonus: '0.8%', apy: '90%' },
  { type: 'Fixed', period: '180 Days', bonus: '0.9%', apy: '95%' },
  { type: 'Fixed', period: '360 Days', bonus: '1.0%', apy: '100%' },
];

export default function StakingPage() {
  const [activeTab, setActiveTab] = useState('list');
  const { isConnected } = usePolygonData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Staking</h1>
        <p className="text-white/50">Earn rewards when you stake your NEURON</p>
      </div>

      {/* Countdown */}
      <div className="mb-6">
        <CountdownTimer />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'list' ? 'text-aip-green' : 'text-white/50 hover:text-white'
          }`}
        >
          Stake List
          {activeTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aip-green" />}
        </button>
        <button 
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'my' ? 'text-aip-green' : 'text-white/50 hover:text-white'
          }`}
        >
          My Staking
          {activeTab === 'my' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aip-green" />}
        </button>
      </div>

      {/* Staking Cards */}
      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakingOptions.map((option, index) => (
            <div key={index} className="glass-aip p-5 rounded-xl border border-white/10 hover:border-aip-green/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-aip-green/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-aip-green" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{option.type.toUpperCase()} STAKE</p>
                    <p className="text-white/40 text-xs">NEURON</p>
                  </div>
                </div>
                <Link 
                  href="/dashboard"
                  onClick={() => {
                    if (!isConnected) {
                      toast.error('Please connect your wallet first');
                      return;
                    }
                  }}
                  className="btn-aip-primary py-2 px-4 text-sm inline-block text-center"
                >
                  Stake
                </Link>
              </div>
              
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                  <Clock className="w-4 h-4 text-white/40" />
                  <span className="text-white/60 text-sm">{option.period}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">{option.bonus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-aip p-8 rounded-xl border border-white/10 text-center">
          <p className="text-white/50">No active staking positions</p>
          <p className="text-white/30 text-sm mt-2">Start staking to earn rewards</p>
        </div>
      )}
    </div>
  );
}
