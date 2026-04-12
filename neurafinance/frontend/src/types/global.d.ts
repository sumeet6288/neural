declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: 'accountsChanged' | 'chainChanged', callback: (param: string | string[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      removeAllListeners: (event: string) => void;
      isMetaMask?: boolean;
      selectedAddress?: string;
      chainId?: string;
    };
  }
}

export {};
