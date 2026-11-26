import {Link} from "react-router-dom";
import Heading from "./Heading";
import NftCard, {NftCardSkeleton} from "../NftCard";
import {useMarket} from "../../context/MarketContext";

// Hàng NFT cuộn ngang dùng trên trang chủ.
export function NftRow({title, subtitle, nfts, linkTo, linkLabel = "See All", icon = "fa-regular fa-eye"}) {
    const {loading} = useMarket();
    return (
        <div className="py-20">
            <div className="flex-center-between flex-wrap gap-4">
                <Heading title={title} subtitle={subtitle} />
                <Link to={linkTo} className="base-button px-10 bg-transparent border-3 font-normal border-blue-500">
                    <i className={`${icon} mr-3 text-blue-500`}></i>
                    {linkLabel}
                </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto mt-15 pb-4 scrollbar-hide">
                {loading
                    ? Array.from({length: 3}, (_, i) => (
                          <div key={i} className="flex-shrink-0">
                              <NftCardSkeleton type="homePage" />
                          </div>
                      ))
                    : nfts.map((nft) => (
                          <div key={nft.key} className="flex-shrink-0">
                              <NftCard nft={nft} type="homePage" />
                          </div>
                      ))}
            </div>
        </div>
    );
}

export default function MoreNfts() {
    const {nfts, loading} = useMarket();
    const listed = nfts.filter((n) => n.listing && !n.auction).reverse();
    // chưa có listing -> hiển thị NFT mới mint gần đây
    const showRecent = listed.length === 0;
    const list = (showRecent ? [...nfts].reverse() : listed).slice(0, 12);
    if (!loading && list.length === 0) return null;

    return (
        <NftRow
            title={showRecent ? "Recently Minted" : "Discover More NFTs"}
            subtitle="Explore new NFTs from KSEA creators."
            nfts={list}
            linkTo={showRecent ? "/marketplace?tab=all" : "/marketplace"}
        />
    );
}
