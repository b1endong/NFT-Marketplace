import HomePage from "./pages/HomePage";
import UserProfile from "./pages/UserProfile";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
export default function App() {
    return (
        <>
            <Navbar />
            {/* <HomePage /> */}
            <UserProfile />
            <Footer />
        </>
    );
}
