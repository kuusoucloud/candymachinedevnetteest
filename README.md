# Solana NFT Minting Interface

A clean, user-friendly NFT minting interface that connects to a Solana devnet candy machine using Metaplex and Sugar CLI 2.8.1.

## Features

- 🔗 **Multi-Wallet Support**: Connect with Phantom, Solflare, Torus, and Ledger wallets
- 🍬 **Candy Machine Integration**: Fetch and display candy machine data using Metaplex JS SDK
- 🎨 **NFT Minting**: Mint NFTs directly from the interface with loading states
- 🖼️ **NFT Gallery**: View recently minted NFTs with transaction details
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Real-time Updates**: Live candy machine stats and minting progress

## Setup Instructions

### 1. Deploy Your Candy Machine

First, you need to deploy a candy machine using Sugar CLI 2.8.1:

```bash
# Install Sugar CLI
npm install -g @metaplex-foundation/sugar-cli@2.8.1

# Create your candy machine configuration
sugar create-config

# Upload your assets
sugar upload

# Deploy the candy machine
sugar deploy
```

### 2. Configure the Application

1. After deploying your candy machine, copy the candy machine ID
2. Update the candy machine ID in `src/lib/solana-config.ts`:

```typescript
export const SOLANA_CONFIG = {
  CANDY_MACHINE_ID: 'YOUR_ACTUAL_CANDY_MACHINE_ID_HERE',
  // ... other config
};
```

3. Or pass it directly to the component:

```tsx
<NFTMintingInterface candyMachineId="YOUR_CANDY_MACHINE_ID" />
```

### 3. Environment Setup

Make sure you have the following environment variables (optional):

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

### 4. Install Dependencies

The following packages are already installed:

- `@solana/web3.js` - Solana JavaScript SDK
- `@solana/wallet-adapter-*` - Wallet connection utilities
- `@metaplex-foundation/js` - Metaplex SDK for candy machines
- `@metaplex-foundation/mpl-candy-machine` - Candy machine program

## Usage

### Basic Implementation

```tsx
import { SolanaWalletProvider } from '@/components/WalletProvider';
import NFTMintingInterface from '@/components/NFTMintingInterface';

export default function App() {
  return (
    <SolanaWalletProvider>
      <NFTMintingInterface candyMachineId="YOUR_CANDY_MACHINE_ID" />
    </SolanaWalletProvider>
  );
}
```

### Component Props

```typescript
interface NFTMintingInterfaceProps {
  candyMachineId?: string; // Your candy machine public key
}
```

## Features Breakdown

### Wallet Connection
- Supports multiple wallet providers
- Auto-connect functionality
- Wallet state management
- Connection error handling

### Candy Machine Integration
- Fetches candy machine metadata
- Displays collection information
- Shows minting progress (total, minted, remaining)
- Real-time price and availability

### NFT Minting
- One-click minting process
- Transaction confirmation
- Loading states and error handling
- Success notifications

### NFT Gallery
- Displays recently minted NFTs
- Shows NFT metadata and images
- Links to Solana Explorer for transaction details
- Responsive grid layout

## Development

### Project Structure

```
src/
├── components/
│   ├── WalletProvider.tsx      # Solana wallet connection provider
│   ├── NFTMintingInterface.tsx # Main minting interface
│   └── ui/                     # Reusable UI components
├── lib/
│   └── solana-config.ts        # Solana configuration
└── app/
    └── page.tsx                # Main application page
```

### Key Components

1. **WalletProvider**: Wraps the app with Solana wallet adapters
2. **NFTMintingInterface**: Main component handling minting logic
3. **UI Components**: Built with shadcn/ui for consistent styling

## Troubleshooting

### Common Issues

1. **Candy Machine Not Found**
   - Verify your candy machine ID is correct
   - Ensure you're connected to the right network (devnet/mainnet)

2. **Wallet Connection Issues**
   - Make sure wallet extension is installed
   - Check if wallet is set to the correct network

3. **Minting Failures**
   - Ensure sufficient SOL balance for minting + fees
   - Check if candy machine is live and has remaining items

4. **Image Loading Issues**
   - Verify your NFT metadata includes valid image URLs
   - Check CORS settings for image hosting

### Network Configuration

The app is configured for Solana devnet by default. To switch to mainnet:

1. Update `SOLANA_CONFIG.NETWORK` in `src/lib/solana-config.ts`
2. Deploy your candy machine to mainnet
3. Update the candy machine ID

## Security Notes

- This interface is designed for devnet testing
- Always verify transactions before signing
- Keep your wallet seed phrase secure
- Test thoroughly before mainnet deployment

## Support

For issues related to:
- **Sugar CLI**: Check [Metaplex documentation](https://docs.metaplex.com/developer-tools/sugar/)
- **Wallet Adapters**: See [Solana wallet adapter docs](https://github.com/solana-labs/wallet-adapter)
- **Metaplex SDK**: Visit [Metaplex JS SDK docs](https://github.com/metaplex-foundation/js)

## License

This project is open source and available under the MIT License.