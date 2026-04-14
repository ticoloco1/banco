import { useState } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import {
  useAllNftListings, useBuyNftFromListing, useMyNfts,
  useCreateListing, useCancelListing, useRechargeNft
} from "@/hooks/useMiniSite";
import { useCollections, useBuyCollectionNft } from "@/hooks/useCollections";
import { toast } from "sonner";
import {
  Gem, ShoppingCart, Tag, RefreshCw, Eye, Package, X, RotateCcw, Rocket, Layers, Minus, Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Marketplace = () => {
  const { user } = useAuth();
  const { data: listings } = useAllNftListings();
  const { data: myNfts } = useMyNfts();
  const { data: collections } = useCollections();
  const buyFromListing = useBuyNftFromListing();
  const createListing = useCreateListing();
  const cancelListing = useCancelListing();
  const rechargeNft = useRechargeNft();
  const buyCollectionNft = useBuyCollectionNft();

  const [buyConfirm, setBuyConfirm] = useState<any>(null);
  const [sellModal, setSellModal] = useState<any>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [rechargeModal, setRechargeModal] = useState<any>(null);
  const [mintModal, setMintModal] = useState<any>(null);
  const [mintQty, setMintQty] = useState(1);

  const handleBuyListing = async () => {
    if (!buyConfirm) return;
    try {
      await buyFromListing.mutateAsync(buyConfirm);
      toast.success("NFT purchased from marketplace!");
      setBuyConfirm(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateListing = async () => {
    if (!sellModal || !sellPrice) return;
    try {
      await createListing.mutateAsync({
        nft_purchase_id: sellModal.id,
        video_id: sellModal.video_id,
        price: parseFloat(sellPrice),
      });
      toast.success("NFT listed for sale!");
      setSellModal(null);
      setSellPrice("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeModal) return;
    const video = rechargeModal.mini_site_videos;
    try {
      await rechargeNft.mutateAsync({
        purchaseId: rechargeModal.id,
        extraViews: video.nft_max_views || 1,
      });
      toast.success(`Recharged! +${video.nft_max_views || 1} views added.`);
      setRechargeModal(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleMintCollection = async () => {
    if (!mintModal) return;
    try {
      await buyCollectionNft.mutateAsync({
        collection_id: mintModal.id,
        quantity: mintQty,
      });
      setMintModal(null);
      setMintQty(1);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="NFT Marketplace" description="Buy, sell and recharge creator content NFTs on HASHPO. Browse collections and resale listings." />
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Gem className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-black text-foreground">NFT Marketplace</h1>
        </div>

        <Tabs defaultValue="collections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="collections" className="flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5" /> Collections
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" /> Resale
            </TabsTrigger>
            <TabsTrigger value="my-nfts" className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> My NFTs
            </TabsTrigger>
          </TabsList>

          {/* Collections */}
          <TabsContent value="collections">
            {!collections?.length ? (
              <div className="text-center py-20 text-muted-foreground text-sm">
                No collections launched yet. Creators can launch from the Mini-Site Editor.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {collections.map((col: any) => {
                  const video = col.mini_site_videos;
                  const remaining = col.max_editions - col.editions_minted;
                  const soldOutPct = Math.round((col.editions_minted / col.max_editions) * 100);
                  const soldOut = remaining <= 0;

                  return (
                    <div key={col.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group">
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={col.thumbnail_url || video?.thumbnail_url || `https://img.youtube.com/vi/${video?.youtube_video_id}/hqdefault.jpg`}
                          alt={col.title}
                          className={`w-full h-full object-cover ${soldOut ? "grayscale" : ""}`}
                        />
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                          <Layers className="w-3 h-3" /> COLLECTION
                        </div>
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {col.creator_pct}/{col.platform_pct} split
                        </div>
                        {soldOut && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <span className="text-white font-black text-lg">SOLD OUT 🔥</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm font-bold text-foreground line-clamp-2">{col.title}</p>
                        {col.description && <p className="text-[10px] text-muted-foreground line-clamp-2">{col.description}</p>}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-black text-primary">${col.price_per_nft}</p>
                            <p className="text-[10px] text-muted-foreground">{col.view_tier} view(s) per NFT</p>
                          </div>
                          {col.recharge_enabled && (
                            <span className="text-[10px] text-accent font-bold flex items-center gap-0.5">
                              <RefreshCw className="w-3 h-3" /> ${col.recharge_price}
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{col.editions_minted.toLocaleString()} minted</span>
                            <span>{remaining.toLocaleString()} remaining</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${soldOutPct}%` }} />
                          </div>
                        </div>

                        {/* Blockchain hashes */}
                        <div className="flex gap-2 text-[8px] font-mono text-muted-foreground">
                          {col.polygon_hash && <span>🔷 {col.polygon_hash.slice(0, 10)}...</span>}
                          {col.arweave_hash && <span>📦 {col.arweave_hash.slice(0, 10)}...</span>}
                        </div>

                        {user && !soldOut && col.creator_id !== user.id && (
                          <button
                            onClick={() => { setMintModal(col); setMintQty(1); }}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Rocket className="w-3.5 h-3.5" /> Mint · ${col.price_per_nft}
                          </button>
                        )}
                        {user && col.creator_id === user.id && (
                          <div className="text-center text-[10px] text-muted-foreground font-bold py-1">YOUR COLLECTION</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Browse Listings */}
          <TabsContent value="browse">
            {!listings?.length ? (
              <div className="text-center py-20 text-muted-foreground text-sm">
                No NFTs listed for resale yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing: any) => {
                  const video = listing.mini_site_videos;
                  return (
                    <div key={listing.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group">
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={video?.thumbnail_url || `https://img.youtube.com/vi/${video?.youtube_video_id}/hqdefault.jpg`}
                          alt={video?.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-[10px] font-black">
                          RESALE
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm font-bold text-foreground line-clamp-2">{video?.title}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-black text-primary">${listing.price}</p>
                            <p className="text-[10px] text-muted-foreground">{video?.nft_max_views} view(s) per NFT</p>
                          </div>
                          {video?.recharge_enabled && (
                            <span className="text-[10px] text-accent font-bold flex items-center gap-0.5">
                              <RefreshCw className="w-3 h-3" /> ${video.recharge_price}
                            </span>
                          )}
                        </div>
                        {user && listing.seller_id !== user.id && (
                          <button
                            onClick={() => setBuyConfirm(listing)}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Buy · ${listing.price}
                          </button>
                        )}
                        {user && listing.seller_id === user.id && (
                          <button
                            onClick={() => cancelListing.mutateAsync(listing.id).then(() => toast.success("Listing cancelled"))}
                            className="w-full py-2 bg-destructive/10 text-destructive rounded-lg text-xs font-bold hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel Listing
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My NFTs */}
          <TabsContent value="my-nfts">
            {!user ? (
              <p className="text-center py-20 text-muted-foreground text-sm">Login to see your NFTs.</p>
            ) : !myNfts?.length ? (
              <p className="text-center py-20 text-muted-foreground text-sm">You don't own any NFTs yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myNfts.map((nft: any) => {
                  const video = nft.mini_site_videos;
                  const viewsLeft = nft.views_allowed - nft.views_used;
                  const expired = viewsLeft <= 0;

                  return (
                    <div key={nft.id} className={`bg-card border rounded-xl overflow-hidden ${expired ? "border-muted opacity-75" : "border-border"}`}>
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={video?.thumbnail_url || ""}
                          alt={video?.title}
                          className={`w-full h-full object-cover ${expired ? "grayscale" : ""}`}
                        />
                        {expired && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="text-white text-xs font-black bg-muted-foreground/80 px-3 py-1 rounded-full">
                              {video?.recharge_enabled ? "RECHARGE NEEDED" : "COLLECTIBLE 🏆"}
                            </span>
                          </div>
                        )}
                        {nft.polygon_hash && (
                          <div className="absolute top-2 left-2 bg-accent/90 text-accent-foreground px-1.5 py-0.5 rounded text-[8px] font-mono">
                            {nft.polygon_hash.slice(0, 10)}...
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm font-bold text-foreground line-clamp-1">{video?.title}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="w-3 h-3" /> {viewsLeft}/{nft.views_allowed} views left
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Paid ${nft.price_paid}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSellModal(nft); setSellPrice(String(nft.price_paid)); }}
                            className="flex-1 py-2 bg-accent/10 text-accent rounded-lg text-xs font-bold hover:bg-accent/20 transition-colors flex items-center justify-center gap-1"
                          >
                            <Tag className="w-3 h-3" /> Sell
                          </button>
                          {expired && video?.recharge_enabled && (
                            <button
                              onClick={() => setRechargeModal(nft)}
                              className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Recharge
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mint Collection Dialog */}
      <AlertDialog open={!!mintModal} onOpenChange={o => !o && setMintModal(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" /> Mint NFT
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p><strong>{mintModal?.title}</strong></p>
                <p className="text-[10px] text-muted-foreground">
                  {mintModal?.editions_minted?.toLocaleString()}/{mintModal?.max_editions?.toLocaleString()} minted · {mintModal?.view_tier} view(s) per NFT
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Quantity</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMintQty(Math.max(1, mintQty - 1))} className="p-1.5 bg-secondary rounded border border-border"><Minus className="w-3 h-3" /></button>
                    <Input type="number" value={mintQty} onChange={e => setMintQty(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))} className="w-24 text-center font-mono" min="1" max="10000" />
                    <button onClick={() => setMintQty(Math.min(10000, mintQty + 1))} className="p-1.5 bg-secondary rounded border border-border"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Unit Price</span>
                    <span className="font-mono">${mintModal?.price_per_nft}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Quantity</span>
                    <span className="font-mono">×{mintQty}</span>
                  </div>
                  <div className="border-t border-border pt-1 flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span className="text-primary font-mono">${(mintModal?.price_per_nft * mintQty).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground pt-1">
                    Split: {mintModal?.creator_pct}% Creator / {mintModal?.platform_pct}% Platform
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMintCollection} disabled={buyCollectionNft.isPending} className="bg-primary text-primary-foreground">
              {buyCollectionNft.isPending ? "Minting..." : `Mint ${mintQty}x · $${(mintModal?.price_per_nft * mintQty).toFixed(2)}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Buy from listing dialog */}
      <AlertDialog open={!!buyConfirm} onOpenChange={o => !o && setBuyConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Buy from Marketplace
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p><strong>{buyConfirm?.mini_site_videos?.title}</strong></p>
                <p>Price: <span className="font-mono font-bold text-primary">${buyConfirm?.price}</span></p>
                <p>{buyConfirm?.mini_site_videos?.nft_max_views} view(s) included</p>
                <p className="text-[10px] text-muted-foreground">NFT ownership will be transferred to you on Polygon.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBuyListing} className="bg-primary text-primary-foreground">
              Buy · ${buyConfirm?.price}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sell dialog */}
      <AlertDialog open={!!sellModal} onOpenChange={o => !o && setSellModal(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-accent" /> List NFT for Sale
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p><strong>{sellModal?.mini_site_videos?.title}</strong></p>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Your Price (USDC)</label>
                  <Input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} min="0" step="0.01" />
                </div>
                <p className="text-[10px] text-muted-foreground">5% fee: 2% royalties to creator + 3% platform.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateListing} className="bg-accent text-accent-foreground">
              List for ${sellPrice || "0"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recharge dialog */}
      <AlertDialog open={!!rechargeModal} onOpenChange={o => !o && setRechargeModal(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" /> Recharge Views
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p><strong>{rechargeModal?.mini_site_videos?.title}</strong></p>
                <p>Add <strong>{rechargeModal?.mini_site_videos?.nft_max_views || 1} more view(s)</strong></p>
                <p>Cost: <span className="font-mono font-bold text-primary">${rechargeModal?.mini_site_videos?.recharge_price}</span></p>
                <p className="text-[10px] text-muted-foreground">50% creator / 50% platform.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecharge} className="bg-primary text-primary-foreground">
              Recharge · ${rechargeModal?.mini_site_videos?.recharge_price}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Marketplace;
