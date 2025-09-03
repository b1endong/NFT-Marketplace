import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

export default function HomePage() {
    return (
        <>
            <Navbar />

            <div className="max-w-calc m-auto">
                <Hero />
            </div>
        </>
    );
}
