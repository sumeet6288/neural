'use client';

import { Suspense, lazy } from 'react';
import ProtocolStats from '@/components/ProtocolStats';
import { CalculatorSkeleton, StatsSkeleton } from '@/components/Skeleton';
import { usePolygonData } from '@/hooks/usePolygonData';
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
  const { 
    isConnected, 
    isConnecting, 
    connect, 
    connectionError,
    chainId,
    switchToNetwork,
    isLoading,
    refresh
  } = usePolygonData();

  const isWrongNetwork = chainId && ![137, 80001].includes(chainId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-aip-green to-aip-green-dark">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Live Calculator</h1>
              <p className="text-white/50">
                AIPF-style 12-hour compounding • Live Polygon data
              </p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="btn-aip-primary flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : isWrongNetwork ? (
              <button
                onClick={() => switchToNetwork(137)}
                className="btn-aip-secondary flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Switch to Polygon
              </button>
            ) : (
              <button
                onClick={refresh}
                disabled={isLoading}
                className="btn-aip flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>
        </div>

        {connectionError && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{connectionError}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AIPF Calculator - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={<CalculatorSkeleton />}>
            <AIPFCalculator />
          </Suspense>
        </div>

        {/* Protocol Stats Sidebar */}
        <div className="space-y-6">
          <Suspense fallback={<StatsSkeleton />}>
            <ProtocolStats />
          </Suspense>
          
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
                  APY fetched live from smart contracts
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-aip-green mt-1">3.</span>
                <span className="text-white/60">
                  Bond stakes = higher APY + lock period
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-aip-green mt-1">4.</span>
                <span className="text-white/60">
                  Flexible stakes = lower APY + no lock
                </span>
              </li>
            </ul>
          </div>

          {/* Live Data Info */}
          <div className="glass-aip p-4 rounded-xl border border-aip-green/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-white font-medium">Live Data</h4>
            </div>
            <p className="text-white/60 text-sm">
              All values are fetched directly from Polygon blockchain. 
              Data refreshes automatically every 15 seconds.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-xs">Connected to Polygon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
