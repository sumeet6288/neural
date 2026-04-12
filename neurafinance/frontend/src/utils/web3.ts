import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';

let provider: BrowserProvider | null = null;

export function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    if (!provider) {
      provider = new BrowserProvider(window.ethereum);
    }
    return provider;
  }
  return null;
}

export async function getSigner(): Promise<JsonRpcSigner | null> {
  const prov = getProvider();
  if (!prov) return null;
  return await prov.getSigner();
}

export function getContract(address: string, abi: string[], signer?: JsonRpcSigner) {
  const prov = signer || getProvider();
  if (!prov) return null;
  return new Contract(address, abi, prov);
}

export async function connectWallet(): Promise<string | null> {
  const prov = getProvider();
  if (!prov) {
    throw new Error('MetaMask not installed');
  }
  
  try {
    const accounts = await prov.send('eth_requestAccounts', []);
    return accounts[0];
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
}

export async function getAccount(): Promise<string | null> {
  const prov = getProvider();
  if (!prov) return null;
  
  try {
    const accounts = await prov.send('eth_accounts', []);
    return accounts[0] || null;
  } catch (error) {
    return null;
  }
}

export async function switchNetwork(chainId: number): Promise<boolean> {
  const prov = getProvider();
  if (!prov) return false;
  
  try {
    await prov.send('wallet_switchEthereumChain', [{ chainId: `0x${chainId.toString(16)}` }]);
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      // Chain not added
      return false;
    }
    throw error;
  }
}

export function listenForAccountChanges(callback: (accounts: string[]) => void) {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', (param) => {
      callback(param as string[]);
    });
  }
}

export function listenForChainChanges(callback: (chainId: string) => void) {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('chainChanged', (param) => {
      callback(param as string);
    });
  }
}

export function removeListeners() {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
}

// Polygon network config
export const POLYGON_NETWORK = {
  chainId: 137,
  name: 'Polygon Mainnet',
  rpcUrl: 'https://polygon-rpc.com',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  blockExplorerUrl: 'https://polygonscan.com',
};

// Mumbai testnet config
export const MUMBAI_NETWORK = {
  chainId: 80001,
  name: 'Polygon Mumbai',
  rpcUrl: 'https://rpc-mumbai.maticvigil.com',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  blockExplorerUrl: 'https://mumbai.polygonscan.com',
};
