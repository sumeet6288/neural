'use client';

import { useState } from 'react';
import { Coins, Clock, Award, Lock } from 'lucide-react';
import { usePolygonData } from '@/hooks/usePolygonData';
import toast from 'react-hot-toast';
import CountdownTimer from '@/components/CountdownTimer';

const bondOptions = [
  { period: '45 Days', bonus: '0.7%', apy: '85%' },
  { period: '90 Days', bonus: '0.8%', apy: '90%' },
  { period: '180 Days', bonus: '0.9%', apy: '95%' },
  { period: '360 Days', bonus: '1.0%', apy: '100%' },
];

export default function BondPage() {
  const [activeTab, setActiveTab] = useState('list');
  const { isConnected } = usePolygonData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Bonding</h1>
        <p className="text-white/50">Stake USDT to earn NEURON rewards</p>
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
          Bond Listings
          {activeTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aip-green" />}
        </button>
        <button 
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'my' ? 'text-aip-green' : 'text-white/50 hover:text-white'
          }`}
        >
          My Bonds
          {activeTab === 'my' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aip-green" />}
        </button>
      </div>

      {/* Bond Cards */}
      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bondOptions.map((option, index) => (
            <div key={index} className="glass-aip p-5 rounded-xl border border-white/10 hover:border-aip-green/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-lg bg-aip-green/10 flex items-center justify-center border-2 border-[#010101]">
                      <Coins className="w-5 h-5 text-aip-green" />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border-2 border-[#010101]">
                      <span className="text-blue-400 text-xs font-bold">USDT</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">BOND STAKE</p>
                    <p className="text-white/40 text-xs">NEURON + USDT</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!isConnected) {
                      toast.error('Please connect your wallet first');
                      return;
                    }
                    toast.success(`Bond position created for ${option.period}`);
                  }}
                  className={`py-2 px-4 text-sm rounded-lg transition-colors ${
                    isConnected 
                      ? 'bg-aip-green text-black hover:bg-aip-green-light' 
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                  disabled={!isConnected}
                >
                  Bond
                </button>
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
          <p className="text-white/50">No active bond positions</p>
          <p className="text-white/30 text-sm mt-2">Start bonding to earn NEURON rewards</p>
        </div>
      )}
    </div>
  );
}
