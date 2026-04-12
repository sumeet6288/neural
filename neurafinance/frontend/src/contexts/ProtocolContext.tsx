'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePolygonData, ProjectionResult } from '@/hooks/usePolygonData';

interface ProtocolContextType {
  // Connection
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToNetwork: (chainId: number) => Promise<void>;
  
  // Token
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalSupply: string;
  maxSupply: string;
  circulatingSupply: string;
  userBalance: string;
  
  // Staking
  totalStaked: string;
  totalUserStaked: string;
  totalPendingRewards: string;
  apys: { [key: number]: string };
  
  // AI Engine
  healthScore: number;
  emissionRate: string;
  healthMultiplier: string;
  lastCycleTime: Date | null;
  
  // Treasury
  treasuryValue: string;
  backingRatio: string;
  
  // Price
  tokenPrice: string;
  
  // Referral
  referralRank: number;
  referralEarnings: string;
  
  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  
  // Calculator
  calculateProjection: (principal: string, stakeType: number) => ProjectionResult;
}

const ProtocolContext = createContext<ProtocolContextType | undefined>(undefined);

export function ProtocolProvider({ children }: { children: ReactNode }) {
  const data = usePolygonData();

  return (
    <ProtocolContext.Provider value={data as ProtocolContextType}>
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const context = useContext(ProtocolContext);
  if (context === undefined) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
}
