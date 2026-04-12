'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePolygonData } from '@/hooks/usePolygonData';
import { shortenAddress } from '@/lib/ethers';
import { 
  TrendingUp, 
  Menu, 
  X, 
  Home,
  Calculator,
  Layers,
  Lock,
  ArrowLeftRight,
  Users,
  User,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
  { href: '/staking', label: 'Stake', icon: Layers },
  { href: '/bond', label: 'Bond', icon: Lock },
  { href: '/swap', label: 'Swap', icon: ArrowLeftRight },
  { href: '/council', label: 'Council', icon: Users },
  { href: '/alliance', label: 'Public Alliance', icon: Users },
  { href: '/account', label: 'My Account', icon: User },
];

export default function DAOLayout({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = usePolygonData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#010101]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0b0b11]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aip-green to-aip-green-dark flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-bold text-gradient-green hidden sm:block">NeuraFinance DAO</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href 
                      ? 'text-aip-green bg-aip-green/10' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Connect Button */}
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-2 glass-aip px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-aip-green animate-pulse" />
                  <span className="text-white text-sm">{shortenAddress(address || '')}</span>
                </div>
              ) : (
                <button className="btn-aip-primary text-sm py-2 px-4">
                  Connect
                </button>
              )}
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0b0b11]/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href 
                      ? 'text-aip-green bg-aip-green/10' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">
              Powered by: © 2026 NeuraFinance. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {['Twitter', 'Telegram', 'Discord', 'GitHub'].map((social) => (
                <a 
                  key={social}
                  href="#" 
                  className="text-white/30 hover:text-aip-green transition-colors text-sm"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
