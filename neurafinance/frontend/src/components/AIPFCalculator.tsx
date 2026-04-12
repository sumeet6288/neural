'use client';

import { useState, memo } from 'react';
import { 
  Calculator, 
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

// Static stake plans with fixed ROI (matching the screenshot)
const STAKE_PLANS = [
  { id: 0, name: 'Flexible Stake', period: '24H', roi: 0.6, periodDays: 1 },
  { id: 1, name: 'Fixed Stake', period: '45 DAYS', roi: 0.7, periodDays: 45 },
  { id: 2, name: 'Fixed Stake', period: '90 DAYS', roi: 0.8, periodDays: 90 },
  { id: 3, name: 'Fixed Stake', period: '180 DAYS', roi: 0.9, periodDays: 180 },
  { id: 4, name: 'Fixed Stake', period: '360 DAYS', roi: 1.0, periodDays: 360 },
];

// Memoized component to prevent unnecessary re-renders
const AIPFCalculator = memo(function AIPFCalculator() {
  const [amount, setAmount] = useState('1000');
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const plan = STAKE_PLANS[selectedPlan];
  const principal = parseFloat(amount) || 0;
  
  // Calculate 12H breakdown (0.3% per 12H for Flexible, based on 0.6% daily)
  const periodRate = plan.roi / 100 / 2; // Half for 12H period
  const first12hReward = principal * periodRate;
  const afterFirst12h = principal + first12hReward;
  const second12hReward = afterFirst12h * periodRate;
  const total24h = afterFirst12h + second12hReward;

  const formatNumber = (num: number): string => {
    return num.toFixed(3);
  };

  return (
    <div className="glass-aip rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select a Plan</h3>
        
        {/* Plan Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STAKE_PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                selectedPlan === p.id
                  ? 'border-aip-green bg-aip-green/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`text-sm font-medium ${selectedPlan === p.id ? 'text-aip-green' : 'text-white/60'}`}>
                {p.name}
              </div>
              <div className="text-white font-bold mt-1">{p.period}</div>
              <div className={`text-sm mt-1 ${selectedPlan === p.id ? 'text-aip-green' : 'text-white/40'}`}>
                ROI: {p.roi}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-white/70 text-sm mb-2">Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#0b0b11] border border-aip-green/50 rounded-xl px-4 py-4 text-white text-lg font-medium focus:outline-none focus:border-aip-green"
            placeholder="Enter amount"
            min="0"
            step="0.01"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
            NEURON
          </span>
        </div>
        <p className="text-white/40 text-sm mt-2">
          This amount will be used to calculate your rewards based on the selected plan.
        </p>
      </div>

      {/* Plan Info Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-aip p-4 rounded-xl">
          <div className="text-white/40 text-sm mb-1">Plan</div>
          <div className="text-aip-green font-medium">{plan.name}</div>
        </div>
        <div className="glass-aip p-4 rounded-xl">
          <div className="text-white/40 text-sm mb-1">Period</div>
          <div className="text-white font-medium">{plan.period}</div>
        </div>
        <div className="glass-aip p-4 rounded-xl">
          <div className="text-white/40 text-sm mb-1">Plan ROI %</div>
          <div className="text-aip-green font-bold">{plan.roi}%</div>
        </div>
      </div>

      {/* 24H Compounding Breakdown */}
      <div className="glass-aip p-6 rounded-xl border border-white/10">
        <h4 className="text-white font-medium mb-4">24H Compounding Breakdown</h4>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-white/60">First 12H ROI :</span>
            <span className="text-white font-mono">
              {formatNumber(principal)} × {formatNumber(periodRate * 100)}% = {formatNumber(first12hReward)} NEURON
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-aip-green">Compound Amount (after 12H) :</span>
            <span className="text-white font-mono">
              {formatNumber(principal)} + {formatNumber(first12hReward)} = {formatNumber(afterFirst12h)} NEURON
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-aip-green">Next 12H ROI :</span>
            <span className="text-white font-mono">
              {formatNumber(afterFirst12h)} × {formatNumber(periodRate * 100)}% = {formatNumber(second12hReward)} NEURON
            </span>
          </div>
          
          <div className="border-t border-white/10 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-aip-green font-medium">
                If you {plan.name} for 24h you get :
              </span>
              <span className="text-white font-bold font-mono text-lg">
                {formatNumber(total24h)} NEURON
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-4 rounded-xl bg-aip-green/5 border border-aip-green/10">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-aip-green flex-shrink-0 mt-0.5" />
          <div className="text-white/50 text-sm space-y-1">
            <p>• Rewards compound every 12 hours automatically</p>
            <p>• Fixed ROI rates as shown above</p>
            <p>• Fixed stakes lock tokens for the duration</p>
            <p>• Flexible stakes can be withdrawn anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AIPFCalculator;
