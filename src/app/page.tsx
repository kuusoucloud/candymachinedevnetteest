import { SolanaWalletProvider } from '@/components/WalletProvider';
import NFTMintingInterface from '@/components/NFTMintingInterface';

export default function Page() {
  return (
    <SolanaWalletProvider>
      <NFTMintingInterface />
    </SolanaWalletProvider>
  );
}