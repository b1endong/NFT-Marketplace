import {useMemo, useState} from "react";
import {Link, Navigate, useParams} from "react-router-dom";
import {getAddress, isAddress} from "ethers";
import UserInfo from "../components/UserProfileComponents/UserInfo";
import NftGrid from "../components/NftGrid";
import {addressGradient, formatEth, sameAddress} from "../lib/format";
import {EmptyState, Spinner} from "../components/common/States";
import {useMarket} from "../context/MarketContext";
import {useWallet} from "../context/WalletContext";
import {useTransaction} from "../hooks/useTransaction";
import {getContracts} from "../lib/chain";

const TABS = [
    {id: "owned", label: "Owned"},
    {id: "created", label: "Created"},
    {id: "onSale", label: "On Sale"},
];

function RefundsPanel() {
    const {refunds, items, nfts} = useMarket();
    const {run, pending} = useTransaction();
    const entries = Object.entries(refunds);
    if (!entries.length) return null;

    return (
        <div className="bg-[#3B3B3B] rounded-2xl p-6 mt-10 border border-yellow-500/50">
            <h3 className="text-xl font-bold">
                <i className="fa-solid fa-rotate-left text-yellow-400 mr-2"></i>Refundable Bids
            </h3>
            <p className="text-[#CCCCCC] mt-1">You were outbid in these auctions. Withdraw your ETH back to your wallet.</p>
            <ul className="flex flex-col gap-3 mt-4">
                {entries.map(([itemId, amount]) => {
                    const item = items.find((i) => i.itemId === Number(itemId));
                    const nft = item && nfts.find((n) => n.history.some((h) => h.itemId === item.itemId));
                    return (
                        <li key={itemId} className="flex-center-between gap-4 flex-wrap bg-[#2B2B2B] rounded-xl px-4 py-3">
                            <span>
                                {nft ? (
                                    <Link to={nft.path} className="font-bold hover:underline">
                                        {nft.name}
                                    </Link>
                                ) : (
                                    `Listing #${itemId}`
                                )}
                                <span className="font-mono ml-3">{formatEth(amount)} ETH</span>
                            </span>
                            <button
                                className="base-button px-6 py-2"
                                disabled={pending}
                                onClick={() =>
                                    run("Withdraw refund", [
                                        {label: "Withdraw refund", send: (signer) => getContracts(signer).auction.refundBid(itemId)},
                                    ])
                                }
                            >
                                Withdraw
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function AdminPanel() {
    const {config} = useMarket();
    const {run, pending} = useTransaction();
    return (
        <div className="bg-[#3B3B3B] rounded-2xl p-6 mt-10 border border-blue-500/50 flex-center-between gap-4 flex-wrap">
            <div>
                <h3 className="text-xl font-bold">
                    <i className="fa-solid fa-crown text-yellow-400 mr-2"></i>Marketplace Admin
                </h3>
                <p className="text-[#CCCCCC] mt-1">
                    Accumulated fees: <strong className="font-mono">{formatEth(config.pendingWithdrawals, 6)} ETH</strong> ·
                    Listing fee {formatEth(config.listingPrice)} ETH · Sale fee {config.feePercentage.toString()}%
                </p>
            </div>
            <button
                className="gradient-button px-8"
                disabled={pending || config.pendingWithdrawals === 0n}
                onClick={() =>
                    run("Withdraw fees", [{label: "Withdraw fees", send: (signer) => getContracts(signer).marketplace.withdraw()}])
                }
            >
                {pending && <Spinner className="mr-2" />}Withdraw Fees
            </button>
        </div>
    );
}

export default function UserProfile() {
    const {address: param} = useParams();
    const {account, connect} = useWallet();
    const {nfts, stats, config} = useMarket();
    const [activeTab, setActiveTab] = useState("owned");

    const address = param && isAddress(param) ? getAddress(param) : null;
    const isMe = sameAddress(address, account);

    const lists = useMemo(() => {
        if (!address) return {owned: [], created: [], onSale: []};
        return {
            owned: nfts.filter((n) => sameAddress(n.owner, address)),
            created: nfts.filter((n) => sameAddress(n.creator, address)),
            onSale: nfts.filter((n) => n.listing && sameAddress(n.listing.seller, address)),
        };
    }, [nfts, address]);

    const userStats = useMemo(() => {
        let sold = 0;
        let volume = 0n;
        for (const n of lists.created) {
            for (const item of n.history) {
                if (item.isSold) {
                    sold += 1;
                    volume += stats.salePrice(item);
                }
            }
        }
        return {sold, volume, created: lists.created.length, owned: lists.owned.length};
    }, [lists, stats]);

    // /profile không có địa chỉ -> chuyển tới ví đang kết nối
    if (!param) {
        if (account) return <Navigate to={`/profile/${account}`} replace />;
        return (
            <div className="max-w-calc m-auto py-16">
                <EmptyState icon="fa-solid fa-wallet" title="Connect your wallet to see your profile">
                    <button className="base-button px-8 mt-4" onClick={() => connect().catch(() => {})}>
                        Connect Wallet
                    </button>
                </EmptyState>
            </div>
        );
    }

    if (!address) {
        return (
            <div className="max-w-calc m-auto py-16">
                <EmptyState icon="fa-solid fa-circle-question" title="Invalid address" />
            </div>
        );
    }

    const emptyTexts = {
        owned: isMe ? (
            <>
                You don't own any NFTs yet. <Link to="/marketplace" className="underline">Browse the marketplace</Link> or{" "}
                <Link to="/create" className="underline">create one</Link>.
            </>
        ) : null,
        created: isMe ? (
            <Link to="/create" className="underline">
                Create your first NFT
            </Link>
        ) : null,
        onSale: isMe ? "Open one of your NFTs and click “List for Sale”." : null,
    };

    return (
        <>
            <div className="w-full h-[240px] lg:h-[320px] relative">
                <img src="/background.jpg" alt="" className="w-full h-full object-cover" />
                <div className="custom-background-color w-full h-full absolute top-0 left-0 opacity-50"></div>
                <div className="max-w-calc w-full m-auto absolute -bottom-16 left-0 right-0">
                    <div
                        className="w-32 h-32 rounded-2xl border-4 border-[#2B2B2B]"
                        style={{background: addressGradient(address)}}
                    />
                </div>
            </div>
            <div className="max-w-calc m-auto mt-24 relative">
                <UserInfo address={address} isMe={isMe} stats={userStats} />
                {isMe && <RefundsPanel />}
                {isMe && config && sameAddress(config.owner, account) && <AdminPanel />}
                <div className="flex-center-between mt-10">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            className={`font-bold text-lg sm:text-xl w-full py-4 border-b-2 custom-transition ${
                                activeTab === t.id
                                    ? "border-blue-500 text-white"
                                    : "border-transparent !text-[#858584] hover:border-blue-500"
                            }`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            {t.label}
                            <span className="ml-3 text-sm bg-[#3B3B3B] rounded-xl px-2 py-0.5 font-mono">
                                {lists[t.id].length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="py-16 bg-[#3B3B3B] border-b-2 border-[#2B2B2B]">
                <div className="max-w-calc m-auto">
                    <NftGrid
                        nfts={lists[activeTab]}
                        type="userProfile"
                        emptyTitle="No NFTs here"
                        emptyText={emptyTexts[activeTab]}
                    />
                </div>
            </div>
        </>
    );
}
