'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Wallet, Activity } from 'lucide-react';
import { formatNumber } from '@/utils/contracts';

interface SystemStats {
  totalSupply: string;
  totalStaked: string;
  tvl: string;
  price: string;
  healthScore: string;
}

export default function Stats() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    // Fetch stats from backend
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/metrics`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      icon: Wallet,
      label: 'Total Supply',
      value: stats ? formatNumber(Number(stats.totalSupply) / 1e18) : '...',
      suffix: ' NEURON',
      color: 'text-primary-400',
    },
    {
      icon: TrendingUp,
      label: 'Total Staked',
      value: stats ? formatNumber(Number(stats.totalStaked) / 1e18) : '...',
      suffix: ' NEURON',
      color: 'text-accent-400',
    },
    {
      icon: Activity,
      label: 'Treasury TVL',
      value: stats ? `$${formatNumber(Number(stats.tvl) / 1e18)}` : '...',
      suffix: '',
      color: 'text-green-400',
    },
    {
      icon: Users,
      label: 'Health Score',
      value: stats ? stats.healthScore : '...',
      suffix: '/100',
      color: 'text-yellow-400',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Protocol Statistics</h2>
          <p className="text-white/60">Real-time metrics powered by AI engine</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="glass-card p-6 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-white/60 text-sm">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stat.value}
                <span className="text-lg text-white/60 ml-1">{stat.suffix}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
