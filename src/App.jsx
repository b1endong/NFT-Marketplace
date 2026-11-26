import {useEffect} from "react";
import {Route, Routes, useLocation} from "react-router-dom";
import HomePage from "./pages/HomePage";
import Marketplace from "./pages/Marketplace";
import Auctions from "./pages/Auctions";
import Rankings from "./pages/Rankings";
import CreateNft from "./pages/CreateNft";
import NftDetail from "./pages/NftDetail";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import NetworkBanner from "./components/NetworkBanner";

function ScrollToTop() {
    const {pathname} = useLocation();
    useEffect(() => {
        window.scrollTo({top: 0, behavior: "instant"});
    }, [pathname]);
    return null;
}

export default function App() {
    const {pathname} = useLocation();
    return (
        <div className="min-h-screen flex flex-col">
            <ScrollToTop />
            <Navbar />
            <NetworkBanner />
            <main key={pathname} className="flex-1 page-enter">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/auction" element={<Auctions />} />
                    <Route path="/rankings" element={<Rankings />} />
                    <Route path="/create" element={<CreateNft />} />
                    <Route path="/nft/:contract/:tokenId" element={<NftDetail />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/profile/:address" element={<UserProfile />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}
