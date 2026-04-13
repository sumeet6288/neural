'use client';

import Link from 'next/link';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import { shortenAddress } from '@/lib/ethers';
import { Wallet, Menu, X, Brain } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#ai', label: 'AI' },
  { href: '#works', label: 'Works' },
  { href: '#faq', label: 'FAQ' },
];

export default function Navbar() {
  const { address, isConnected, isConnecting, connect } = usePolygonData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-aip border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aip-green to-aip-green-dark flex items-center justify-center shadow-lg shadow-aip-green/20 group-hover:shadow-aip-green/40 transition-shadow">
              <Brain className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-gradient-green">NeuraFinance</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Connect Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/swap" className="btn-aip text-sm py-2 px-4">
              Swap
            </Link>
            {isConnected ? (
              <div className="flex items-center gap-2 glass-aip px-4 py-2 rounded-xl border border-aip-green/20">
                <div className="w-2 h-2 rounded-full bg-aip-green animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                <span className="text-white font-medium text-sm">
                  {shortenAddress(address || '')}
                </span>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="btn-aip-primary text-sm py-2.5 px-5 flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link 
                href="/swap" 
                className="btn-aip text-center mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Swap
              </Link>
              {!isConnected && (
                <button
                  onClick={() => {
                    connect();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isConnecting}
                  className="btn-aip-primary flex items-center justify-center gap-2 mt-2 py-3"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
