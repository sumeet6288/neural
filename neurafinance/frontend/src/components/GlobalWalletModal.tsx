'use client';

import { usePolygonData } from '@/contexts/PolygonDataContext';
import WalletModal from './WalletModal';

export default function GlobalWalletModal() {
  const { showWalletModal, setShowWalletModal, connect, isConnecting, connectionError } = usePolygonData();

  return (
    <WalletModal
      isOpen={showWalletModal}
      onClose={() => setShowWalletModal(false)}
      onConnect={connect}
      isConnecting={isConnecting}
      error={connectionError}
    />
  );
}
