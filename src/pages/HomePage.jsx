import Navbar from "../components/Navbar";
import Hero from "../components/HomePageComponents/Hero";
import TrendingCollection from "../components/HomePageComponents/TrendingCollection";
import TrendingArtist from "../components/HomePageComponents/TrendingArtist";
import BrowseCategories from "../components/HomePageComponents/Browse Categories";
import MoreNfts from "../components/HomePageComponents/MoreNfts";
import HowItWork from "../components/HomePageComponents/HowItWork";
import SubcribeWidget from "../components/HomePageComponents/SubcribeWidget";

export default function HomePage() {
    return (
        <>
            <Navbar />

            <div className="max-w-calc m-auto">
                <Hero />
                <TrendingCollection />
                <TrendingArtist />
                <BrowseCategories />
                <MoreNfts />
                <HowItWork />
                <SubcribeWidget />
            </div>
        </>
    );
}
