'use client';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import AIEngine from '@/components/AIEngine';
import TokenSection from '@/components/TokenSection';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#010101]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <AIEngine />
      <TokenSection />
      <FAQ />
      <Footer />
    </main>
  );
}
