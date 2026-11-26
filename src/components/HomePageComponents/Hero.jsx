import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {formatEther} from "ethers";
import HeroCard from "./HeroCard";
import {useMarket} from "../../context/MarketContext";
import {useCountUp} from "../../hooks/useEffects";
import {formatEth} from "../../lib/format";

const MAX_FEATURED = 5;
const CYCLE_MS = 6500;

const PLACEHOLDER = {
    key: "placeholder",
    name: "Your NFT Here",
    image: null,
    creator: null,
    subtitle: "Mint yours on KSEA",
    status: "featured",
    priceLabel: "Mint",
    priceValue: "Gas only",
    tokenId: null,
    path: "/create",
};

function toCard(nft) {
    let status = "featured";
    let priceLabel = "Status";
    let priceValue = "Not listed";
    if (nft.auction) {
        const hasBid = nft.auction.highestBid > 0n;
        status = "auction";
        priceLabel = hasBid ? "Highest bid" : "Starting bid";
        priceValue = `${formatEth(hasBid ? nft.auction.highestBid : nft.auction.startingBid)} ETH`;
    } else if (nft.listing) {
        status = "sale";
        priceLabel = "Price";
        priceValue = `${formatEth(nft.listing.price)} ETH`;
    }
    return {
        key: nft.key,
        name: nft.name,
        image: nft.image || null,
        creator: nft.creator || nft.owner,
        status,
        priceLabel,
        priceValue,
        tokenId: nft.tokenId,
        path: nft.path,
    };
}

function HeroStat({value, label, loading}) {
    return (
        <li className="flex flex-col gap-1">
            <strong className="text-2xl sm:text-3xl font-mono tabular-nums">{loading ? "—" : value}</strong>
            <span className="text-sm sm:text-base text-[#A1A1AA]">{label}</span>
        </li>
    );
}

export default function Hero() {
    const {nfts, stats, loading} = useMarket();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    // Ưu tiên: đang đấu giá -> đang bán -> còn lại; NFT có ảnh lên trước.
    // Không đợi metadata: khi metadata về, thẻ sẽ tự xoay để cập nhật.
    const featured = useMemo(() => {
        const score = (n) => (n.auction ? 4 : n.listing ? 2 : 0) + (n.image ? 1 : 0);
        return [...nfts]
            .sort((a, b) => score(b) - score(a))
            .slice(0, MAX_FEATURED)
            .map(toCard);
    }, [nfts]);

    const count = featured.length;
    const current = count ? featured[index % count] : PLACEHOLDER;

    useEffect(() => {
        if (count < 2 || paused) return;
        const id = setInterval(() => setIndex((i) => (i + 1) % count), CYCLE_MS);
        return () => clearInterval(id);
    }, [count, paused]);

    const minted = useCountUp(stats.totalNfts);
    const volume = useCountUp(Number(formatEther(stats.volume)));
    const listed = useCountUp(stats.listed);

    return (
        <section className="flex flex-col lg:flex-row justify-between py-12 lg:py-20 gap-10 lg:gap-8">
            <div className="flex flex-col lg:w-[48%] justify-center">
                <div className="flex flex-col gap-6">
                    <span className="page-enter inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-[#CCCCCC]">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        Live on Sepolia testnet
                    </span>
                    <h1
                        className="page-enter text-5xl sm:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-[1.05] tracking-tight"
                        style={{animationDelay: "60ms"}}
                    >
                        Discover digital art & <span className="text-gradient">Collect NFTs</span>
                    </h1>
                    <p
                        className="page-enter text-lg lg:text-xl text-[#CCCCCC] max-w-xl"
                        style={{animationDelay: "120ms"}}
                    >
                        Mint, buy, sell and auction NFTs on the KSEA Marketplace — every trade settles on-chain.
                    </p>
                    <div className="page-enter flex gap-4 flex-wrap" style={{animationDelay: "180ms"}}>
                        <Link to="/marketplace" className="gradient-button px-10 py-4 font-bold">
                            <i className="fa-solid fa-rocket mr-3"></i>Explore Now
                        </Link>
                        <Link
                            to="/create"
                            className="base-button bg-transparent border-2 border-blue-500 px-10 py-4 hover:bg-blue-500/10"
                        >
                            <i className="fa-solid fa-plus mr-3 text-blue-500"></i>Create NFT
                        </Link>
                    </div>
                    <ul
                        className="page-enter grid grid-cols-3 gap-4 mt-4 pt-6 border-t border-white/10"
                        style={{animationDelay: "240ms"}}
                    >
                        <HeroStat loading={loading} value={Math.round(minted)} label="NFTs Minted" />
                        <HeroStat
                            loading={loading}
                            value={`${volume.toLocaleString("en-US", {maximumFractionDigits: 3})} ETH`}
                            label="Total Volume"
                        />
                        <HeroStat loading={loading} value={Math.round(listed)} label="Listed Now" />
                    </ul>
                </div>
            </div>

            <div className="lg:w-[48%] flex flex-col page-enter" style={{animationDelay: "150ms"}}>
                <div className="h-[420px] sm:h-[500px] lg:h-[560px]">
                    <HeroCard card={current} onHoverChange={setPaused} />
                </div>
                <div className="flex flex-col items-center gap-3 mt-2">
                    {count > 1 && (
                        <div className="flex gap-2" role="tablist" aria-label="Featured NFTs">
                            {featured.map((c, i) => (
                                <button
                                    key={c.key}
                                    onClick={() => setIndex(i)}
                                    aria-label={`Show ${c.name}`}
                                    aria-selected={i === index % count}
                                    role="tab"
                                    className={`h-1.5 rounded-full custom-transition ${
                                        i === index % count ? "w-8 bg-blue-400" : "w-3 bg-white/20 hover:bg-white/40"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                    <p className="text-sm text-[#858584] text-center">
                        {current.key === "placeholder" ? (
                            loading ? (
                                "Loading featured NFTs…"
                            ) : (
                                <>
                                    No NFTs yet —{" "}
                                    <Link to="/create" className="!text-blue-400 hover:underline">
                                        mint the first one
                                    </Link>
                                </>
                            )
                        ) : (
                            <>
                                Featured:{" "}
                                <Link to={current.path} className="!text-white font-bold hover:underline">
                                    {current.name}
                                </Link>
                                <span className="hidden sm:inline"> · click the card to flip</span>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </section>
    );
}
