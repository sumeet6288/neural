// Contract addresses - Update these after deployment
export const CONTRACTS = {
  NEURON_TOKEN: process.env.NEXT_PUBLIC_NEURON_TOKEN_ADDRESS || '',
  STAKING: process.env.NEXT_PUBLIC_STAKING_ADDRESS || '',
  TREASURY: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '',
  LENDING: process.env.NEXT_PUBLIC_LENDING_ADDRESS || '',
  AI_ENGINE: process.env.NEXT_PUBLIC_AI_ENGINE_ADDRESS || '',
  PRICE_ORACLE: process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '',
};

// Validate that all addresses are set
export function validateContractAddresses(): boolean {
  const missing = Object.entries(CONTRACTS)
    .filter(([_, address]) => !address || address === '')
    .map(([name]) => name);
  
  if (missing.length > 0) {
    console.error('Missing contract addresses:', missing);
    return false;
  }
  
  return true;
}
