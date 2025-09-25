// Solana NFT Minting Configuration
export const SOLANA_CONFIG = {
  // Network configuration
  NETWORK: 'devnet' as const,
  
  // Candy Machine Configuration
  // Replace with your actual candy machine ID from Sugar CLI deployment
  CANDY_MACHINE_ID: 'YOUR_CANDY_MACHINE_ID_HERE',
  
  // RPC Endpoints (you can customize these)
  RPC_ENDPOINTS: {
    devnet: 'https://api.devnet.solana.com',
    mainnet: 'https://api.mainnet-beta.solana.com',
  },
  
  // Supported wallet adapters
  SUPPORTED_WALLETS: [
    'Phantom',
    'Solflare', 
    'Torus',
    'Ledger',
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