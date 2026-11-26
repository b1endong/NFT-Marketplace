import {useEffect, useRef, useState} from "react";
import {Link, NavLink, useLocation} from "react-router-dom";
import {useWallet} from "../context/WalletContext";
import {useToast} from "../context/ToastContext";
import {Avatar} from "./common/Address";
import {Spinner} from "./common/States";
import {parseError} from "../lib/errors";
import {shortAddress} from "../lib/format";
import {CHAIN} from "../config/contracts";

const LINKS = [
    {to: "/marketplace", label: "Marketplace"},
    {to: "/auction", label: "Auction"},
    {to: "/rankings", label: "Rankings"},
    {to: "/create", label: "Create"},
];

function WalletButton() {
    const {account, isCorrectChain, connecting, connect, disconnect, switchChain, hasWallet} = useWallet();
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const safe = (fn) => async () => {
        try {
            await fn();
        } catch (err) {
            toast.push({type: "error", title: "Wallet error", message: parseError(err)});
        }
    };

    if (!account) {
        return (
            <button className="base-button px-5 flex items-center whitespace-nowrap" onClick={safe(connect)}>
                {connecting ? <Spinner className="mr-3" /> : <i className="fa-solid fa-wallet mr-3"></i>}
                {hasWallet ? "Connect Wallet" : "Install MetaMask"}
            </button>
        );
    }

    if (!isCorrectChain) {
        return (
            <button className="base-button bg-red-500 px-5 whitespace-nowrap" onClick={safe(switchChain)}>
                <i className="fa-solid fa-triangle-exclamation mr-3"></i>Switch to {CHAIN.name}
            </button>
        );
    }

    return (
        <div className="relative" ref={ref}>
            <button
                className="flex items-center gap-3 bg-[#3B3B3B] hover:bg-[#4a4a4a] custom-transition rounded-2xl px-4 py-3"
                onClick={() => setOpen((o) => !o)}
            >
                <Avatar address={account} />
                <span className="font-mono">{shortAddress(account)}</span>
                <i className="fa-solid fa-chevron-down text-xs"></i>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 bg-[#3B3B3B] border border-[#555] rounded-2xl overflow-hidden shadow-2xl z-40">
                    <Link
                        to={`/profile/${account}`}
                        className="block px-5 py-3 hover:bg-[#4a4a4a]"
                        onClick={() => setOpen(false)}
                    >
                        <i className="fa-regular fa-user mr-3"></i>My Profile
                    </Link>
                    <Link to="/create" className="block px-5 py-3 hover:bg-[#4a4a4a]" onClick={() => setOpen(false)}>
                        <i className="fa-solid fa-plus mr-3"></i>Create NFT
                    </Link>
                    <button
                        className="w-full text-left px-5 py-3 hover:bg-[#4a4a4a]"
                        onClick={() => {
                            navigator.clipboard?.writeText(account);
                            toast.push({type: "success", title: "Address copied"});
                            setOpen(false);
                        }}
                    >
                        <i className="fa-regular fa-copy mr-3"></i>Copy Address
                    </button>
                    <button
                        className="w-full text-left px-5 py-3 hover:bg-[#4a4a4a] border-t border-[#555]"
                        onClick={() => {
                            disconnect();
                            setOpen(false);
                        }}
                    >
                        <i className="fa-solid fa-right-from-bracket mr-3"></i>Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    // đóng menu mobile khi chuyển trang
    const [lastPath, setLastPath] = useState(location.pathname);
    if (lastPath !== location.pathname) {
        setLastPath(location.pathname);
        setMenuOpen(false);
    }

    const linkClass = ({isActive}) =>
        `custom-transition hover:text-blue-400 ${isActive ? "!text-blue-400 font-bold" : ""}`;

    return (
        <nav className="sticky top-0 z-30 bg-[#2B2B2B]/95 backdrop-blur border-b border-[#3B3B3B]">
            <div className="flex-center-between py-4 px-4 sm:px-8 lg:px-12 gap-4">
                <Link to="/" className="flex items-center shrink-0">
                    <i className="fa-solid fa-shop mr-3 text-blue-400"></i>
                    <h1 className="space-mono-bold text-blue-400 text-xl sm:text-2xl">KSEA Marketplace</h1>
                </Link>
                <ul className="hidden lg:flex items-center gap-10">
                    {LINKS.map((l) => (
                        <li key={l.to}>
                            <NavLink to={l.to} className={linkClass}>
                                {l.label}
                            </NavLink>
                        </li>
                    ))}
                    <WalletButton />
                </ul>
                <button className="lg:hidden text-2xl" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
                    <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`}></i>
                </button>
            </div>
            {menuOpen && (
                <ul className="lg:hidden flex flex-col gap-5 px-4 sm:px-8 pb-6">
                    {LINKS.map((l) => (
                        <li key={l.to}>
                            <NavLink to={l.to} className={linkClass}>
                                {l.label}
                            </NavLink>
                        </li>
                    ))}
                    <li>
                        <WalletButton />
                    </li>
                </ul>
            )}
        </nav>
    );
}
