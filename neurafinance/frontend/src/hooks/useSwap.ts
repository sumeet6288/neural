import { useState, useCallback, useEffect } from 'react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import { ethers, Contract } from 'ethers';
import toast from 'react-hot-toast';

// QuickSwap V3 Router on Polygon
const QUICKSWAP_ROUTER = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

// Token addresses on Polygon mainnet
export const POLYGON_TOKENS: Record<string, TokenInfo> = {
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    decimals: 6,
    logo: 'U',
    color: 'bg-blue-500/20',
    textColor: 'text-blue-400',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    decimals: 6,
    logo: 'C',
    color: 'bg-blue-400/20',
    textColor: 'text-blue-300',
  },
  WMATIC: {
    symbol: 'WMATIC',
    name: 'Wrapped MATIC',
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    decimals: 18,
    logo: 'M',
    color: 'bg-purple-500/20',
    textColor: 'text-purple-400',
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped ETH',
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18,
    logo: 'E',
    color: 'bg-indigo-500/20',
    textColor: 'text-indigo-400',
  },
  NEURON: {
    symbol: 'NEURON',
    name: 'NeuraFinance',
    address: process.env.NEXT_PUBLIC_NEURON_TOKEN_ADDRESS || '',
    decimals: 18,
    logo: 'N',
    color: 'bg-aip-green/20',
    textColor: 'text-aip-green',
  },
};

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
  color: string;
  textColor: string;
}

// QuickSwap Router ABI (minimal)
const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function WETH() external pure returns (address)",
];

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  path: string[];
  minimumReceived: string;
}

