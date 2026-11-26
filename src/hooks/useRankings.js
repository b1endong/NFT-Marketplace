import {useMemo} from "react";
import {useMarket} from "../context/MarketContext";
import {ZERO_ADDRESS} from "../lib/format";

// Xếp hạng creator theo tổng giá trị bán, collector theo số NFT đang sở hữu.
export function useRankings() {
    const {nfts, stats} = useMarket();

    return useMemo(() => {
        const creators = new Map();
        const collectors = new Map();

        for (const nft of nfts) {
            if (nft.creator) {
                const key = nft.creator.toLowerCase();
                const entry = creators.get(key) || {address: nft.creator, created: 0, sold: 0, volume: 0n, image: null};
                entry.created += 1;
                entry.image ||= nft.image || null;
                for (const item of nft.history) {
                    if (item.isSold) {
                        entry.sold += 1;
                        entry.volume += stats.salePrice(item);
                    }
                }
                creators.set(key, entry);
            }
            if (nft.owner && nft.owner !== ZERO_ADDRESS) {
                const key = nft.owner.toLowerCase();
                const entry = collectors.get(key) || {address: nft.owner, owned: 0, listed: 0};
                entry.owned += 1;
                if (nft.listing) entry.listed += 1;
                collectors.set(key, entry);
            }
        }

        const byVolume = (a, b) =>
            a.volume === b.volume ? b.sold - a.sold || b.created - a.created : a.volume > b.volume ? -1 : 1;

        return {
            creators: [...creators.values()].sort(byVolume).map((c, i) => ({...c, rank: i + 1})),
            collectors: [...collectors.values()]
                .sort((a, b) => b.owned - a.owned)
                .map((c, i) => ({...c, rank: i + 1})),
        };
    }, [nfts, stats]);
}
