import {useMemo} from "react";
import {useSearchParams} from "react-router-dom";
import NftGrid from "../components/NftGrid";
import {inputClass} from "../lib/styles";
import {useMarket} from "../context/MarketContext";
import CATEGORIES from "../config/categories";

const TABS = [
    {id: "listed", label: "On Sale", filter: (n) => n.listing},
    {id: "fixed", label: "Fixed Price", filter: (n) => n.listing && !n.auction},
    {id: "auction", label: "Auctions", filter: (n) => n.auction},
    {id: "all", label: "All NFTs", filter: () => true},
];

const SORTS = {
    newest: {label: "Recently listed", fn: (a, b) => sortKey(b) - sortKey(a)},
    priceAsc: {label: "Price: low to high", fn: (a, b) => cmp(priceOf(a), priceOf(b))},
    priceDesc: {label: "Price: high to low", fn: (a, b) => cmp(priceOf(b), priceOf(a))},
};

function sortKey(n) {
    return n.listing ? n.listing.itemId * 1e6 : Number(n.tokenId);
}
function priceOf(n) {
    if (n.auction) return n.auction.highestBid > 0n ? n.auction.highestBid : n.auction.startingBid;
    if (n.listing) return n.listing.price;
    return -1n;
}
function cmp(a, b) {
    return a === b ? 0 : a < b ? -1 : 1;
}

export default function Marketplace() {
    const {nfts, refresh, refreshing} = useMarket();
    const [params, setParams] = useSearchParams();
    const tab = params.get("tab") || "listed";
    const category = params.get("category") || "";
    const query = params.get("q") || "";
    const sort = params.get("sort") || "newest";

    const setParam = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next, {replace: true});
    };

    const filtered = useMemo(() => {
        const tabFilter = (TABS.find((t) => t.id === tab) || TABS[0]).filter;
        const q = query.trim().toLowerCase();
        return nfts
            .filter(tabFilter)
            .filter((n) => !category || n.category === category)
            .filter(
                (n) =>
                    !q ||
                    n.name.toLowerCase().includes(q) ||
                    n.description.toLowerCase().includes(q) ||
                    n.tokenId === q.replace("#", "")
            )
            .sort((SORTS[sort] || SORTS.newest).fn);
    }, [nfts, tab, category, query, sort]);

    return (
        <div>
            <div className="max-w-calc m-auto py-12">
                <div className="flex-center-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold">Browse Marketplace</h1>
                        <p className="text-lg text-[#CCCCCC] mt-3">Browse, buy and bid on NFTs from KSEA creators.</p>
                    </div>
                    <button className="text-[#858584] hover:text-white" onClick={refresh} title="Refresh">
                        <i className={`fa-solid fa-rotate mr-2 ${refreshing ? "fa-spin" : ""}`}></i>Refresh
                    </button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-8">
                    <div className="relative flex-1">
                        <input
                            className={`${inputClass} pr-12`}
                            placeholder="Search by name, description or token id"
                            value={query}
                            onChange={(e) => setParam("q", e.target.value)}
                        />
                        <i className="fa-solid fa-magnifying-glass absolute right-5 top-1/2 -translate-y-1/2 text-[#858584]"></i>
                    </div>
                    <select className={`${inputClass} md:w-56`} value={category} onChange={(e) => setParam("category", e.target.value)}>
                        <option value="" className="bg-[#2B2B2B]">All categories</option>
                        {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.name} className="bg-[#2B2B2B]">
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <select className={`${inputClass} md:w-56`} value={sort} onChange={(e) => setParam("sort", e.target.value)}>
                        {Object.entries(SORTS).map(([id, s]) => (
                            <option key={id} value={id} className="bg-[#2B2B2B]">
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="border-b-2 border-[#3B3B3B]">
                <div className="max-w-calc m-auto flex overflow-x-auto scrollbar-hide">
                    {TABS.map((t) => {
                        const count = nfts.filter(t.filter).length;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setParam("tab", t.id === "listed" ? "" : t.id)}
                                className={`font-bold text-lg w-full py-4 whitespace-nowrap px-4 border-b-2 custom-transition ${
                                    tab === t.id ? "border-blue-500 text-white" : "border-transparent !text-[#858584] hover:border-blue-500"
                                }`}
                            >
                                {t.label}
                                <span className="ml-3 text-sm bg-[#3B3B3B] rounded-xl px-2 py-0.5 font-mono">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="py-16 bg-[#3B3B3B]/40">
                <div className="max-w-calc m-auto">
                    <NftGrid
                        nfts={filtered}
                        emptyTitle={query || category ? "No NFTs match your filters" : "Nothing here yet"}
                        emptyText={tab !== "all" ? "Try the “All NFTs” tab or create and list your own NFT." : null}
                    />
                </div>
            </div>
        </div>
    );
}
