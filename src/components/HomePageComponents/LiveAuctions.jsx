import {NftRow} from "./MoreNfts";
import {useMarket} from "../../context/MarketContext";

export default function LiveAuctions() {
    const {nfts} = useMarket();
    const now = Date.now() / 1000;
    const live = nfts.filter((n) => n.auction && n.auction.endTime > now).sort((a, b) => a.auction.endTime - b.auction.endTime);
    if (live.length === 0) return null;
    return (
        <NftRow
            title="Live Auctions"
            subtitle="Bid on these NFTs before the timer runs out."
            nfts={live.slice(0, 12)}
            linkTo="/auction"
            icon="fa-solid fa-gavel"
        />
    );
}
