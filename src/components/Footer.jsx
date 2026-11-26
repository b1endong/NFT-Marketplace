import {Link} from "react-router-dom";
import SubscribeButton from "./SubscribeButton";
import {ADDRESSES} from "../config/contracts";
import {explorerAddress, shortAddress} from "../lib/format";

export default function Footer() {
    return (
        <footer className="bg-[#3B3B3B] mt-10">
            <div className="grid gap-10 md:grid-cols-3 pt-10 footer-content relative px-6 sm:px-12 lg:px-30">
                <div className="flex flex-col gap-7">
                    <div className="flex items-center ">
                        <i className="fa-solid fa-shop mr-3 text-blue-400"></i>
                        <h1 className="space-mono-bold text-blue-400 text-2xl">KSEA Marketplace</h1>
                    </div>
                    <p className="text-[#CCCCCC]">
                        Decentralized NFT marketplace <br />
                        running on the Sepolia testnet.
                    </p>
                    <ul className="flex flex-col gap-1 text-sm text-[#CCCCCC] font-mono">
                        {Object.entries(ADDRESSES).map(([name, address]) => (
                            <li key={name}>
                                <span className="capitalize text-[#858584]">{name}: </span>
                                <a href={explorerAddress(address)} target="_blank" rel="noreferrer" className="hover:underline">
                                    {shortAddress(address, 6)}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex flex-col">
                    <h1 className="space-mono-bold text-blue-400 text-2xl">Explore</h1>
                    <ul className="flex flex-col gap-5 mt-7 ">
                        <li><Link to="/marketplace" className="!text-[#CCCCCC] hover:underline">Marketplace</Link></li>
                        <li><Link to="/auction" className="!text-[#CCCCCC] hover:underline">Auction</Link></li>
                        <li><Link to="/rankings" className="!text-[#CCCCCC] hover:underline">Rankings</Link></li>
                        <li><Link to="/create" className="!text-[#CCCCCC] hover:underline">Create NFT</Link></li>
                    </ul>
                </div>
                <div className="flex flex-col gap-7">
                    <h1 className="space-mono-bold text-blue-400 text-2xl">Join Our Weekly Digest</h1>
                    <p className="text-[#CCCCCC]">Get exclusive promotions & updates straight to your inbox.</p>
                    <SubscribeButton />
                </div>
            </div>
            <p className="text-sm text-[#858584] py-6 mt-8 text-center">
                © {new Date().getFullYear()} KSEA Marketplace. All rights reserved.
            </p>
        </footer>
    );
}
