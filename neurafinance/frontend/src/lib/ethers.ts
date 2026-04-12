// Ethers.js v6 Integration Layer for Polygon
import { ethers, JsonRpcSigner } from 'ethers';
import { getRpcUrl, SUPPORTED_NETWORKS } from '@/config/polygon';

// Provider instances
let jsonRpcProvider: ethers.JsonRpcProvider | null = null;
let browserProvider: ethers.BrowserProvider | null = null;
let signer: JsonRpcSigner | null = null;

// Initialize JSON RPC provider (read-only)
export function getJsonRpcProvider(chainId: number): ethers.JsonRpcProvider {
  if (!jsonRpcProvider) {
    const rpcUrl = getRpcUrl(chainId);
    jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl, chainId);
  }
  return jsonRpcProvider;
}

// Initialize Browser provider (MetaMask)
export async function getBrowserProvider(): Promise<ethers.BrowserProvider | null> {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as Window & { ethereum?: any }).ethereum;
  if (!ethereum) return null;
  
  if (!browserProvider) {
    browserProvider = new ethers.BrowserProvider(ethereum);
  }
  return browserProvider;
}

// Get signer for transactions
export async function getSigner(): Promise<JsonRpcSigner | null> {
  if (signer) return signer;
  
  const provider = await getBrowserProvider();
  if (!provider) return null;
  
  try {
    signer = await provider.getSigner();
    return signer;
  } catch (error) {
    console.error('Failed to get signer:', error);
    return null;
  }
}

// Reset providers (useful for network switching)
export function resetProviders(): void {
  jsonRpcProvider = null;
  browserProvider = null;
  signer = null;
}

// Connect to MetaMask
export async function connectWallet(): Promise<{ address: string; chainId: number } | null> {
  const ethereum = (window as Window & { ethereum?: any }).ethereum;
  if (typeof window === 'undefined' || !ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    const provider = await getBrowserProvider();
    if (!provider) return null;

    // Request account access
    await provider.send('eth_requestAccounts', []);
    
    const newSigner = await provider.getSigner();
    const address = await newSigner.getAddress();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    signer = newSigner;

    return { address, chainId };
  } catch (error: any) {
    console.error('Connection error:', error);
    throw error;
  }
}

// Get connected account
export async function getAccount(): Promise<string | null> {
  const ethereum = (window as Window & { ethereum?: any }).ethereum;
  if (typeof window === 'undefined' || !ethereum) return null;

  try {
    const provider = await getBrowserProvider();
    if (!provider) return null;

    const accounts = await provider.send('eth_accounts', []);
    return accounts[0] || null;
  } catch (error) {
    return null;
  }
}

// Switch network
export async function switchNetwork(chainId: number): Promise<boolean> {
  const ethereum = (window as Window & { ethereum?: any }).ethereum;
  if (typeof window === 'undefined' || !ethereum) return false;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // Chain not added
    if (error.code === 4902) {
      return false;
    }
    throw error;
  }
}

// Add network to MetaMask
export async function addNetwork(chainId: number): Promise<boolean> {
  const ethereum = (window as Window & { ethereum?: any }).ethereum;
  if (typeof window === 'undefined' || !ethereum) return false;

  const { POLYGON_CONFIG, MUMBAI_CONFIG } = await import('@/config/polygon');
  
  const config = chainId === POLYGON_CONFIG.chainId ? POLYGON_CONFIG : 
                 chainId === MUMBAI_CONFIG.chainId ? MUMBAI_CONFIG : null;
  
  if (!config) return false;

  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chainId.toString(16)}`,
        chainName: config.name,
        nativeCurrency: config.nativeCurrency,
        rpcUrls: config.rpcUrls,
        blockExplorerUrls: [config.blockExplorer],
      }],
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Format ether to human readable
export function formatEther(value: bigint | string | number): string {
  try {
    const bigIntValue = typeof value === 'bigint' ? value : BigInt(value);
    return ethers.formatEther(bigIntValue);
  } catch {
    return '0';
  }
}

// Parse ether to wei
export function parseEther(value: string): bigint {
  try {
    return ethers.parseEther(value);
  } catch {
    return 0n;
  }
}

// Format units
export function formatUnits(value: bigint | string, decimals: number): string {
  try {
    const bigIntValue = typeof value === 'bigint' ? value : BigInt(value);
    return ethers.formatUnits(bigIntValue, decimals);
  } catch {
    return '0';
  }
}

// Parse units
export function parseUnits(value: string, decimals: number): bigint {
  try {
    return ethers.parseUnits(value, decimals);
  } catch {
    return 0n;
  }
}

// Shorten address
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Validate address
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

// Calculate gas price with buffer
export async function getGasPriceWithBuffer(
  provider: ethers.Provider,
  bufferPercent = 10
): Promise<bigint> {
  const feeData = await provider.getFeeData();
  const baseGasPrice = feeData.gasPrice || 0n;
  return baseGasPrice + (baseGasPrice * BigInt(bufferPercent)) / 100n;
}

// Multicall helper (simplified - for production use a multicall contract)
export async function multicall(
  provider: ethers.Provider,
  calls: { target: string; data: string }[]
): Promise<string[]> {
  // In production, use a multicall contract
  // This is a placeholder that executes calls sequentially
  const results: string[] = [];
  
  for (const call of calls) {
    try {
      const result = await provider.call({ to: call.target, data: call.data });
      results.push(result);
    } catch (error) {
      results.push('0x');
    }
  }
  
  return results;
}

// Event listeners
export function setupEventListeners(
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void
): () => void {
  const ethereum = (window as Window & { ethereum?: any }).ethereum;
  if (typeof window === 'undefined' || !ethereum) {
    return () => {};
  }

  ethereum.on('accountsChanged', onAccountsChanged);
  ethereum.on('chainChanged', onChainChanged);

  return () => {
    ethereum.removeListener('accountsChanged', onAccountsChanged);
    ethereum.removeListener('chainChanged', onChainChanged);
  };
}
