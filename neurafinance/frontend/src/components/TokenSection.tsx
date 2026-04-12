'use client';

import { Coins, Shield, Vote, TrendingUp, Lock } from 'lucide-react';

const tokenFeatures = [
  {
    icon: Shield,
    title: 'Deflationary Mechanics',
    description: 'Automatic buybacks and burns funded by protocol fees reduce circulating supply over time.',
  },
  {
    icon: Vote,
    title: 'Governance Rights',
    description: 'NEURON holders can create and vote on proposals, shaping the future of the protocol.',
  },
  {
    icon: TrendingUp,
    title: 'Staking Rewards',
    description: 'Earn up to 80% APY by staking NEURON tokens in flexible or locked positions.',
  },
  {
    icon: Lock,
    title: 'Collateral Asset',
    description: 'Use NEURON as collateral to borrow nUSD stablecoin with competitive rates.',
  },
];

export default function TokenSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="badge-aip mb-4">
              <Coins className="w-4 h-4" />
              <span>Governance Token</span>
            </div>
            
            <h2 className="text-heading-2 font-bold text-white mb-6">
              Powered By <span className="text-gradient-green">NEURON</span>
            </h2>
            
            <p className="text-white/50 text-lg mb-8 leading-relaxed">
              The NEURON token is the backbone of the NeuraFinance ecosystem. 
              It powers governance, enables staking rewards, and serves as collateral 
              for the nUSD stablecoin.
            </p>

            {/* Token Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass-aip p-4 rounded-xl">
                <p className="text-white/40 text-sm mb-1">Total Supply</p>
                <p className="text-2xl font-bold text-white">100M</p>
              </div>
              <div className="glass-aip p-4 rounded-xl">
                <p className="text-white/40 text-sm mb-1">Circulating</p>
                <p className="text-2xl font-bold text-white">45M</p>
              </div>
              <div className="glass-aip p-4 rounded-xl">
                <p className="text-white/40 text-sm mb-1">Staked</p>
                <p className="text-2xl font-bold text-aip-green">32M</p>
              </div>
              <div className="glass-aip p-4 rounded-xl">
                <p className="text-white/40 text-sm mb-1">Price</p>
                <p className="text-2xl font-bold text-white">$2.45</p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            {tokenFeatures.map((feature, index) => (
              <div key={index} className="feature-card flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-aip-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
