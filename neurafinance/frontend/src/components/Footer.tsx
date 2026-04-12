'use client';

import Link from 'next/link';
import { Brain, ArrowRight, Mail } from 'lucide-react';

const socialLinks = [
  { name: 'Telegram', href: '#' },
  { name: 'Twitter', href: '#' },
  { name: 'Discord', href: '#' },
  { name: 'GitHub', href: '#' },
  { name: 'Medium', href: '#' },
];

const footerLinks = [
  { name: 'Documentation', href: '/docs' },
  { name: 'Smart Contracts', href: '#' },
  { name: 'Privacy Policy', href: '#' },
  { name: 'Terms of Service', href: '#' },
];

export default function Footer() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        {/* CTA Section */}
        <div className="text-center mb-16">
          <h2 className="text-heading-3 font-bold text-white mb-4">
            Your journey into Cognitive DeFi starts here
          </h2>
          <Link 
            href="/dashboard" 
            className="btn-aip-primary inline-flex items-center gap-2"
          >
            <span>Join NeuraFinance</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-12 border-t border-white/5">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aip-green to-aip-green-dark flex items-center justify-center">
                <Brain className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-bold text-gradient-green">NeuraFinance</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed">
              The world's first AI-powered DeFi protocol that thinks, adapts, and grows.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-white/40 hover:text-aip-green transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-white/40 hover:text-aip-green transition-colors text-sm inline-flex items-center gap-2"
                  >
                    {link.name}
                    <span className="text-aip-green">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-white/30 text-sm">
            © 2026 NeuraFinance — All Rights Reserved
          </p>
          <Link 
            href="mailto:contact@neurafinance.io"
            className="text-white/30 hover:text-aip-green transition-colors text-sm flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>contact@neurafinance.io</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
