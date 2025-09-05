import Heading from "./Heading";
import NftCard from "../NftCard";
export default function MoreNfts() {
    return (
        <div className="py-20">
            <div className="flex-center-between">
                <Heading
                    title="Discover More NFTs"
                    subtitle="Explore a wider range of NFTs from various categories."
                />
                <button className="base-button px-10 bg-transparent border-3 font-normal border-[#A259FF]">
                    <i className="fa-regular fa-eye mr-3 text-[#A259FF]"></i>
                    See All
                </button>
            </div>
            <div className="flex-center-between gap-6 overflow-x-auto mt-15 scrollbar-hide">
                <div className="flex-shrink-0">
                    <NftCard />
                </div>
                <div className="flex-shrink-0">
                    <NftCard />
                </div>
                <div className="flex-shrink-0">
                    <NftCard />
                </div>
                <div className="flex-shrink-0">
                    <NftCard />
                </div>
                <div className="flex-shrink-0">
                    <NftCard />
                </div>
                <div className="flex-shrink-0">
                    <NftCard />
                </div>
                <div className="flex-shrink-0">
                    <NftCard />
                </div>
                <div className="flex-shrink-0">
                    <NftCard />
                </div>
            </div>
        </div>
    );
}
