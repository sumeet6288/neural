'use client';

import { Database, Brain, Cog, Globe } from 'lucide-react';

const steps = [
  {
    icon: Database,
    title: 'Data Flows In',
    description: 'Market data, user activity, and protocol metrics are continuously monitored and analyzed in real-time.',
  },
  {
    icon: Brain,
    title: 'AI Analyzes',
    description: 'Our 5-module AI Engine processes data to optimize emissions, liquidity, and protocol health.',
  },
  {
    icon: Cog,
    title: 'Protocol Executes',
    description: 'Smart contracts automatically adjust parameters based on AI recommendations and community votes.',
  },
  {
    icon: Globe,
    title: 'Ecosystem Evolves',
    description: 'The protocol adapts and grows, creating sustainable yields for all participants.',
  },
];

export default function HowItWorks() {
  return (
    <section id="works" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="badge-aip mb-4">
            <span>Process</span>
          </div>
          <h2 className="text-heading-2 font-bold text-white mb-4">
            How It <span className="text-gradient-green">Works</span>
          </h2>
          <p className="text-lg text-white/50">
            Realtime • Tracking • Optimization • Execution
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="step-card group">
              {/* Step Number */}
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-aip-green text-black font-bold text-sm flex items-center justify-center">
                {index + 1}
              </div>
              
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-aip-green/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-aip-green/20 transition-colors">
                <step.icon className="w-8 h-8 text-aip-green" />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connection Line (Desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-aip-green/30 to-transparent mt-8" />
      </div>
    </section>
  );
}
