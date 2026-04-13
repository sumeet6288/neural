'use client';

import { Suspense, lazy } from 'react';
import { CalculatorSkeleton, StatsSkeleton } from '@/components/Skeleton';
import { 
  Calculator, 
  TrendingUp, 
  Activity, 
  Wallet,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Lazy load heavy calculator component
const AIPFCalculator = lazy(() => import('@/components/AIPFCalculator'));

export default function CalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-aip-green to-aip-green-dark">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">ROI Calculator</h1>
            <p className="text-white/50">
              Calculate your staking rewards with 12-hour compounding
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AIPFCalculator - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={<CalculatorSkeleton />}>
            <AIPFCalculator />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* How It Works */}
          <div className="glass-aip p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-aip-teal to-aip-green">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-white font-medium">How It Works</h4>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-aip-green mt-1">1.</span>
                <span className="text-white/60">
                  Rewards compound every 12 hours (730 cycles/year)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-aip-green mt-1">2.</span>
                <span className="text-white/60">
                  Fixed APY rates as shown in calculator
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-aip-green mt-1">3.</span>
                <span className="text-white/60">
                  Longer lock periods = higher APY
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-aip-green mt-1">4.</span>
                <span className="text-white/60">
                  Flexible stakes can be withdrawn anytime
                </span>
              </li>
            </ul>
          </div>

          {/* Demo Mode Info */}
          <div className="glass-aip p-4 rounded-xl border border-aip-green/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-white font-medium">Demo Mode</h4>
            </div>
            <p className="text-white/60 text-sm">
              This calculator uses static APY rates for demonstration. 
              Actual rates may vary based on protocol performance.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-xs">Calculator Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
