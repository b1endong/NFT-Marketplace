import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import TrendingCollection from "../components/TrendingCollection";

export default function HomePage() {
    return (
        <>
            <Navbar />

            <div className="max-w-calc m-auto">
                <Hero />
                <TrendingCollection />
            </div>
        </>
    );
}
