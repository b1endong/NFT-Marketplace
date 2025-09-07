export default function Navbar() {
    return (
        <nav className="flex-center-between py-5 px-12">
            <div className="flex items-center ">
                <i className="fa-solid fa-shop mr-3 text-blue-400"></i>
                <h1 className="space-mono-bold text-blue-400 text-2xl">
                    KSEA Marketplace
                </h1>
            </div>
            <ul className="flex items-center gap-15">
                <li>
                    <a href="">Marketplace</a>
                </li>
                <li>
                    <a href="">Rankings</a>
                </li>
                <li>
                    <a href="">Auction</a>
                </li>
                <button className="base-button p-4  flex items-center">
                    <i className="fa-solid fa-wallet mr-3"></i>Connect Wallet
                </button>
            </ul>
        </nav>
    );
}
