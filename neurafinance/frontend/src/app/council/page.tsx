'use client';

import { Info, CheckCircle, XCircle } from 'lucide-react';
import { usePolygonData } from '@/hooks/usePolygonData';
import toast from 'react-hot-toast';

const proposals = [
  {
    id: 'NEURON #8482',
    status: 'Succeeded',
    date: '31 MAR 2026',
    title: 'Enable AI-Based POL Allocation from ALS Treasury',
    totalVotes: '90,859.11',
    outcome: 'MAJORITY YES',
    yesPercent: 92.12,
    noPercent: 7.88,
  },
  {
    id: 'NEURON #8384',
    status: 'Succeeded',
    date: '31 MAR 2026',
    title: 'Enable AI-Based ETH Allocation from ALS Treasury',
    totalVotes: '66,518.32',
    outcome: 'MAJORITY YES',
    yesPercent: 89.37,
    noPercent: 0,
  },
  {
    id: 'NEURON #6366',
    status: 'Succeeded',
    date: '20 MAR 2026',
    title: 'Enable AI-Based BTC Allocation from ALS Treasury',
    totalVotes: '87,140.33',
    outcome: 'MAJORITY YES',
    yesPercent: 98.68,
    noPercent: 1.32,
  },
];

export default function CouncilPage() {
  const { isConnected } = usePolygonData();
  
  const handleEligibilityCheck = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    toast('You need to stake NEURON to gain governance weight', { icon: 'ℹ️' });
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Governance Council</h1>
        <p className="text-white/50">Submit strategic resolutions and shape the future of NeuraFinance through weighted governance</p>
      </div>

      {/* Governance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-aip p-6 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/60 text-sm">Your Governance Weight</span>
            <Info className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-4xl font-bold text-white">0</p>
        </div>
        <div className="glass-aip p-6 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/60 text-sm">Consensus Power</span>
            <Info className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-4xl font-bold text-white">0%</p>
        </div>
      </div>

      {/* Active Proposals */}
      <div className="glass-aip p-6 rounded-xl border border-white/10 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-white">Governance Council</h2>
          <Info className="w-4 h-4 text-white/40" />
        </div>
        <p className="text-white/50 text-sm mb-6">
          Participate in protocol governance by voting on active proposals. Your voting power is determined by your staked NEURON balance.
        </p>
        <button 
          onClick={handleEligibilityCheck}
          className="py-3 px-6 rounded-xl bg-white/5 text-white/70 font-medium hover:bg-white/10 hover:text-white transition-colors"
        >
          {isConnected ? 'Check Eligibility' : 'Connect to Check'}
        </button>
        <p className="text-white/30 text-sm mt-4">There are no ongoing proposals at the moment.</p>
      </div>

      {/* Resolution Archive */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Resolution Archive</h2>
        <p className="text-white/50 text-sm mb-6">Executed & defeated proposals history</p>

        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="glass-aip p-6 rounded-xl border border-white/10 hover:border-aip-green/30 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-aip-green font-mono text-sm">{proposal.id}</span>
                    <span className="px-2 py-1 rounded-full bg-aip-green/10 text-aip-green text-xs">
                      {proposal.status}
                    </span>
                    <span className="text-white/40 text-sm">{proposal.date}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-4">{proposal.title}</h3>
                  
                  {/* Vote Bars */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-aip-green" />
                      <span className="text-white/60 text-sm">Yes {proposal.yesPercent}%</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-aip-green rounded-full"
                          style={{ width: `${proposal.yesPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-white/60 text-sm">No {proposal.noPercent}%</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${proposal.noPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:text-right">
                  <p className="text-white/40 text-sm">Total Votes</p>
                  <p className="text-2xl font-bold text-white">{proposal.totalVotes}</p>
                  <p className="text-aip-green text-sm">{proposal.outcome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
