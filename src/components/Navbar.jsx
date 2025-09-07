export default function Navbar() {
    return (
        <nav className="flex-center-between py-5 px-12">
            <div className="flex items-center ">
                <i className="fa-solid fa-shop mr-3 text-blue-400"></i>
                <h1 className="font-mono text-blue-400 text-2xl">
                    KSEA Marketplace
                </h1>
            </div>
            <ul className="flex items-center gap-10">
                <li>Marketplace</li>
                <li>Rankings</li>
                <li>Auction</li>
                <button className="base-button p-4  flex items-center">
                    <i className="fa-solid fa-wallet mr-3"></i>Connect Wallet
                </button>
            </ul>
        </nav>
    );
}
