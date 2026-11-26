import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Avatar} from "../components/common/Address";
import {EmptyState, Spinner} from "../components/common/States";
import {useMarket} from "../context/MarketContext";
import {useWallet} from "../context/WalletContext";
import {useRankings} from "../hooks/useRankings";
import {formatEth, sameAddress, shortAddress} from "../lib/format";

const TABS = [
    {id: "creators", label: "Top Creators"},
    {id: "collectors", label: "Top Collectors"},
];

export default function Rankings() {
    const {loading} = useMarket();
    const {account} = useWallet();
    const {creators, collectors} = useRankings();
    const [tab, setTab] = useState("creators");
    const navigate = useNavigate();
    const rows = tab === "creators" ? creators : collectors;

    const columns =
        tab === "creators"
            ? [
                  {label: "Created", value: (r) => r.created},
                  {label: "Sold", value: (r) => r.sold},
                  {label: "Volume", value: (r) => `${formatEth(r.volume)} ETH`},
              ]
            : [
                  {label: "Owned", value: (r) => r.owned},
                  {label: "Listed", value: (r) => r.listed},
              ];

    return (
        <div>
            <div className="max-w-calc m-auto py-12">
                <h1 className="text-4xl lg:text-5xl font-bold">Top Creators</h1>
                <p className="text-lg text-[#CCCCCC] mt-3">
                    Check out top ranking NFT artists and collectors on the KSEA Marketplace.
                </p>
            </div>
            <div className="border-b-2 border-[#3B3B3B]">
                <div className="max-w-calc m-auto flex">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`font-bold text-lg w-full py-4 border-b-2 custom-transition ${
                                tab === t.id ? "border-blue-500 text-white" : "border-transparent !text-[#858584] hover:border-blue-500"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-calc m-auto py-10">
                <div
                    className="grid gap-4 px-5 py-3 border border-[#3B3B3B] rounded-2xl text-[#858584] space-mono-regular text-sm"
                    style={{gridTemplateColumns: `3rem 1fr repeat(${columns.length}, minmax(4rem, 8rem))`}}
                >
                    <span>#</span>
                    <span>{tab === "creators" ? "Artist" : "Collector"}</span>
                    {columns.map((c) => (
                        <span key={c.label} className="text-right">
                            {c.label}
                        </span>
                    ))}
                </div>
                {loading ? (
                    <div className="flex-center py-16">
                        <Spinner className="text-3xl" />
                    </div>
                ) : rows.length === 0 ? (
                    <EmptyState title="No data yet" icon="fa-solid fa-ranking-star">
                        Creators show up here once NFTs are minted.
                    </EmptyState>
                ) : (
                    <ul className="flex flex-col gap-4 mt-4">
                        {rows.map((r) => (
                            <li
                                key={r.address}
                                onClick={() => navigate(`/profile/${r.address}`)}
                                className="grid gap-4 items-center bg-[#3B3B3B] rounded-2xl px-5 py-4 cursor-pointer hover:bg-[#454545] custom-transition"
                                style={{gridTemplateColumns: `3rem 1fr repeat(${columns.length}, minmax(4rem, 8rem))`}}
                            >
                                <span className="flex-center bg-[#2B2B2B] w-8 h-8 rounded-full text-sm font-mono">{r.rank}</span>
                                <span className="flex items-center gap-3 min-w-0">
                                    <Avatar address={r.address} size={40} />
                                    <span className="font-bold truncate font-mono">
                                        {sameAddress(r.address, account) ? "You" : shortAddress(r.address)}
                                    </span>
                                </span>
                                {columns.map((c) => (
                                    <span key={c.label} className="text-right font-mono">
                                        {c.value(r)}
                                    </span>
                                ))}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
