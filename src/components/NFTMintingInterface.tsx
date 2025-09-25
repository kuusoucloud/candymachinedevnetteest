'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity, CandyMachineV2 } from '@metaplex-foundation/js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SOLANA_CONFIG } from '@/lib/solana-config';

interface NFTMintingInterfaceProps {
  candyMachineId?: string;
}

interface CandyMachineData {
  address: PublicKey;
  itemsAvailable: number;
  itemsMinted: number;
  itemsRemaining: number;
  goLiveDate?: Date;
  price: number;
  symbol: string;
  sellerFeeBasisPoints: number;
  version?: 'v2' | 'v3';
}

interface MintedNFT {
  name: string;
  image: string;
  mint: string;
  signature: string;
}

export default function NFTMintingInterface({ 
  candyMachineId = SOLANA_CONFIG.CANDY_MACHINE_ID 
}: NFTMintingInterfaceProps) {
  const { connection } = useConnection();
  const { publicKey, wallet, signTransaction } = useWallet();
  const [metaplex, setMetaplex] = useState<Metaplex | null>(null);
  const [candyMachine, setCandyMachine] = useState<CandyMachineV2 | null>(null);
  const [candyMachineData, setCandyMachineData] = useState<CandyMachineData | null>(null);
  const [candyMachineId, setCandyMachineId] = useState(SOLANA_CONFIG.CANDY_MACHINE_ID);
  const [testCandyMachineId, setTestCandyMachineId] = useState('');
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);

  // Initialize Metaplex
  useEffect(() => {
    if (wallet && connection) {
      const mx = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter));
      setMetaplex(mx);
    }
  }, [connection, wallet]);

  // Fetch candy machine data
  const fetchCandyMachineData = useCallback(async () => {
    if (!metaplex || !candyMachineId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching candy machine with ID:', candyMachineId);
      console.log('Network:', SOLANA_CONFIG.NETWORK);
      console.log('RPC Endpoint:', connection.rpcEndpoint);
      
      const candyMachineAddress = new PublicKey(candyMachineId);
      console.log('Candy machine address:', candyMachineAddress.toString());
      
      // First, let's try to check if the account exists
      const accountInfo = await connection.getAccountInfo(candyMachineAddress);
      console.log('Account info:', accountInfo);
      
      if (!accountInfo) {
        throw new Error(`Candy machine account not found at address: ${candyMachineAddress.toString()}`);
      }

      let candyMachineAccount;
      let isV3 = false;

      try {
        // Try Candy Machine v2 first
        console.log('Trying Candy Machine v2...');
        candyMachineAccount = await metaplex.candyMachinesV2().findByAddress({
          address: candyMachineAddress,
        });
        console.log('Successfully loaded as Candy Machine v2');
      } catch (v2Error) {
        console.log('v2 failed, trying Candy Machine Core (v3)...');
        try {
          // Try Candy Machine Core (v3)
          candyMachineAccount = await metaplex.candyMachines().findByAddress({
            address: candyMachineAddress,
          });
          isV3 = true;
          console.log('Successfully loaded as Candy Machine Core (v3)');
        } catch (v3Error) {
          console.error('Both v2 and v3 failed:', { v2Error, v3Error });
          throw new Error(`This account is not a valid Candy Machine v2 or v3. Please verify the candy machine ID.`);
        }
      }

      console.log('Candy machine account:', candyMachineAccount);
      setCandyMachine(candyMachineAccount);
      
      // Handle different versions
      if (isV3) {
        // Candy Machine Core (v3) structure
        const itemsLoaded = candyMachineAccount.itemsLoaded?.toNumber() || 0;
        const itemsRedeemed = candyMachineAccount.itemsRedeemed?.toNumber() || 0;
        const itemsRemaining = itemsLoaded - itemsRedeemed;
        
        setCandyMachineData({
          address: candyMachineAccount.address,
          itemsAvailable: itemsLoaded,
          itemsMinted: itemsRedeemed,
          itemsRemaining: itemsRemaining,
          goLiveDate: null, // v3 doesn't have goLiveDate in the same way
          price: 0, // v3 pricing is handled differently
          symbol: candyMachineAccount.symbol || 'NFT',
          sellerFeeBasisPoints: candyMachineAccount.sellerFeeBasisPoints || 0,
          version: 'v3'
        });
      } else {
        // Candy Machine v2 structure
        const itemsAvailable = candyMachineAccount.itemsAvailable.toNumber();
        const itemsRemaining = candyMachineAccount.itemsRemaining.toNumber();
        const itemsMinted = itemsAvailable - itemsRemaining;
        
        setCandyMachineData({
          address: candyMachineAccount.address,
          itemsAvailable,
          itemsMinted,
          itemsRemaining,
          goLiveDate: candyMachineAccount.goLiveDate?.toDate(),
          price: candyMachineAccount.price.basisPoints.toNumber() / 1000000000, // Convert lamports to SOL
          symbol: candyMachineAccount.symbol,
          sellerFeeBasisPoints: candyMachineAccount.sellerFeeBasisPoints,
          version: 'v2'
        });
      }
    } catch (err: any) {
      console.error('Error fetching candy machine:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      let errorMessage = 'Failed to fetch candy machine data.';
      
      if (err.message?.includes('not found')) {
        errorMessage = `Candy machine account not found at address: ${candyMachineId}. Please verify the candy machine ID is correct and deployed on ${SOLANA_CONFIG.NETWORK}.`;
      } else if (err.message?.includes('Invalid public key')) {
        errorMessage = 'Invalid candy machine ID format. Please check the candy machine ID.';
      } else if (err.message?.includes('not a valid Candy Machine')) {
        errorMessage = err.message;
      } else if (err.message?.includes('network')) {
        errorMessage = `Network error. Please check your connection to ${SOLANA_CONFIG.NETWORK}.`;
      } else {
        errorMessage = `Error: ${err.message || 'Unknown error occurred'}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [metaplex, candyMachineId, connection]);

  useEffect(() => {
    if (metaplex) {
      fetchCandyMachineData();
    }
  }, [metaplex, fetchCandyMachineData]);

  // Mint NFT function
  const mintNFT = async () => {
    if (!metaplex || !candyMachine || !publicKey) {
      setError('Wallet not connected or candy machine not loaded');
      return;
    }

    setMinting(true);
    setError(null);
    setSuccess(null);

    try {
      let nft, response;
      
      if (candyMachineData?.version === 'v3') {
        // Candy Machine Core (v3) minting
        console.log('Minting with Candy Machine Core (v3)...');
        const result = await metaplex.candyMachines().mint({
          candyMachine,
        });
        nft = result.nft;
        response = result.response;
      } else {
        // Candy Machine v2 minting
        console.log('Minting with Candy Machine v2...');
        const result = await metaplex.candyMachinesV2().mint({
          candyMachine,
        });
        nft = result.nft;
        response = result.response;
      }

      const mintedNFT: MintedNFT = {
        name: nft.name,
        image: nft.json?.image || '',
        mint: nft.address.toString(),
        signature: response.signature,
      };

      setMintedNFTs(prev => [mintedNFT, ...prev]);
      setSuccess(`Successfully minted ${nft.name}!`);
      
      // Refresh candy machine data
      await fetchCandyMachineData();
    } catch (err: any) {
      console.error('Minting error:', err);
      setError(err.message || 'Failed to mint NFT. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  const isLive = candyMachineData?.goLiveDate ? new Date() >= candyMachineData.goLiveDate : true;
  const canMint = publicKey && candyMachineData && candyMachineData.itemsRemaining > 0 && isLive;

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">NFT Minting Interface</h1>
          <p className="text-lg text-gray-600">
            Connect your wallet and mint NFTs from our Solana devnet candy machine
          </p>
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
          </div>
        </div>

        {/* Debug Info - Remove in production */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Network:</strong> {SOLANA_CONFIG.NETWORK}</div>
            <div><strong>RPC Endpoint:</strong> {connection.rpcEndpoint}</div>
            <div><strong>Candy Machine ID:</strong> {candyMachineId}</div>
            <div><strong>Candy Machine Version:</strong> {candyMachineData?.version || 'Unknown'}</div>
            <div><strong>Wallet Connected:</strong> {publicKey ? 'Yes' : 'No'}</div>
            {publicKey && <div><strong>Wallet Address:</strong> {publicKey.toString()}</div>}
          </CardContent>
        </Card>

        {/* Candy Machine ID Input for Testing */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Test Different Candy Machine</CardTitle>
            <CardDescription>
              The current candy machine ID appears to be invalid. Try a different one:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter candy machine ID"
                className="flex-1 px-3 py-2 border rounded-md"
                value={testCandyMachineId}
                onChange={(e) => setTestCandyMachineId(e.target.value)}
              />
              <Button 
                onClick={() => {
                  if (testCandyMachineId.trim()) {
                    // Update the candy machine ID temporarily
                    setCandyMachineId(testCandyMachineId.trim());
                  }
                }}
                disabled={!testCandyMachineId.trim()}
              >
                Test
              </Button>
            </div>
            <div className="text-xs text-blue-600">
              <p><strong>Suggested test candy machine IDs for devnet:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Try creating your own candy machine using Metaplex Sugar CLI</li>
                <li>Or find a valid devnet candy machine from Solana Explorer</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Candy Machine Info */}
        {candyMachineData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Candy Machine Details
              </CardTitle>
              <CardDescription>
                Collection: {candyMachineData.symbol}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {candyMachineData.itemsAvailable}
                  </div>
                  <div className="text-sm text-gray-600">Total Supply</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {candyMachineData.itemsMinted}
                  </div>
                  <div className="text-sm text-gray-600">Minted</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {candyMachineData.itemsRemaining}
                  </div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">
                  Price: {candyMachineData.price} SOL
                </Badge>
                <Badge variant="outline">
                  Royalty: {candyMachineData.sellerFeeBasisPoints / 100}%
                </Badge>
                {candyMachineData.goLiveDate && (
                  <Badge variant={isLive ? "default" : "secondary"}>
                    {isLive ? "Live" : `Goes live: ${candyMachineData.goLiveDate.toLocaleString()}`}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Minting Section */}
        <Card>
          <CardHeader>
            <CardTitle>Mint Your NFT</CardTitle>
            <CardDescription>
              {!publicKey 
                ? "Connect your wallet to start minting" 
                : canMint 
                ? "Click the button below to mint your NFT"
                : "Minting is currently unavailable"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              {!publicKey ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Wallet className="h-5 w-5" />
                  <span>Please connect your wallet</span>
                </div>
              ) : loading ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Candy Machine...
                </Button>
              ) : (
                <Button
                  onClick={mintNFT}
                  disabled={!canMint || minting}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {minting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    `Mint NFT (${candyMachineData?.price || 0} SOL)`
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Minted NFTs Gallery */}
        {mintedNFTs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Minted NFTs</CardTitle>
              <CardDescription>
                Recently minted NFTs from this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mintedNFTs.map((nft, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    {nft.image && (
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-48 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80';
                        }}
                      />
                    )}
                    <h3 className="font-semibold">{nft.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Mint: {nft.mint.slice(0, 8)}...{nft.mint.slice(-8)}</div>
                      <a
                        href={`https://explorer.solana.com/tx/${nft.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                      >
                        View Transaction <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. Connect your Solana wallet (Phantom, Solflare, etc.)</p>
            <p>2. Make sure you have enough SOL for minting + transaction fees</p>
            <p>3. Click "Mint NFT" to mint from the candy machine</p>
            <p>4. Confirm the transaction in your wallet</p>
            <p>5. Your NFT will appear in the gallery below once minted</p>
            <p className="text-purple-600 font-medium">
              Note: This interface connects to Solana devnet for testing purposes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}