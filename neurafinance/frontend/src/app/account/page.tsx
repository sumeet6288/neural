'use client';

import { Wallet, Copy, Coins, TrendingUp, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePolygonData } from '@/hooks/usePolygonData';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { address, isConnected } = usePolygonData();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
        <p className="text-white/50">Manage your account and rewards</p>
      </div>

      {/* Wallet Connection */}
      <div className="glass-aip p-6 rounded-xl border border-white/10 mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">Your Connected Wallet</h2>
        <p className="text-white/50 text-sm mb-6">Secure, read-only address preview.</p>
        
        <div className="mb-4">
          <label className="text-white/40 text-xs uppercase mb-2 block">Wallet Address</label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={isConnected ? address || '' : 'Not connected'}
              readOnly
              className="input-aip flex-1"
            />
            <button 
              onClick={() => isConnected && address && copyToClipboard(address)}
              disabled={!isConnected}
              className="p-3 rounded-xl bg-white/5 text-white/30 hover:text-aip-green hover:bg-aip-green/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <p className="text-white/30 text-sm">
          This address is read-only. You can safely share it to receive funds.
        </p>
      </div>

      {/* Reward Information */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Reward Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Static Balance */}
          <div className="glass-aip p-6 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                <Coins className="w-6 h-6 text-aip-green" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase">Static Balance</p>
                <p className="text-white text-2xl font-bold">0.000 NEURON</p>
              </div>
            </div>
          </div>

          {/* Dynamic Balance */}
          <div className="glass-aip p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-aip-green" />
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase">Dynamic Balance</p>
                  <p className="text-white text-2xl font-bold">0.000 NEURON</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!isConnected) {
                    toast.error('Please connect your wallet first');
                    return;
                  }
                  toast.success('Rewards released successfully');
                }}
                className="btn-aip-primary py-2 px-4 text-sm"
              >
                Release
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Information */}
      <div className="glass-aip p-6 rounded-xl border border-white/10 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Balance Information</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-aip-green" />
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase">Released Balance</p>
              <p className="text-white text-2xl font-bold">0.000 NEURON</p>
            </div>
          </div>
          <Link 
            href="/swap" 
            className="flex items-center gap-2 text-aip-green hover:text-aip-green-light transition-colors"
          >
            <span className="text-sm font-medium">Turbo Swap</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Revenue Source Details */}
      <div className="glass-aip p-6 rounded-xl border border-white/10 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Revenue Source Details</h2>
          <span className="text-white/40 text-sm">Records: 0</span>
        </div>
        <div className="text-center py-8">
          <p className="text-white/50 mb-2">No Data Found</p>
          <p className="text-white/30 text-sm">
            Once you start earning, your revenue sources will appear here.
          </p>
        </div>
      </div>

      {/* Rebasing History */}
      <div className="glass-aip p-6 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Rebasing History</h2>
          <span className="text-white/40 text-sm">Records: 0</span>
        </div>
        <div className="text-center py-8">
          <p className="text-white/50 mb-2">No Rebasing History Available</p>
          <p className="text-white/30 text-sm">
            Once your assets start vesting, each rebase cycle will be listed here with full details.
          </p>
        </div>
      </div>
    </div>
  );
}
