import {Link, useNavigate} from "react-router-dom";
import NftImage from "./common/NftImage";
import {AddressLink} from "./common/Address";
import Countdown from "./common/Countdown";
import {formatEth} from "../lib/format";
import {useTilt} from "../hooks/useEffects";

const VARIANTS = {
    userProfile: {background: "bg-[#2B2B2B]", width: "w-full"},
    homePage: {background: "bg-[#3B3B3B]", width: "w-80 sm:w-96"},
    grid: {background: "bg-[#3B3B3B]", width: "w-full"},
};

export default function NftCard({nft, type = "grid"}) {
    const navigate = useNavigate();
    const tiltRef = useTilt(5);
    const variant = VARIANTS[type] || VARIANTS.grid;
    const {listing, auction} = nft;

    let priceLabel = "Status";
    let priceValue = "Not listed";
    if (auction) {
        priceLabel = auction.highestBid > 0n ? "Highest Bid" : "Starting Bid";
        priceValue = `${formatEth(auction.highestBid > 0n ? auction.highestBid : auction.startingBid)} ETH`;
    } else if (listing) {
        priceLabel = "Price";
        priceValue = `${formatEth(listing.price)} ETH`;
    }

    return (
        <div
            ref={tiltRef}
            onClick={() => navigate(nft.path)}
            className={`tilt-card group flex flex-col rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/5 ${variant.width}`}
        >
            <span className="tilt-glare" />
            <div className="w-full aspect-[4/3] relative overflow-hidden">
                <NftImage
                    src={nft.image}
                    alt={nft.name}
                    loading={nft.metaLoading}
                    seed={nft.key}
                    className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {auction && (
                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1 text-sm flex items-center gap-2">
                        <i className="fa-solid fa-gavel text-yellow-400"></i>
                        <Countdown endTime={auction.endTime} />
                    </span>
                )}
                {!auction && listing && (
                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1 text-sm">
                        <i className="fa-solid fa-tag text-green-400 mr-2"></i>For sale
                    </span>
                )}
            </div>
            <div className={`py-5 px-6 w-full flex-1 ${variant.background}`}>
                <Link
                    to={nft.path}
                    className="text-xl font-bold truncate block hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {nft.name}
                </Link>
                <div className="mt-2 text-sm text-[#CCCCCC] flex items-center gap-2">
                    <span className="text-[#858584]">{nft.creator ? "Creator" : "Owner"}</span>
                    <AddressLink address={nft.creator || nft.owner} />
                </div>
                <div className="mt-5 flex-center-between">
                    <p className="flex flex-col gap-1">
                        <strong className="text-xs text-[#858584]">{priceLabel}</strong>
                        <span className="font-mono">{priceValue}</span>
                    </p>
                    {nft.category && (
                        <span className="text-xs bg-[#2B2B2B] border border-[#555] rounded-xl px-3 py-1">
                            {nft.category}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function NftCardSkeleton({type = "grid"}) {
    const variant = VARIANTS[type] || VARIANTS.grid;
    return (
        <div className={`rounded-2xl overflow-hidden ${variant.width}`}>
            <div className="w-full aspect-[4/3] bg-[#3B3B3B] skeleton" />
            <div className={`py-5 px-6 flex flex-col gap-3 ${variant.background}`}>
                <div className="h-6 w-2/3 bg-[#555] rounded skeleton" />
                <div className="h-4 w-1/2 bg-[#555] rounded skeleton" />
                <div className="h-8 w-1/3 bg-[#555] rounded skeleton mt-2" />
            </div>
        </div>
    );
}
