'use client';

import { useState, useTransition, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePolygonData } from '@/contexts/PolygonDataContext';
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
  { href: '/staking', label: 'Stake', icon: Layers },
  { href: '/bond', label: 'Bond', icon: Lock },
  { href: '/swap', label: 'Swap', icon: ArrowLeftRight },
  { href: '/alliance', label: 'Alliance', icon: Users },
  { href: '/council', label: 'Council', icon: Users },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
  { href: '/account', label: 'Account', icon: User },
];

// Memoized nav item to prevent re-renders
const NavItem = memo(function NavItem({ 
  item, 
  isActive 
}: { 
  item: typeof navItems[0]; 
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive 
          ? 'text-aip-green bg-aip-green/10' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {item.label}
    </Link>
  );
});

const DAONav = memo(function DAONav() {
  const { address, isConnected, connect, disconnect, isConnecting } = usePolygonData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  return (
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
                prefetch={true}
                onClick={(e) => {
                  if (pathname !== item.href) {
                    startTransition(() => {
                      router.push(item.href);
                    });
                  }
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === item.href 
                    ? 'text-aip-green bg-aip-green/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                } ${isPending && pathname !== item.href ? 'opacity-50' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Connect Button */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="glass-aip px-4 py-2 rounded-xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-aip-green animate-pulse" />
                  <span className="text-white text-sm">{shortenAddress(address || '')}</span>
                </div>
                <button
                  onClick={disconnect}
                  className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Disconnect Wallet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={connect}
                disabled={isConnecting}
                className="btn-aip-primary text-sm py-2 px-4 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
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
                prefetch={true}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (pathname !== item.href) {
                    startTransition(() => {
                      router.push(item.href);
                    });
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === item.href 
                    ? 'text-aip-green bg-aip-green/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                } ${isPending && pathname !== item.href ? 'opacity-50' : ''}`}
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
  );
});

export default DAONav;
