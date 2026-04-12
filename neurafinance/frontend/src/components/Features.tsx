'use client';

import { Brain, Shield, Coins, Vote, Users, TrendingUp } from 'lucide-react';

const features = [
  {
    number: '01',
    icon: Brain,
    title: 'AI-Driven Economy',
    description: '5 intelligent modules (NEE, ALS, ARP, SIG, ALP) continuously optimize protocol parameters for maximum sustainability and growth.',
  },
  {
    number: '02',
    icon: Shield,
    title: 'Self-Balancing Protocol',
    description: 'Choose between flexible staking or lock bonds (45-360 days) with APYs up to 80%. Auto-compounding and intelligent rebalancing.',
  },
  {
    number: '03',
    icon: Coins,
    title: 'Lending & Borrowing',
    description: 'Collateralized loans with competitive rates. Borrow nUSD stablecoin against your NEURON tokens with AI-optimized LTV ratios.',
  },
  {
    number: '04',
    icon: Vote,
    title: 'Autonomous Governance',
    description: 'Community-driven decision making with AI-assisted proposal analysis. Create proposals, vote on changes, shape the future.',
  },
  {
    number: '05',
    icon: Users,
    title: 'Community-Empowered Growth',
    description: '15-tier rank system with team bonuses. Earn 10% direct referral rewards plus rank-based bonuses up to 25%.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aip-green/5 to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="badge-aip mb-4">
            <span>Features</span>
          </div>
          <h2 className="text-heading-2 font-bold text-white mb-4">
            Key Features Of <span className="text-gradient-green">NeuraFinance</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Built for the future of decentralized finance with intelligent automation
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group"
            >
              {/* Number Badge */}
              <div className="number-badge mb-6">
                {feature.number}
              </div>
              
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-aip-green/10 flex items-center justify-center mb-4 group-hover:bg-aip-green/20 transition-colors">
                <feature.icon className="w-6 h-6 text-aip-green" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-aip-green transition-colors">
                {feature.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
