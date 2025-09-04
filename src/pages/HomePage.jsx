import Navbar from "../components/HomePageComponents/Navbar";
import Hero from "../components/HomePageComponents/Hero";
import TrendingCollection from "../components/HomePageComponents/TrendingCollection";
import TrendingArtist from "../components/HomePageComponents/TrendingArtist";

export default function HomePage() {
    return (
        <>
            <Navbar />

            <div className="max-w-calc m-auto">
                <Hero />
                <TrendingCollection />
                <TrendingArtist />
            </div>
        </>
    );
}
