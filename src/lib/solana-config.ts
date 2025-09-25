// Solana NFT Minting Configuration
export const SOLANA_CONFIG = {
  // Network configuration
  NETWORK: (process.env.REACT_APP_SOLANA_NETWORK || 'devnet') as const,
  
  // Candy Machine Configuration
  CANDY_MACHINE_ID: process.env.REACT_APP_CANDY_MACHINE_ID || 'DAkeJ58KaDE64QxgXxe2Kc4hCQuzYSF8oNuuWVhgQfBS',
  
  // RPC Endpoints
  RPC_ENDPOINTS: {
    devnet: process.env.REACT_APP_SOLANA_RPC_HOST || 'https://solana-devnet.g.alchemy.com/v2/aqcGGlkD3YbzV_epKoRtQ',
    mainnet: 'https://api.mainnet-beta.solana.com',
  },
  
  // Supported wallet adapters
  SUPPORTED_WALLETS: [
    'Phantom',
    'Solflare', 
  ],
  
  // UI Configuration
  UI: {
    THEME_COLOR: '#8B5CF6', // Purple theme
    SUCCESS_COLOR: '#10B981',
    ERROR_COLOR: '#EF4444',
  }
};

// Helper function to get RPC endpoint
export const getRPCEndpoint = () => {
  return SOLANA_CONFIG.RPC_ENDPOINTS[SOLANA_CONFIG.NETWORK];
};

// Helper function to validate candy machine ID
export const isValidCandyMachineId = (id: string): boolean => {
  try {
    // Basic validation - should be a valid base58 string of correct length
    return id.length >= 32 && id.length <= 44 && !/[^1-9A-HJ-NP-Za-km-z]/.test(id);
  } catch {
    return false;
  }
};