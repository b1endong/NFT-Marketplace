import NftCard, {NftCardSkeleton} from "./NftCard";
import {EmptyState, ErrorState} from "./common/States";
import {useMarket} from "../context/MarketContext";

export default function NftGrid({nfts, type = "grid", emptyTitle = "No NFTs found", emptyText, className = ""}) {
    const {loading, error, refresh} = useMarket();

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
            {loading ? (
                Array.from({length: 6}, (_, i) => <NftCardSkeleton key={i} type={type} />)
            ) : error && !nfts.length ? (
                <ErrorState message={error} onRetry={refresh} />
            ) : nfts.length === 0 ? (
                <EmptyState title={emptyTitle}>{emptyText}</EmptyState>
            ) : (
                nfts.map((nft) => <NftCard key={nft.key} nft={nft} type={type} />)
            )}
        </div>
    );
}
