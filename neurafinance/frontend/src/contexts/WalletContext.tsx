'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { connectWallet, getAccount, listenForAccountChanges, listenForChainChanges, removeListeners } from '@/utils/web3';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  chainId: number | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkConnection = useCallback(async () => {
    if (isInitialized) return;
    const account = await getAccount();
    if (account) {
      setAddress(account);
    }
    setIsInitialized(true);
  }, [isInitialized]);

  useEffect(() => {
    // Delay wallet check to prevent blocking initial render
    const timer = setTimeout(() => {
      checkConnection();
    }, 100);

    return () => clearTimeout(timer);
  }, [checkConnection]);

  useEffect(() => {
    if (!isInitialized) return;

    listenForAccountChanges((accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
      } else {
        setAddress(accounts[0]);
      }
    });

    listenForChainChanges((chainId) => {
      setChainId(parseInt(chainId, 16));
    });

    return () => {
      removeListeners();
    };
  }, [isInitialized]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const account = await connectWallet();
      if (account) {
        setAddress(account);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const value = useMemo(() => ({
    address,
    isConnected: !!address,
    isConnecting,
    connect,
    disconnect,
    chainId,
  }), [address, isConnecting, connect, disconnect, chainId]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
