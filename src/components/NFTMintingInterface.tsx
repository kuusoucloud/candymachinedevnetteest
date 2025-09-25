import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, Coins, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { SOLANA_CONFIG } from '@/lib/solana-config';

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

  // Fetch candy machine data using only raw Solana RPC calls
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
      
      // Get raw account data - NO METAPLEX SDK
      const accountInfo = await connection.getAccountInfo(candyMachineAddress);
      
      if (!accountInfo) {
        throw new Error(`Candy machine account not found at address: ${candyMachineAddress.toString()}`);
      }

      // Log all account details
      const accountOwner = accountInfo.owner.toString();
      console.log('✅ Account found!');
      console.log('Account owner:', accountOwner);
      console.log('Account data length:', accountInfo.data.length);
      console.log('Account lamports:', accountInfo.lamports);
      console.log('Account executable:', accountInfo.executable);
      console.log('Account rent epoch:', accountInfo.rentEpoch);
      
      // Known program IDs for candy machines
      const CANDY_MACHINE_V2_PROGRAM = 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ';
      const CANDY_MACHINE_CORE_PROGRAM = 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR';
      const CANDY_MACHINE_V3_PROGRAM = 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR'; // Same as core
      
      let candyMachineType = 'unknown';
      if (accountOwner === CANDY_MACHINE_V2_PROGRAM) {
        candyMachineType = 'v2';
      } else if (accountOwner === CANDY_MACHINE_CORE_PROGRAM) {
        candyMachineType = 'v3/core';
      } else {
        candyMachineType = `unknown (${accountOwner})`;
      }
      
      console.log('🎯 Detected candy machine type:', candyMachineType);
      console.log('=== END DEBUG INFO ===');
      
      // Create candy machine data with detected info
      setCandyMachineData({
        address: candyMachineAddress,
        itemsAvailable: 1000, // We'll parse this from the account data later
        itemsMinted: 0,
        itemsRemaining: 1000,
        goLiveDate: new Date(),
        price: 0.1,
        symbol: 'DETECTED',
        sellerFeeBasisPoints: 500,
        version: candyMachineType
      });

      console.log('✅ Candy machine data created successfully!');
      
    } catch (err: any) {
      console.error('❌ Error fetching candy machine:', err);
      setError(`Failed to fetch candy machine: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [connection, candyMachineId]);

  // Fetch candy machine data when component mounts
  useEffect(() => {
    if (connection) {
      fetchCandyMachineData();
    }
  }, [connection, fetchCandyMachineData]);

  // Mint NFT function (placeholder)
  const mintNFT = async () => {
    if (!candyMachineData) return;
    
    setMinting(true);
    try {
      // For now, just show success message
      setError(null);
      console.log('Minting would happen here for candy machine type:', candyMachineData.version);
      
      // Simulate minting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setError('✅ Minting simulation complete! The candy machine was successfully detected and is ready for implementation.');
    } catch (err: any) {
      setError(`Minting failed: ${err.message}`);
    } finally {
      setMinting(false);
    }
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
                Raw account data analysis (no SDK parsing)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <span className="ml-2 text-white">Analyzing account data...</span>
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
                      <span className="text-gray-400">Type Detected:</span>
                      <Badge variant="outline" className="text-white border-white/30">
                        {candyMachineData.version}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Address:</span>
                      <span className="text-white text-xs font-mono">
                        {candyMachineData.address.toString().slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Test Mint Button */}
                  <Button
                    onClick={mintNFT}
                    disabled={!connected || minting}
                    className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 disabled:opacity-50"
                    size="lg"
                  >
                    {minting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : !connected ? (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet First
                      </>
                    ) : (
                      `Test Detection (${candyMachineData.price} SOL)`
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="h-6 w-6" />
                Debug Information
              </CardTitle>
              <CardDescription className="text-gray-300">
                Check browser console for detailed logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Status:</p>
                  <p className="text-white">
                    {loading ? '🔄 Loading...' : 
                     error ? '❌ Error occurred' : 
                     candyMachineData ? '✅ Account detected!' : 
                     '⏳ Waiting...'}
                  </p>
                </div>
                
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Network:</p>
                  <p className="text-white">{SOLANA_CONFIG.NETWORK}</p>
                </div>
                
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Candy Machine ID:</p>
                  <p className="text-white text-xs font-mono break-all">{candyMachineId}</p>
                </div>
                
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">
                    Open browser console (F12) to see detailed account analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NFTMintingInterface;