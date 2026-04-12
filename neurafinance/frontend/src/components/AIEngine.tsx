'use client';

import { useState } from 'react';
import { Brain, Activity, Droplets, RefreshCw, Shield, TrendingUp } from 'lucide-react';

const aiModules = [
  {
    id: 'nee',
    icon: Activity,
    title: 'NEE — Neural Emission Engine',
    description: 'Dynamically adjusts token emissions based on staking participation and market conditions to maintain optimal APY.',
  },
  {
    id: 'als',
    icon: Droplets,
    title: 'ALS — Adaptive Liquidity Stabilizer',
    description: 'Monitors and manages DEX liquidity depth, automatically triggering buybacks or liquidity additions when needed.',
  },
  {
    id: 'arp',
    icon: RefreshCw,
    title: 'ARP — Auto Reinvest Protocol',
    description: 'Automatically compounds staking rewards for users, maximizing returns through optimal reinvestment timing.',
  },
  {
    id: 'sig',
    icon: Shield,
    title: 'SIG — Supply Integrity Guard',
    description: 'Monitors token supply health and detects anomalies, triggering protective measures when threats are detected.',
  },
  {
    id: 'alp',
    icon: TrendingUp,
    title: 'ALP — Adaptive Logic Predictor',
    description: 'Predicts market trends and user behavior to proactively adjust protocol parameters for optimal performance.',
  },
];

export default function AIEngine() {
  const [activeModule, setActiveModule] = useState('nee');

  return (
    <section id="ai" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-aip-green/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="badge-aip mb-4">
            <Brain className="w-4 h-4" />
            <span>AI Engine</span>
          </div>
          <h2 className="text-heading-2 font-bold text-white mb-4">
            The Power Of <span className="text-gradient-green">AI</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Five intelligent modules working in harmony to optimize every aspect of the protocol
          </p>
        </div>

        {/* AI Modules Accordion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Module List */}
          <div className="space-y-3">
            {aiModules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                  activeModule === module.id
                    ? 'bg-aip-green/10 border border-aip-green/30'
                    : 'glass-aip hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <module.icon className={`w-5 h-5 ${activeModule === module.id ? 'text-aip-green' : 'text-white/50'}`} />
                  <span className={`font-medium ${activeModule === module.id ? 'text-white' : 'text-white/70'}`}>
                    {module.title.split(' — ')[0]}
                  </span>
                  {activeModule === module.id && (
                    <span className="ml-auto text-aip-green">→</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Active Module Detail */}
          <div className="feature-card">
            {aiModules.map((module) => (
              module.id === activeModule && (
                <div key={module.id} className="animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-aip-green/10 flex items-center justify-center mb-6">
                    <module.icon className="w-8 h-8 text-aip-green" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {module.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {module.description}
                  </p>
                  
                  {/* Health Indicator */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-sm">Module Health</span>
                      <span className="text-aip-green text-sm">98%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-[98%] bg-gradient-to-r from-aip-green to-aip-green-light rounded-full" />
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
