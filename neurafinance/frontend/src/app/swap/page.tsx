'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, Copy, ChevronDown, Settings, ExternalLink, AlertTriangle, Loader2, Check } from 'lucide-react';
import { usePolygonData } from '@/contexts/PolygonDataContext';
import { useSwap, POLYGON_TOKENS, TokenInfo } from '@/hooks/useSwap';
import toast from 'react-hot-toast';

// Token selector dropdown
function TokenSelector({ 
  selected, 
  onSelect, 
  exclude,
  isOpen,
  setIsOpen
}: { 
  selected: TokenInfo; 
  onSelect: (token: TokenInfo) => void;
  exclude: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const tokens = Object.values(POLYGON_TOKENS).filter(t => t.symbol !== exclude);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        data-testid={`token-selector-${selected.symbol}`}
      >
        <div className={`w-6 h-6 rounded-full ${selected.color} flex items-center justify-center`}>
          <span className={`${selected.textColor} text-xs font-bold`}>{selected.logo}</span>
        </div>
        <span className="text-white font-medium">{selected.symbol}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 glass-aip rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden" data-testid="token-dropdown">
          {tokens.map((token) => {
            const disabled = !token.address || token.address === '';
            return (
              <button
                key={token.symbol}
                onClick={() => {
                  if (!disabled) {
                    onSelect(token);
                    setIsOpen(false);
                  }
                }}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
                  disabled ? 'opacity-40 cursor-not-allowed' : ''
                } ${selected.symbol === token.symbol ? 'bg-aip-green/10' : ''}`}
                data-testid={`token-option-${token.symbol}`}
              >
                <div className={`w-8 h-8 rounded-full ${token.color} flex items-center justify-center`}>
                  <span className={`${token.textColor} text-xs font-bold`}>{token.logo}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{token.symbol}</p>
                  <p className="text-white/40 text-xs">{token.name}</p>
                </div>
                {disabled && <span className="text-yellow-400 text-[10px]">Not deployed</span>}
                {selected.symbol === token.symbol && <Check className="w-4 h-4 text-aip-green" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SwapPage() {
  const [fromAmount, setFromAmount] = useState('');
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);
  const [showSlippage, setShowSlippage] = useState(false);
  const { isConnected, setShowWalletModal } = usePolygonData();
  
  const {
    isSwapping, isApproving, 
    fromToken, toToken, fromBalance, toBalance,
    quote, slippage, txHash, error, neuronDeployed,
    setFromToken, setToToken, setSlippage,
    getQuote, executeSwap, swapTokens, fetchBalances,
  } = useSwap();

  // Debounced quote fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        getQuote(fromAmount);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, getQuote]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => {
      setShowFromTokens(false);
      setShowToTokens(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSwap = async () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (parseFloat(fromAmount) > parseFloat(fromBalance)) {
      toast.error('Insufficient balance');
      return;
    }
    await executeSwap(fromAmount);
  };

  const handleMaxAmount = () => {
    setFromAmount(fromBalance);
  };

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (isApproving) return 'Approving...';
    if (isSwapping) return 'Swapping...';
    if (!fromAmount || parseFloat(fromAmount) <= 0) return 'Enter Amount';
    if (parseFloat(fromAmount) > parseFloat(fromBalance)) return 'Insufficient Balance';
    if (error) return error;
    return 'Swap';
  };

  const buttonDisabled = isSwapping || isApproving || 
    (!isConnected ? false : (!fromAmount || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > parseFloat(fromBalance)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-testid="swap-page">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Swap</h1>
        <p className="text-white/50">Exchange tokens on Polygon via QuickSwap</p>
      </div>

      {/* NEURON not deployed warning */}
      {!neuronDeployed && (fromToken.symbol === 'NEURON' || toToken.symbol === 'NEURON') && (
        <div className="max-w-md mx-auto mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-2" data-testid="neuron-not-deployed-warning">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-yellow-200/80 text-xs">
            NEURON token is not deployed yet. Swap between other tokens on Polygon, or wait for deployment.
          </p>
        </div>
      )}

      {/* Swap Container */}
      <div className="max-w-md mx-auto">
        <div className="glass-aip p-6 rounded-2xl border border-white/10">
          {/* Settings */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-medium text-sm">Swap</span>
            <button 
              onClick={() => setShowSlippage(!showSlippage)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              data-testid="slippage-settings-btn"
            >
              <Settings className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {/* Slippage Settings */}
          {showSlippage && (
            <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10" data-testid="slippage-panel">
              <p className="text-white/60 text-xs mb-2">Slippage Tolerance</p>
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0, 3.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      slippage === val 
                        ? 'bg-aip-green/20 text-aip-green border border-aip-green/30' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* From Section */}
          <div className="mb-4" data-testid="swap-from-section">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-sm">From</span>
              <button 
                onClick={handleMaxAmount}
                className="text-white/40 text-sm hover:text-aip-green transition-colors"
              >
                Balance: {parseFloat(fromBalance).toLocaleString('en-US', { maximumFractionDigits: 4 })} {fromToken.symbol}
              </button>
            </div>
            <div className="glass-aip p-4 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3" onClick={(e) => e.stopPropagation()}>
                <TokenSelector 
                  selected={fromToken} 
                  onSelect={setFromToken}
                  exclude={toToken.symbol}
                  isOpen={showFromTokens}
                  setIsOpen={setShowFromTokens}
                />
                {parseFloat(fromBalance) > 0 && (
                  <button 
                    onClick={handleMaxAmount}
                    className="text-aip-green text-xs font-medium hover:text-aip-green-light"
                    data-testid="max-amount-btn"
                  >
                    MAX
                  </button>
                )}
              </div>
              <input 
                type="text"
                value={fromAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setFromAmount(val);
                }}
                placeholder="0.00"
                className="input-aip w-full text-2xl font-bold !bg-transparent !border-none !p-0 !shadow-none"
                data-testid="from-amount-input"
              />
            </div>
          </div>

          {/* Swap Toggle */}
          <div className="flex justify-center -my-2 relative z-10">
            <button 
              onClick={() => {
                swapTokens();
                setFromAmount('');
              }}
              className="w-10 h-10 rounded-xl bg-aip-green/10 border border-aip-green/30 flex items-center justify-center hover:bg-aip-green/20 transition-colors"
              data-testid="swap-direction-btn"
            >
              <ArrowUpDown className="w-5 h-5 text-aip-green" />
            </button>
          </div>

          {/* To Section */}
          <div className="mt-4" data-testid="swap-to-section">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-sm">To</span>
              <span className="text-white/40 text-sm">
                Balance: {parseFloat(toBalance).toLocaleString('en-US', { maximumFractionDigits: 4 })} {toToken.symbol}
              </span>
            </div>
            <div className="glass-aip p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-3" onClick={(e) => e.stopPropagation()}>
                <TokenSelector 
                  selected={toToken} 
                  onSelect={setToToken}
                  exclude={fromToken.symbol}
                  isOpen={showToTokens}
                  setIsOpen={setShowToTokens}
                />
              </div>
              <div className="flex items-center gap-2">
                {quote ? (
                  <p className="text-2xl font-bold text-white" data-testid="to-amount-display">
                    {parseFloat(quote.amountOut).toLocaleString('en-US', { maximumFractionDigits: 6 })}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-white/30">0.00</p>
                )}
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="mt-4 p-3 rounded-xl bg-white/5 space-y-2 text-xs" data-testid="swap-quote-details">
              <div className="flex justify-between">
                <span className="text-white/40">Rate</span>
                <span className="text-white/60">
                  1 {fromToken.symbol} = {(parseFloat(quote.amountOut) / parseFloat(quote.amountIn)).toFixed(6)} {toToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Min. Received</span>
                <span className="text-white/60">{quote.minimumReceived} {toToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Slippage</span>
                <span className="text-white/60">{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Route</span>
                <span className="text-white/60">{quote.path.length === 2 ? 'Direct' : 'Via WMATIC'}</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && !isSwapping && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20" data-testid="swap-error">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          {/* Swap Button */}
          <button 
            onClick={handleSwap}
            disabled={buttonDisabled}
            className="w-full mt-6 btn-aip-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="swap-execute-btn"
          >
            {(isSwapping || isApproving) && <Loader2 className="w-5 h-5 animate-spin" />}
            {getButtonText()}
          </button>

          {/* Tx Hash */}
          {txHash && (
            <div className="mt-3 flex items-center justify-center gap-2" data-testid="tx-hash-display">
              <a 
                href={`https://polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-aip-green text-xs hover:text-aip-green-light flex items-center gap-1"
              >
                View on PolygonScan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Network Info */}
        <div className="mt-4 text-center">
          <p className="text-white/30 text-xs">
            Powered by QuickSwap on Polygon Network
          </p>
        </div>
      </div>
    </div>
  );
}
