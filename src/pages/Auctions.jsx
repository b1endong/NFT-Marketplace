import {Link} from "react-router-dom";
import NftGrid from "../components/NftGrid";
import {useNow} from "../components/common/Countdown";
import {useMarket} from "../context/MarketContext";

export default function Auctions() {
    const {nfts} = useMarket();
    const now = useNow(5000);
    const auctions = nfts.filter((n) => n.auction);
    const live = auctions.filter((n) => n.auction.endTime > now).sort((a, b) => a.auction.endTime - b.auction.endTime);
    const ended = auctions.filter((n) => n.auction.endTime <= now);

    return (
        <div className="max-w-calc m-auto py-12 lg:py-16 flex flex-col gap-16">
            <div className="flex-center-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold">Live Auctions</h1>
                    <p className="text-lg text-[#CCCCCC] mt-3">
                        Place a bid before the timer runs out. Outbid? Withdraw your ETH any time from the NFT page.
                    </p>
                </div>
                <Link to="/marketplace" className="base-button bg-transparent border-2 border-blue-500 px-8">
                    <i className="fa-solid fa-store mr-2 text-blue-500"></i>Marketplace
                </Link>
            </div>

            <NftGrid
                nfts={live}
                emptyTitle="No live auctions"
                emptyText="Own an NFT? List it as a Timed Auction from its page."
            />

            {ended.length > 0 && (
                <div>
                    <h2 className="text-3xl font-bold">Awaiting Settlement</h2>
                    <p className="text-[#CCCCCC] mt-2">
                        These auctions have ended. Anyone can settle them to send the NFT to the winner.
                    </p>
                    <NftGrid nfts={ended} className="mt-8" />
                </div>
            )}
        </div>
    );
}
