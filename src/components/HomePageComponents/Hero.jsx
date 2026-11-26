import {Link} from "react-router-dom";
import HeroCard from "./HeroCard";
import {useMarket} from "../../context/MarketContext";
import {formatEth} from "../../lib/format";

function HeroStat({value, label, loading}) {
    return (
        <li className="flex flex-col">
            <strong className="text-2xl sm:text-3xl font-mono">{loading ? "…" : value}</strong>
            <span className="text-[#CCCCCC]">{label}</span>
        </li>
    );
}

export default function Hero() {
    const {stats, loading} = useMarket();

    return (
        <div className="flex flex-col lg:flex-row justify-between py-12 lg:py-20 gap-10 lg:gap-8">
            <div className="flex flex-col lg:w-[48%] gap-5 justify-between">
                <div className="flex flex-col gap-6">
                    <h1 className="text-5xl sm:text-6xl xl:text-8xl font-bold">Discover digital art & Collect NFTs</h1>
                    <p className="text-xl lg:text-2xl text-[#CCCCCC]">
                        Mint, buy, sell and auction NFTs on the KSEA Marketplace — fully on-chain on the Sepolia testnet.
                    </p>
                    <div className="flex gap-4 flex-wrap">
                        <Link to="/marketplace" className="gradient-button px-10 py-4 font-bold">
                            <i className="fa-solid fa-rocket mr-3"></i>Explore Now
                        </Link>
                        <Link to="/create" className="base-button bg-transparent border-2 border-blue-500 px-10 py-4">
                            <i className="fa-solid fa-plus mr-3 text-blue-500"></i>Create NFT
                        </Link>
                    </div>
                    <ul className="grid grid-cols-3 gap-4 text-lg mt-4">
                        <HeroStat loading={loading} value={stats.totalNfts} label="NFTs Minted" />
                        <HeroStat loading={loading} value={`${formatEth(stats.volume, 3)} ETH`} label="Total Volume" />
                        <HeroStat loading={loading} value={stats.listed} label="Listed Now" />
                    </ul>
                </div>
            </div>
            <div className="lg:w-[48%] h-80 sm:h-[420px] lg:h-auto lg:max-h-[556px]">
                <HeroCard />
            </div>
        </div>
    );
}
