'use client';

import { useState, useEffect } from 'react';
import { ArrowUpDown, Copy, ChevronDown } from 'lucide-react';
import { usePolygonData } from '@/hooks/usePolygonData';
import toast from 'react-hot-toast';

const EXCHANGE_RATE = 2.17; // 1 USDT = 2.17 NEURON

export default function SwapPage() {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('NEURON');
  const { isConnected } = usePolygonData();

  // Auto-calculate to amount when from amount changes
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const calculated = parseFloat(fromAmount) * EXCHANGE_RATE;
      setToAmount(calculated.toFixed(4));
    } else {
      setToAmount('');
    }
  }, [fromAmount]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Swap</h1>
        <p className="text-white/50">Exchange tokens instantly</p>
      </div>

      {/* Swap Container */}
      <div className="max-w-md mx-auto">
        <div className="glass-aip p-6 rounded-2xl border border-white/10">
          {/* From Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-sm">From</span>
              <span className="text-white/40 text-sm">Balance: 0.000 USDT</span>
            </div>
            <div className="glass-aip p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">U</span>
                  </div>
                  <span className="text-white font-medium">USDT</span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
              </div>
              <input 
                type="text"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="input-aip w-full text-2xl font-bold"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-white/40 text-xs">Network: Polygon</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(fromAmount || '0');
                    toast.success('Amount copied');
                  }}
                  className="text-white/40 hover:text-aip-green transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Swap Toggle */}
          <div className="flex justify-center -my-2 relative z-10">
            <button 
              onClick={() => {
                // Swap tokens
                const tempToken = fromToken;
                setFromToken(toToken);
                setToToken(tempToken);
                // Swap amounts
                const tempAmount = fromAmount;
                setFromAmount(toAmount);
                setToAmount(tempAmount);
              }}
              className="w-10 h-10 rounded-xl bg-aip-green/10 border border-aip-green/30 flex items-center justify-center hover:bg-aip-green/20 transition-colors"
            >
              <ArrowUpDown className="w-5 h-5 text-aip-green" />
            </button>
          </div>

          {/* To Section */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-sm">To</span>
              <span className="text-white/40 text-sm">Balance: 0.000 NEURON</span>
            </div>
            <div className="glass-aip p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-aip-green/20 flex items-center justify-center">
                    <span className="text-aip-green text-xs font-bold">N</span>
                  </div>
                  <span className="text-white font-medium">NEURON</span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
              </div>
              <input 
                type="text"
                value={toAmount}
                readOnly
                placeholder="0.00"
                className="input-aip w-full text-2xl font-bold bg-transparent"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-white/40 text-xs">Network: Polygon</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(toAmount || '0');
                    toast.success('Amount copied');
                  }}
                  className="text-white/40 hover:text-aip-green transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <button 
            onClick={() => {
              if (!isConnected) {
                toast.error('Please connect your wallet first');
                return;
              }
              if (!fromAmount || parseFloat(fromAmount) <= 0) {
                toast.error('Please enter a valid amount');
                return;
              }
              toast.success(`Swapped ${fromAmount} ${fromToken} to ${toAmount} ${toToken}`);
              setFromAmount('');
              setToAmount('');
            }}
            disabled={!fromAmount}
            className="w-full mt-6 btn-aip-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected ? 'Connect Wallet' : fromAmount ? 'Swap' : 'Enter Amount'}
          </button>
        </div>
      </div>
    </div>
  );
}
