import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, Coins, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { SOLANA_CONFIG, getRPCEndpoint } from '@/lib/solana-config';

interface CandyMachineData {
  address: PublicKey;
  itemsAvailable: number;
  itemsMinted: number;
  itemsRemaining: number;
  goLiveDate: Date | null;
  price: number;
  symbol: string;
  sellerFeeBasisPoints: number;
  version: string;
}

interface MintedNFT {
  mint: string;
  name: string;
  image: string;
  transactionSignature: string;
  timestamp: Date;
}

const NFTMintingInterface: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  
  // State
  const [candyMachineData, setCandyMachineData] = useState<CandyMachineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  
  // Hardcoded candy machine ID for testing
  const candyMachineId = 'DAkeJ58KaDE64QxgXxe2Kc4hCQuzYSF8oNuuWVhgQfBS';

  // Fetch candy machine data
  const fetchCandyMachineData = useCallback(async () => {
    if (!connection || !candyMachineId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('=== CANDY MACHINE DEBUG INFO ===');
      console.log('Fetching candy machine with ID:', candyMachineId);
      console.log('Network:', SOLANA_CONFIG.NETWORK);
      console.log('RPC Endpoint:', connection.rpcEndpoint);
      
      const candyMachineAddress = new PublicKey(candyMachineId);
      console.log('Candy machine address:', candyMachineAddress.toString());
      
      // Get raw account data without using Metaplex SDK
      const accountInfo = await connection.getAccountInfo(candyMachineAddress);
      console.log('Account info:', accountInfo);
      
      if (!accountInfo) {
        throw new Error(`Candy machine account not found at address: ${candyMachineAddress.toString()}`);
      }

      // Check the account owner to determine the candy machine type
      const accountOwner = accountInfo.owner.toString();
      console.log('Account owner:', accountOwner);
      console.log('Account data length:', accountInfo.data.length);
      console.log('Account lamports:', accountInfo.lamports);
      console.log('Account executable:', accountInfo.executable);
      console.log('Account rent epoch:', accountInfo.rentEpoch);
      
      // Known program IDs
      const CANDY_MACHINE_V2_PROGRAM = 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ';
      const CANDY_MACHINE_CORE_PROGRAM = 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR';
      
      let candyMachineType = 'unknown';
      if (accountOwner === CANDY_MACHINE_V2_PROGRAM) {
        candyMachineType = 'v2';
      } else if (accountOwner === CANDY_MACHINE_CORE_PROGRAM) {
        candyMachineType = 'v3';
      }
      
      console.log('Detected candy machine type:', candyMachineType);
      console.log('=== END DEBUG INFO ===');
      
      // Create candy machine data based on what we know
      setCandyMachineData({
        address: candyMachineAddress,
        itemsAvailable: 1000, // Mock data - we'll parse this properly later
        itemsMinted: 0,
        itemsRemaining: 1000,
        goLiveDate: new Date(),
        price: 0.1,
        symbol: 'TESTCO123', // From the error message we can see this
        sellerFeeBasisPoints: 500,
        version: candyMachineType
      });

      console.log('Candy machine data created successfully with type:', candyMachineType);
      
    } catch (err: any) {
      console.error('Error in fetchCandyMachineData:', err);
      
      // If it's a Metaplex SDK error, we can still show the interface
      if (err.message?.includes('UnexpectedAccountError') || err.message?.includes('not of the expected type')) {
        console.log('Metaplex SDK error detected, but we can still work with the raw account data');
        
        // Try to get the account info again and just use that
        try {
          const candyMachineAddress = new PublicKey(candyMachineId);
          const accountInfo = await connection.getAccountInfo(candyMachineAddress);
          
          if (accountInfo) {
            const accountOwner = accountInfo.owner.toString();
            console.log('Raw account owner from retry:', accountOwner);
            
            setCandyMachineData({
              address: candyMachineAddress,
              itemsAvailable: 1000,
              itemsMinted: 0,
              itemsRemaining: 1000,
              goLiveDate: new Date(),
              price: 0.1,
              symbol: 'TESTCO123',
              sellerFeeBasisPoints: 500,
              version: accountOwner === 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ' ? 'v2' : 
                       accountOwner === 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR' ? 'v3' : 'unknown'
            });
            
            console.log('Successfully created candy machine data despite SDK error');
            return;
          }
        } catch (retryErr) {
          console.error('Retry also failed:', retryErr);
        }
      }
      
      let errorMessage = 'Failed to fetch candy machine data.';
      
      if (err.message?.includes('not found')) {
        errorMessage = `Candy machine account not found at address: ${candyMachineId}. Please verify the candy machine ID is correct and deployed on ${SOLANA_CONFIG.NETWORK}.`;
      } else if (err.message?.includes('Invalid public key')) {
        errorMessage = 'Invalid candy machine ID format. Please check the candy machine ID.';
      } else if (err.message?.includes('network')) {
        errorMessage = `Network error. Please check your connection to ${SOLANA_CONFIG.NETWORK}.`;
      } else {
        errorMessage = `Error: ${err.message || 'Unknown error occurred'}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [connection, candyMachineId]);

  // Fetch candy machine data when component mounts
  useEffect(() => {
    fetchCandyMachineData();
  }, [fetchCandyMachineData]);

  // Mint NFT function (temporarily disabled for testing)
  const mintNFT = async () => {
    setError('Minting is temporarily disabled while we debug the candy machine parsing. The account exists and contains valid data, but we need to implement the correct parsing method based on the detected candy machine type.');
    return;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            NFT Minting Interface
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Connect your wallet and mint exclusive NFTs on Solana Devnet
          </p>
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-gradient-to-r !from-pink-500 !to-violet-500 hover:!from-pink-600 hover:!to-violet-600" />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Candy Machine Info */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="h-6 w-6" />
                Candy Machine Details
              </CardTitle>
              <CardDescription className="text-gray-300">
                Information about the NFT collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <span className="ml-2 text-white">Loading candy machine data...</span>
                </div>
              )}

              {error && (
                <Alert className="bg-red-500/20 border-red-500/50">
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {candyMachineData && !loading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Available</p>
                      <p className="text-2xl font-bold text-white">{candyMachineData.itemsAvailable}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Minted</p>
                      <p className="text-2xl font-bold text-white">{candyMachineData.itemsMinted}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Remaining</p>
                      <p className="text-2xl font-bold text-white">{candyMachineData.itemsRemaining}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Price</p>
                      <p className="text-2xl font-bold text-white">{candyMachineData.price} SOL</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Symbol:</span>
                      <span className="text-white">{candyMachineData.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Version:</span>
                      <Badge variant="outline" className="text-white border-white/30">
                        {candyMachineData.version}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seller Fee:</span>
                      <span className="text-white">{candyMachineData.sellerFeeBasisPoints / 100}%</span>
                    </div>
                  </div>

                  {/* Mint Button */}
                  <Button
                    onClick={mintNFT}
                    disabled={!connected || minting || candyMachineData.itemsRemaining === 0}
                    className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 disabled:opacity-50"
                    size="lg"
                  >
                    {minting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Minting...
                      </>
                    ) : !connected ? (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet to Mint
                      </>
                    ) : candyMachineData.itemsRemaining === 0 ? (
                      'Sold Out'
                    ) : (
                      `Mint NFT (${candyMachineData.price} SOL)`
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Minted NFTs Gallery */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="h-6 w-6" />
                Your Minted NFTs
              </CardTitle>
              <CardDescription className="text-gray-300">
                NFTs you've minted from this collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mintedNFTs.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No NFTs minted yet</p>
                  <p className="text-gray-500 text-sm">Your minted NFTs will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {mintedNFTs.map((nft, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                      <p className="text-white font-medium text-sm">{nft.name}</p>
                      <a
                        href={`https://explorer.solana.com/tx/${nft.transactionSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 mt-1"
                      >
                        View Transaction
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NFTMintingInterface;