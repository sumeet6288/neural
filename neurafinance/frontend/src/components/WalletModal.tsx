'use client';

import { useState, useEffect } from 'react';
import { X, Wallet, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  detected: boolean;
  installUrl: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    detected: false,
    installUrl: 'https://metamask.io/download/',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'https://altcoinsbox.com/wp-content/uploads/2022/12/coinbase-logo-300x300.webp',
    detected: false,
    installUrl: 'https://www.coinbase.com/wallet/downloads',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
    detected: false,
    installUrl: 'https://trustwallet.com/download',
  },
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

export default function WalletModal({ isOpen, onClose, onConnect, isConnecting, error }: WalletModalProps) {
  const [wallets, setWallets] = useState<WalletOption[]>(WALLET_OPTIONS);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ethereum = (window as any).ethereum;
    const updated = WALLET_OPTIONS.map(w => {
      if (w.id === 'metamask' && ethereum?.isMetaMask) return { ...w, detected: true };
      if (w.id === 'coinbase' && ethereum?.isCoinbaseWallet) return { ...w, detected: true };
      if (w.id === 'trust' && ethereum?.isTrust) return { ...w, detected: true };
      return w;
    });
    setWallets(updated);
  }, [isOpen]);

  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 4000, id: 'wallet-error' });
      setConnectingWallet(null);
    }
  }, [error]);

  if (!isOpen) return null;

  const hasAnyWallet = typeof window !== 'undefined' && !!(window as any).ethereum;

  const handleWalletClick = async (wallet: WalletOption) => {
    if (!wallet.detected && !hasAnyWallet) {
      window.open(wallet.installUrl, '_blank');
      toast(`Opening ${wallet.name} download page...`, { icon: '🔗', duration: 3000 });
      return;
    }

    setConnectingWallet(wallet.id);
    try {
      await onConnect();
      toast.success('Wallet connected!', { duration: 3000, id: 'wallet-success' });
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Connection failed';
      if (msg.includes('User rejected') || msg.includes('4001')) {
        toast.error('Connection rejected by user', { duration: 3000, id: 'wallet-error' });
      } else {
        toast.error(msg, { duration: 4000, id: 'wallet-error' });
      }
    } finally {
      setConnectingWallet(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" data-testid="wallet-modal">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        data-testid="wallet-modal-backdrop"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#0d0d15] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors relative z-20"
            data-testid="wallet-modal-close"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasAnyWallet && (
            <div className="mb-5 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3" data-testid="no-wallet-warning">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-yellow-200 text-sm font-medium">No wallet detected</p>
                <p className="text-yellow-200/60 text-xs mt-1">
                  Install a Web3 wallet to connect. Click any option below to install.
                </p>
              </div>
            </div>
          )}

          {/* Wallet Options */}
          <div className="space-y-2" data-testid="wallet-options-list">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletClick(wallet)}
                disabled={isConnecting || connectingWallet === wallet.id}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-aip-green/30 transition-all group disabled:opacity-60"
                data-testid={`wallet-option-${wallet.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                  <img src={wallet.icon} alt={wallet.name} className="w-7 h-7" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm">{wallet.name}</p>
                  {wallet.detected ? (
                    <p className="text-aip-green text-xs flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Detected
                    </p>
                  ) : hasAnyWallet ? (
                    <p className="text-white/40 text-xs mt-0.5">Available via injected provider</p>
                  ) : (
                    <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                      <ExternalLink className="w-3 h-3" /> Click to install
                    </p>
                  )}
                </div>
                {connectingWallet === wallet.id ? (
                  <Loader2 className="w-5 h-5 text-aip-green animate-spin" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-aip-green/10 flex items-center justify-center transition-colors">
                    <Wallet className="w-4 h-4 text-white/40 group-hover:text-aip-green transition-colors" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* WalletConnect option */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/30 text-xs text-center">
              Supports MetaMask, Coinbase Wallet, Trust Wallet & other injected providers
            </p>
          </div>

          {/* Network info */}
          <div className="mt-3 p-3 rounded-xl bg-aip-green/5 border border-aip-green/10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#8247E5] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">P</span>
              </div>
              <span className="text-white/60 text-xs">Connecting to Polygon Network</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
