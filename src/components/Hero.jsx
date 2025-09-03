import HeroCard from "./HeroCard";

export default function Hero() {
    return (
        <div className="flex justify-between items-stretch mt-14 gap-8 min-h-[600px]">
            <div className="flex flex-col w-[48%] gap-5 justify-between">
                <div className="flex flex-col gap-5">
                    <h1 className="text-8xl font-bold">
                        Discover digital art & Collect NFTs
                    </h1>
                    <p className="text-2xl">
                        NFT marketplace UI created with Anima for Figma.
                        Collect, buy and sell art from more than 20k NFT
                        artists.
                    </p>
                    <button className="gradient-button w-[40%] ">
                        Explore Now
                    </button>
                </div>
                <ul className="flex-center-between text-xl">
                    <li className="flex flex-col">
                        <strong className="text-3xl font-mono">240k+</strong>{" "}
                        Total Sales
                    </li>
                    <li className="flex flex-col">
                        <strong className="text-3xl font-mono">10k+</strong>{" "}
                        Active Users
                    </li>
                    <li className="flex flex-col">
                        <strong className="text-3xl font-mono">5k+</strong>{" "}
                        Daily Transactions
                    </li>
                </ul>
            </div>
            <div className="w-[48%] flex">
                <HeroCard />
            </div>
        </div>
    );
}
