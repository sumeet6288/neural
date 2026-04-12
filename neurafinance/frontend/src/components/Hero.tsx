'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Brain, TrendingUp } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute inset-0 ambient-glow" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aip-green/10 rounded-full blur-[150px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aip-teal/10 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
      
      <div className="relative max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 badge-aip mb-8 animate-float">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered DeFi Protocol</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-display font-bold mb-6 tracking-tight">
          <span className="text-white">NeuraFinance — </span>
          <br className="hidden sm:block" />
          <span className="text-gradient-green">AI That Thinks,</span>
          <br className="hidden sm:block" />
          <span className="text-gradient-green">Adapts & Grows</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          The world's first fully autonomous DeFi protocol powered by intelligent AI agents. 
          Sustainable yields, automated treasury management, and community-driven governance.
        </p>

        {/* CTA Buttons - Modern Beautiful */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/dashboard" 
            className="btn-aip-cta flex items-center gap-3 group"
          >
            <span>Launch App</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          <Link 
            href="/swap" 
            className="btn-aip-secondary flex items-center gap-2 group"
          >
            <span>Swap Tokens</span>
            <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
          </Link>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link href="/staking" className="btn-aip flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Stake</span>
          </Link>
          <Link href="/bond" className="btn-aip flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Bond</span>
          </Link>
          <Link href="/calculator" className="btn-aip flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4" />
            <span>Calculator</span>
          </Link>
        </div>

        {/* Stats Preview */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="feature-card group">
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-aip-green/10">
                  <TrendingUp className="w-5 h-5 text-aip-green" />
                </div>
                <span className="text-white/40 text-sm">Total Value Locked</span>
              </div>
              <p className="text-4xl font-bold text-white">$12.5M</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-aip-green text-sm">
                <TrendingUp className="w-3 h-3" />
                <span>+23.5%</span>
              </div>
            </div>
          </div>
          
          <div className="feature-card group">
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-aip-teal/10">
                  <Sparkles className="w-5 h-5 text-aip-teal" />
                </div>
                <span className="text-white/40 text-sm">APY Up To</span>
              </div>
              <p className="text-4xl font-bold text-white">80%</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-aip-teal text-sm">
                <Brain className="w-3 h-3" />
                <span>AI Optimized</span>
              </div>
            </div>
          </div>
          
          <div className="feature-card group">
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-aip-green-light/10">
                  <Brain className="w-5 h-5 text-aip-green-light" />
                </div>
                <span className="text-white/40 text-sm">AI Health Score</span>
              </div>
              <p className="text-4xl font-bold text-white">98/100</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-aip-green-light text-sm">
                <div className="w-2 h-2 rounded-full bg-aip-green-light animate-pulse" />
                <span>Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
