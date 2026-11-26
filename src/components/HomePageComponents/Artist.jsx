import {Link} from "react-router-dom";
import {Avatar} from "../common/Address";
import {formatEth, shortAddress} from "../../lib/format";

export default function Artist({rank, address, volume, created}) {
    return (
        <Link
            to={`/profile/${address}`}
            className="group flex-center flex-col bg-[#3B3B3B] p-5 rounded-2xl relative ring-1 ring-white/5 transition duration-500 hover:-translate-y-1.5 hover:ring-blue-400/30 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)] cursor-pointer"
        >
            <p className="flex-center bg-[#2B2B2B] w-8 h-8 rounded-full absolute top-4 left-5 text-sm text-white">{rank}</p>
            <Avatar address={address} size={110} className="mt-4 transition-transform duration-500 group-hover:scale-105" />
            <div className="mt-5 flex-center flex-col gap-2 text-center">
                <h3 className="text-xl font-bold font-mono">{shortAddress(address)}</h3>
                <p className=" text-[#858584]">
                    Total Sales: <strong className="font-normal text-white">{formatEth(volume)} ETH</strong>
                </p>
                <p className="text-sm text-[#858584]">{created} NFT{created === 1 ? "" : "s"} created</p>
            </div>
        </Link>
    );
}
