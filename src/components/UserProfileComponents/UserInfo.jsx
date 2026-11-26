import {useToast} from "../../context/ToastContext";
import {explorerAddress, formatEth, shortAddress} from "../../lib/format";

export default function UserInfo({address, isMe, stats}) {
    const toast = useToast();

    const copy = () => {
        navigator.clipboard?.writeText(address);
        toast.push({type: "success", title: "Address copied", message: address});
    };

    return (
        <div className="flex flex-col lg:flex-row lg:justify-between gap-8">
            <div className="flex flex-col gap-7">
                <div>
                    <h1 className="text-3xl font-bold font-mono break-all">
                        {isMe ? "My Profile" : shortAddress(address, 6)}
                    </h1>
                    {isMe && <p className="text-[#858584] font-mono mt-1 break-all">{address}</p>}
                </div>
                <ul className="flex gap-10 flex-wrap">
                    <li>
                        <strong className="text-xl font-mono">{stats.volume === null ? "-" : `${formatEth(stats.volume)} ETH`}</strong>
                        <p className="text-[#CCCCCC]">Volume</p>
                    </li>
                    <li>
                        <strong className="text-xl font-mono">{stats.sold}</strong>
                        <p className="text-[#CCCCCC]">NFTs Sold</p>
                    </li>
                    <li>
                        <strong className="text-xl font-mono">{stats.created}</strong>
                        <p className="text-[#CCCCCC]">Created</p>
                    </li>
                    <li>
                        <strong className="text-xl font-mono">{stats.owned}</strong>
                        <p className="text-[#CCCCCC]">Owned</p>
                    </li>
                </ul>
                <div>
                    <p className="space-mono-bold text-[#858584]">Network</p>
                    <p>Sepolia Testnet</p>
                </div>
            </div>
            <div className="flex gap-4 flex-wrap items-start">
                <button className="flex-center base-button px-8 gap-2" onClick={copy}>
                    <i className="fa-regular fa-copy"></i>
                    <span className="font-mono">{shortAddress(address)}</span>
                </button>
                <a
                    href={explorerAddress(address)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-center base-button bg-transparent px-8 border-2 border-blue-500 gap-2"
                >
                    <i className="fa-solid fa-arrow-up-right-from-square text-blue-500"></i>
                    <span>Etherscan</span>
                </a>
            </div>
        </div>
    );
}
