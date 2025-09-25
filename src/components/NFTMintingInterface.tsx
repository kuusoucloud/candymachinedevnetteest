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
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

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
      const candyMachineAddress = new PublicKey(candyMachineId);
      const candyMachineAccount = await metaplex.candyMachinesV2().findByAddress({
        address: candyMachineAddress,
      });

      setCandyMachine(candyMachineAccount);
      
      // Calculate minted items from available and remaining
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
      });
    } catch (err) {
      console.error('Error fetching candy machine:', err);
      setError('Failed to fetch candy machine data. Please check the candy machine ID.');
    } finally {
      setLoading(false);
    }
  }, [metaplex, candyMachineId]);

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
      const { nft, response } = await metaplex.candyMachinesV2().mint({
        candyMachine,
        owner: publicKey,
      });

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