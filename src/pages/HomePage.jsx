import Hero from "../components/HomePageComponents/Hero";
import LiveAuctions from "../components/HomePageComponents/LiveAuctions";
import TrendingArtist from "../components/HomePageComponents/TrendingArtist";
import BrowseCategories from "../components/HomePageComponents/Browse Categories";
import MoreNfts from "../components/HomePageComponents/MoreNfts";
import HowItWork from "../components/HomePageComponents/HowItWork";
import SubcribeWidget from "../components/HomePageComponents/SubcribeWidget";
import {ErrorState} from "../components/common/States";
import {useMarket} from "../context/MarketContext";

export default function HomePage() {
    const {error, refresh} = useMarket();
    return (
        <div className="max-w-calc m-auto">
            <Hero />
            {error && <ErrorState message={error} onRetry={refresh} />}
            <LiveAuctions />
            <MoreNfts />
            <TrendingArtist />
            <BrowseCategories />
            <HowItWork />
            <SubcribeWidget />
        </div>
    );
}
