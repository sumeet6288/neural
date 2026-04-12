'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What is NeuraFinance?',
    answer: 'NeuraFinance is an AI-powered decentralized finance protocol that combines advanced artificial intelligence with blockchain technology. It features 5 intelligent AI modules that continuously optimize protocol parameters for sustainable yields, automated treasury management, and community-driven governance.',
  },
  {
    question: 'How does the AI Engine work?',
    answer: 'Our AI Engine consists of 5 modules: NEE (Neural Emission Engine) adjusts token emissions, ALS (Adaptive Liquidity Stabilizer) manages DEX liquidity, ARP (Auto Reinvest Protocol) compounds rewards, SIG (Supply Integrity Guard) monitors security, and ALP (Adaptive Logic Predictor) forecasts market trends.',
  },
  {
    question: 'Is NeuraFinance decentralized?',
    answer: 'Yes, NeuraFinance is fully decentralized. All smart contracts are deployed on Polygon and verified on-chain. The DAO governance system allows NEURON token holders to create and vote on proposals, ensuring the community controls the protocol\'s future.',
  },
  {
    question: 'What makes NeuraFinance different from other DeFi platforms?',
    answer: 'Unlike traditional DeFi protocols with static parameters, NeuraFinance uses AI to dynamically optimize yields, liquidity, and security in real-time. This creates a self-adapting ecosystem that can respond to market conditions without manual intervention.',
  },
  {
    question: 'How can I participate?',
    answer: 'You can participate by: 1) Staking NEURON tokens for yields up to 80% APY, 2) Providing liquidity to earn fees, 3) Borrowing nUSD against your collateral, 4) Participating in DAO governance, or 5) Joining our referral program to earn bonuses.',
  },
  {
    question: 'Is my investment safe?',
    answer: 'Security is our top priority. All contracts are audited, the AI Engine includes the SIG module for threat detection, and emergency pause mechanisms are in place. However, as with all DeFi protocols, please only invest what you can afford to lose.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="badge-aip mb-4">
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </div>
          <h2 className="text-heading-2 font-bold text-white mb-4">
            Frequently Asked <span className="text-gradient-green">Questions</span>
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="accordion-item">
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="accordion-trigger"
              >
                <span className={`font-medium ${openIndex === index ? 'text-white' : 'text-white/70'}`}>
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-aip-green transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-white/50 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