export function useSwap() {
  const { address, isConnected } = usePolygonData();
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [fromToken, setFromToken] = useState<TokenInfo>(POLYGON_TOKENS.USDT);
  const [toToken, setToToken] = useState<TokenInfo>(POLYGON_TOKENS.NEURON);
  const [fromBalance, setFromBalance] = useState<string>('0');
  const [toBalance, setToBalance] = useState<string>('0');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState(0.5); // 0.5% default
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const neuronDeployed = POLYGON_TOKENS.NEURON.address !== '' && POLYGON_TOKENS.NEURON.address !== '0x0000000000000000000000000000000000000000';

  // Get read-only provider
  const getProvider = useCallback(() => {
    try {
      return new ethers.JsonRpcProvider('https://polygon-rpc.com');
    } catch {
      return null;
    }
  }, []);

  // Get signer for write operations
  const getSigner = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return null;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      return await provider.getSigner();
    } catch {
      return null;
    }
  }, []);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address) {
      setFromBalance('0');
      setToBalance('0');
      return;
    }

    try {
      const provider = getProvider();
      if (!provider) return;

      const fetchBalance = async (token: TokenInfo): Promise<string> => {
        if (!token.address || token.address === '') return '0';
        try {
          const contract = new Contract(token.address, ERC20_ABI, provider);
          const code = await provider.getCode(token.address);
          if (code === '0x') return '0';
          const balance = await contract.balanceOf(address);
          return ethers.formatUnits(balance, token.decimals);
        } catch {
          return '0';
        }
      };

      const [fromBal, toBal] = await Promise.all([
        fetchBalance(fromToken),
        fetchBalance(toToken),
      ]);

      setFromBalance(fromBal);
      setToBalance(toBal);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  }, [isConnected, address, fromToken, toToken, getProvider]);

  // Get swap quote from DEX
  const getQuote = useCallback(async (amountIn: string): Promise<SwapQuote | null> => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null);
      return null;
    }

    if (!fromToken.address || !toToken.address || fromToken.address === '' || toToken.address === '') {
      setError('Token not deployed on Polygon');
      return null;
    }

    setError(null);

    try {
      const provider = getProvider();
      if (!provider) return null;

      const router = new Contract(QUICKSWAP_ROUTER, ROUTER_ABI, provider);
      const amountInWei = ethers.parseUnits(amountIn, fromToken.decimals);

      // Build path (may need WMATIC intermediary)
      let path = [fromToken.address, toToken.address];
      
      let amounts: bigint[];
      try {
        amounts = await router.getAmountsOut(amountInWei, path);
      } catch {
        // Try with WMATIC intermediary
        path = [fromToken.address, POLYGON_TOKENS.WMATIC.address, toToken.address];
        try {
          amounts = await router.getAmountsOut(amountInWei, path);
        } catch (err: any) {
          setError('No liquidity available for this pair');
          return null;
        }
      }

      const amountOut = ethers.formatUnits(amounts[amounts.length - 1], toToken.decimals);
      const slippageMultiplier = (100 - slippage) / 100;
      const minimumReceived = (parseFloat(amountOut) * slippageMultiplier).toFixed(toToken.decimals > 6 ? 6 : toToken.decimals);

      // Calculate approximate price impact
      const inputValue = parseFloat(amountIn);
      const outputValue = parseFloat(amountOut);
      const expectedRate = outputValue / inputValue;
      const priceImpact = Math.abs(expectedRate > 0 ? 0.1 : 0); // Simplified

      const result: SwapQuote = {
        amountIn,
        amountOut,
        priceImpact,
        path,
        minimumReceived,
      };

      setQuote(result);
      return result;
    } catch (err: any) {
      console.error('Quote failed:', err);
      setError(err.message || 'Failed to get quote');
      return null;
    }
  }, [fromToken, toToken, slippage, getProvider]);

  // Execute swap
  const executeSwap = useCallback(async (amountIn: string): Promise<boolean> => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!quote) {
      toast.error('No quote available');
      return false;
    }

    setIsSwapping(true);
    setTxHash(null);
    setError(null);

    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');

      const amountInWei = ethers.parseUnits(amountIn, fromToken.decimals);
      const minOutWei = ethers.parseUnits(quote.minimumReceived, toToken.decimals);

      // Step 1: Check and set approval
      setIsApproving(true);
      const tokenContract = new Contract(fromToken.address, ERC20_ABI, signer);
      const currentAllowance = await tokenContract.allowance(address, QUICKSWAP_ROUTER);

      if (currentAllowance < amountInWei) {
        toast.loading('Approving token spend...', { id: 'swap-approve' });
        const approveTx = await tokenContract.approve(QUICKSWAP_ROUTER, amountInWei);
        await approveTx.wait();
        toast.success('Approval confirmed', { id: 'swap-approve' });
      }
      setIsApproving(false);

      // Step 2: Execute swap
      toast.loading('Executing swap...', { id: 'swap-execute' });
      const router = new Contract(QUICKSWAP_ROUTER, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      const tx = await router.swapExactTokensForTokens(
        amountInWei,
        minOutWei,
        quote.path,
        address,
        deadline
      );

      setTxHash(tx.hash);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success(
          `Swapped ${amountIn} ${fromToken.symbol} for ~${quote.amountOut} ${toToken.symbol}`,
          { id: 'swap-execute', duration: 5000 }
        );
        await fetchBalances();
        return true;
      } else {
        toast.error('Swap transaction failed', { id: 'swap-execute' });
        return false;
      }
    } catch (err: any) {
      console.error('Swap failed:', err);
      
      let errorMsg = 'Swap failed';
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        errorMsg = 'Transaction rejected by user';
      } else if (err.message?.includes('insufficient')) {
        errorMsg = 'Insufficient balance';
      } else if (err.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        errorMsg = 'Slippage exceeded. Try increasing slippage tolerance.';
      } else if (err.reason) {
        errorMsg = err.reason;
      }
      
      setError(errorMsg);
      toast.error(errorMsg, { id: 'swap-execute' });
      return false;
    } finally {
      setIsApproving(false);
      setIsSwapping(false);
    }
  }, [isConnected, address, quote, fromToken, toToken, getSigner, fetchBalances]);

  // Swap token positions
  const swapTokens = useCallback(() => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setQuote(null);
  }, [fromToken, toToken]);

  // Fetch balances on token change or wallet connect
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    isLoading,
    isApproving,
    isSwapping,
    fromToken,
    toToken,
    fromBalance,
    toBalance,
    quote,
    slippage,
    txHash,
    error,
    neuronDeployed,
    setFromToken,
    setToToken,
    setSlippage,
    getQuote,
    executeSwap,
    swapTokens,
    fetchBalances,
  };
}
