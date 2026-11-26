import {useState} from "react";
import {Link, useParams} from "react-router-dom";
import {formatEther, parseEther} from "ethers";
import NftImage from "../components/common/NftImage";
import {AddressLink} from "../components/common/Address";
import Countdown, {useNow} from "../components/common/Countdown";
import {EmptyState, ErrorState, Spinner} from "../components/common/States";
import ListNftModal from "../components/ListNftModal";
import {inputClass} from "../lib/styles";
import {useMarket} from "../context/MarketContext";
import {useWallet} from "../context/WalletContext";
import {useTransaction} from "../hooks/useTransaction";
import {getContracts} from "../lib/chain";
import {resolveUri} from "../lib/ipfs";
import {explorerAddress, formatEth, sameAddress, shortAddress, tokenKey, ZERO_ADDRESS} from "../lib/format";
import {ADDRESSES, CHAIN} from "../config/contracts";

function Panel({children, className = ""}) {
    return <div className={`bg-[#3B3B3B] rounded-2xl p-6 ${className}`}>{children}</div>;
}

function Stat({label, children}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm text-[#858584]">{label}</span>
            <span className="text-2xl font-bold font-mono">{children}</span>
        </div>
    );
}

function AuctionPanel({nft, account}) {
    const {run, pending} = useTransaction();
    const {refunds} = useMarket();
    const now = useNow();
    const {auction, listing} = nft;
    const ended = auction.endTime <= now;
    const hasBids = auction.highestBidder !== ZERO_ADDRESS && auction.highestBid > 0n;
    const isSeller = sameAddress(listing.seller, account);
    const isHighest = sameAddress(auction.highestBidder, account);
    const minBid = hasBids ? auction.highestBid : auction.startingBid;
    const [bid, setBid] = useState("");
    const [bidError, setBidError] = useState("");
    const previousRefund = refunds[listing.itemId] || 0n;

    const placeBid = async (e) => {
        e.preventDefault();
        setBidError("");
        let value;
        try {
            value = parseEther(bid || "0");
        } catch {
            setBidError("Invalid amount.");
            return;
        }
        if (hasBids ? value <= auction.highestBid : value < auction.startingBid) {
            setBidError(`Bid must be ${hasBids ? "greater than" : "at least"} ${formatEth(minBid, 6)} ETH.`);
            return;
        }
        const ok = await run(
            "Place bid",
            [
                {
                    label: `Bid ${formatEther(value)} ETH`,
                    send: (signer) => getContracts(signer).auction.placeBid(listing.itemId, {value}),
                },
            ],
            {successMessage: "Your bid was placed!"}
        );
        if (ok) setBid("");
    };

    const settle = () =>
        run("Settle auction", [
            {label: "Settle auction", send: (signer) => getContracts(signer).auction.settleAuction(listing.itemId)},
        ]);

    const cancel = () =>
        run("Cancel auction", [
            {label: "Cancel auction", send: (signer) => getContracts(signer).auction.cancelAuction(listing.itemId)},
        ]);

    return (
        <Panel className="flex flex-col gap-6">
            <div className="flex-center-between flex-wrap gap-4">
                <h3 className="text-xl font-bold">
                    <i className="fa-solid fa-gavel text-yellow-400 mr-3"></i>Timed Auction
                </h3>
                <div className="bg-[#2B2B2B] rounded-xl px-4 py-2">
                    <span className="text-[#858584] mr-2">{ended ? "Status" : "Ends in"}</span>
                    <Countdown endTime={auction.endTime} className="font-bold" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Stat label="Starting bid">{formatEth(auction.startingBid)} ETH</Stat>
                <Stat label="Highest bid">{hasBids ? `${formatEth(auction.highestBid)} ETH` : "—"}</Stat>
            </div>
            {hasBids && (
                <p className="text-[#CCCCCC] flex items-center gap-2 flex-wrap">
                    Highest bidder: <AddressLink address={auction.highestBidder} />
                </p>
            )}
            <p className="text-sm text-[#858584]">Ends at {new Date(auction.endTime * 1000).toLocaleString()}</p>

            {ended ? (
                <div className="flex flex-col gap-3">
                    <p className="text-[#CCCCCC]">
                        {hasBids
                            ? "The auction has ended. Settle it to transfer the NFT to the winner and pay the seller."
                            : "The auction ended without bids. Settling closes it and the NFT stays listed at its fixed price."}
                    </p>
                    <button className="gradient-button py-4 font-bold" onClick={settle} disabled={pending}>
                        {pending && <Spinner className="mr-2" />}Settle Auction
                    </button>
                </div>
            ) : isSeller ? (
                <div className="flex flex-col gap-3">
                    <p className="text-[#CCCCCC]">You are the seller of this auction.</p>
                    {!hasBids && (
                        <button
                            className="base-button bg-transparent border-2 border-red-400 py-4"
                            onClick={cancel}
                            disabled={pending}
                        >
                            Cancel Auction
                        </button>
                    )}
                </div>
            ) : isHighest ? (
                <p className="bg-green-500/10 border border-green-500 rounded-2xl p-4">
                    <i className="fa-solid fa-trophy text-yellow-400 mr-2"></i>You are currently the highest bidder.
                </p>
            ) : (
                <form onSubmit={placeBid} className="flex flex-col gap-3">
                    <div className="flex gap-3 flex-col sm:flex-row">
                        <input
                            className={inputClass}
                            type="number"
                            step="any"
                            min="0"
                            placeholder={`${hasBids ? ">" : "≥"} ${formatEth(minBid, 6)} ETH`}
                            value={bid}
                            onChange={(e) => setBid(e.target.value)}
                            required
                        />
                        <button className="gradient-button px-8 font-bold whitespace-nowrap" disabled={pending}>
                            {pending && <Spinner className="mr-2" />}Place Bid
                        </button>
                    </div>
                    {previousRefund > 0n && (
                        <p className="text-sm text-yellow-300">
                            Note: you were outbid before ({formatEth(previousRefund)} ETH). Per the contract, bidding
                            again adds that amount to your new bid instead of refunding it.
                        </p>
                    )}
                    {bidError && <p className="text-red-400">{bidError}</p>}
                </form>
            )}
        </Panel>
    );
}

function SalePanel({nft, account, onList, onStartAuction}) {
    const {run, pending} = useTransaction();
    const {listing} = nft;
    const isOwner = sameAddress(nft.owner, account);

    if (!listing) {
        return (
            <Panel className="flex flex-col gap-4">
                <p className="text-[#CCCCCC]">This NFT is not listed for sale.</p>
                {isOwner && (
                    <button className="gradient-button py-4 font-bold" onClick={onList}>
                        <i className="fa-solid fa-tag mr-2"></i>List for Sale
                    </button>
                )}
            </Panel>
        );
    }

    const buy = () =>
        run(
            `Buy ${nft.name}`,
            [
                {
                    label: `Pay ${formatEther(listing.price)} ETH`,
                    send: (signer) =>
                        getContracts(signer).marketplace.buyMarketItem(listing.itemId, {value: listing.price}),
                },
            ],
            {successMessage: `You now own ${nft.name}!`}
        );

    const cancel = () =>
        run("Cancel listing", [
            {
                label: "Cancel listing",
                send: (signer) => getContracts(signer).marketplace.cancelListingMarketItem(listing.itemId),
            },
        ]);

    return (
        <Panel className="flex flex-col gap-5">
            <Stat label="Current price">{formatEth(listing.price)} ETH</Stat>
            {isOwner ? (
                <div className="grid sm:grid-cols-2 gap-3">
                    <button className="gradient-button py-4 font-bold" onClick={onStartAuction} disabled={pending}>
                        <i className="fa-solid fa-gavel mr-2"></i>Start Auction
                    </button>
                    <button
                        className="base-button bg-transparent border-2 border-red-400 py-4"
                        onClick={cancel}
                        disabled={pending}
                    >
                        {pending && <Spinner className="mr-2" />}Cancel Listing
                    </button>
                </div>
            ) : (
                <button className="gradient-button py-4 font-bold text-lg" onClick={buy} disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : <i className="fa-solid fa-cart-shopping mr-2"></i>}
                    Buy Now
                </button>
            )}
        </Panel>
    );
}

function RefundPanel({nft}) {
    const {refunds} = useMarket();
    const {run, pending} = useTransaction();
    const entries = nft.history.filter((item) => refunds[item.itemId] > 0n);
    // Khi đấu giá còn chạy và bạn bị vượt giá, vẫn rút được ngay.
    if (!entries.length) return null;
    return (
        <Panel className="flex flex-col gap-3 border border-yellow-500/50">
            <h3 className="font-bold">
                <i className="fa-solid fa-rotate-left text-yellow-400 mr-2"></i>You were outbid
            </h3>
            {entries.map((item) => (
                <div key={item.itemId} className="flex-center-between gap-4 flex-wrap">
                    <span className="font-mono">{formatEth(refunds[item.itemId])} ETH refundable</span>
                    <button
                        className="base-button px-6"
                        disabled={pending}
                        onClick={() =>
                            run("Withdraw refund", [
                                {
                                    label: "Withdraw refund",
                                    send: (signer) => getContracts(signer).auction.refundBid(item.itemId),
                                },
                            ])
                        }
                    >
                        Withdraw
                    </button>
                </div>
            ))}
        </Panel>
    );
}

function History({nft}) {
    const {auctions} = useMarket();
    if (!nft.history.length) return null;
    return (
        <Panel>
            <h3 className="text-xl font-bold mb-4">Marketplace History</h3>
            <ul className="flex flex-col divide-y divide-[#555]">
                {[...nft.history].reverse().map((item) => {
                    const a = auctions[item.itemId];
                    const wonByAuction = item.isSold && a && !a.isActive && sameAddress(a.highestBidder, item.owner);
                    let status;
                    if (item.isSold)
                        status = (
                            <>
                                {wonByAuction ? "Won at auction by" : "Sold to"} <AddressLink address={item.owner} /> for{" "}
                                <strong className="font-mono">{formatEth(wonByAuction ? a.highestBid : item.price)} ETH</strong>
                            </>
                        );
                    else if (item.isCancel)
                        status = (
                            <>
                                Listing cancelled by <AddressLink address={item.owner} />
                            </>
                        );
                    else
                        status = (
                            <>
                                Listed by <AddressLink address={item.seller} /> for{" "}
                                <strong className="font-mono">{formatEth(item.price)} ETH</strong>
                                {a && <span className="text-[#858584]"> · auction {a.isActive ? "running" : "closed"}</span>}
                            </>
                        );
                    return (
                        <li key={item.itemId} className="py-3 flex items-center gap-3 flex-wrap text-[#CCCCCC]">
                            <span className="text-xs bg-[#2B2B2B] rounded-lg px-2 py-1 font-mono">#{item.itemId}</span>
                            {status}
                        </li>
                    );
                })}
            </ul>
        </Panel>
    );
}

export default function NftDetail() {
    const {contract, tokenId} = useParams();
    const {nfts, loading, error, refresh, refreshing} = useMarket();
    const {account} = useWallet();
    const [modal, setModal] = useState(null);

    if (loading) {
        return (
            <div className="max-w-calc m-auto py-16 grid lg:grid-cols-2 gap-10">
                <div className="aspect-square bg-[#3B3B3B] rounded-2xl animate-pulse" />
                <div className="flex flex-col gap-4">
                    <div className="h-12 w-2/3 bg-[#3B3B3B] rounded animate-pulse" />
                    <div className="h-6 w-1/3 bg-[#3B3B3B] rounded animate-pulse" />
                    <div className="h-40 bg-[#3B3B3B] rounded-2xl animate-pulse mt-6" />
                </div>
            </div>
        );
    }

    const nft = nfts.find((n) => n.key === tokenKey(contract || "", tokenId || ""));
    if (!nft) {
        return (
            <div className="max-w-calc m-auto py-16">
                {error ? (
                    <ErrorState message={error} onRetry={refresh} />
                ) : (
                    <EmptyState icon="fa-solid fa-ghost" title="NFT not found">
                        <Link to="/marketplace" className="underline">
                            Back to marketplace
                        </Link>
                    </EmptyState>
                )}
            </div>
        );
    }

    const isKsea = sameAddress(nft.contract, ADDRESSES.nft);

    return (
        <div className="max-w-calc m-auto py-12 lg:py-16">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
                <div className="lg:sticky lg:top-28">
                    <NftImage
                        src={nft.image}
                        alt={nft.name}
                        loading={nft.metaLoading}
                        className="w-full aspect-square rounded-2xl"
                    />
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            {nft.category && (
                                <span className="text-sm bg-[#3B3B3B] rounded-xl px-3 py-1">{nft.category}</span>
                            )}
                            <span className="text-sm text-[#858584] font-mono">
                                {isKsea ? "KSEA" : shortAddress(nft.contract)} #{nft.tokenId}
                            </span>
                            <button className="ml-auto text-[#858584] hover:text-white" onClick={refresh} title="Refresh">
                                <i className={`fa-solid fa-rotate ${refreshing ? "fa-spin" : ""}`}></i>
                            </button>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold break-words">{nft.name}</h1>
                        <div className="flex gap-8 flex-wrap text-[#CCCCCC]">
                            <div className="flex flex-col gap-2">
                                <span className="space-mono-bold text-[#858584] text-sm">Creator</span>
                                <AddressLink address={nft.creator} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="space-mono-bold text-[#858584] text-sm">
                                    {nft.listing ? "Seller" : "Owner"}
                                </span>
                                <AddressLink address={nft.owner} />
                            </div>
                        </div>
                    </div>

                    {nft.auction ? (
                        <AuctionPanel nft={nft} account={account} />
                    ) : (
                        <SalePanel
                            nft={nft}
                            account={account}
                            onList={() => setModal("list")}
                            onStartAuction={() => setModal("auction")}
                        />
                    )}

                    <RefundPanel nft={nft} />

                    {nft.description && (
                        <div>
                            <p className="space-mono-bold text-[#858584] mb-2">Description</p>
                            <p className="text-[#CCCCCC] whitespace-pre-line">{nft.description}</p>
                        </div>
                    )}

                    {nft.attributes.length > 0 && (
                        <div>
                            <p className="space-mono-bold text-[#858584] mb-3">Properties</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {nft.attributes.map((attr, i) => (
                                    <div key={i} className="bg-[#3B3B3B] border border-blue-500/40 rounded-xl p-3 text-center">
                                        <p className="text-xs text-blue-400 uppercase">{attr.trait_type || "Trait"}</p>
                                        <p className="font-bold truncate">{String(attr.value)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="space-mono-bold text-[#858584] mb-3">Details</p>
                        <ul className="flex flex-col gap-2 text-[#CCCCCC]">
                            <li className="flex-center-between gap-4">
                                <span>Contract</span>
                                <a
                                    href={explorerAddress(nft.contract)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono hover:underline"
                                >
                                    {shortAddress(nft.contract)} <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                                </a>
                            </li>
                            <li className="flex-center-between gap-4">
                                <span>Token ID</span>
                                <span className="font-mono">{nft.tokenId}</span>
                            </li>
                            <li className="flex-center-between gap-4">
                                <span>Standard</span>
                                <span>ERC-721</span>
                            </li>
                            <li className="flex-center-between gap-4">
                                <span>Chain</span>
                                <span>{CHAIN.name}</span>
                            </li>
                            {nft.tokenURI && !nft.tokenURI.startsWith("data:") && (
                                <li className="flex-center-between gap-4">
                                    <span>Metadata</span>
                                    <a href={resolveUri(nft.tokenURI)} target="_blank" rel="noreferrer" className="hover:underline">
                                        View <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                                    </a>
                                </li>
                            )}
                        </ul>
                        {!nft.metaLoading && !nft.metadata && nft.tokenURI && (
                            <p className="text-sm text-yellow-300 mt-3">
                                Metadata could not be loaded from IPFS (it may no longer be pinned).
                            </p>
                        )}
                    </div>

                    <History nft={nft} />
                </div>
            </div>

            <ListNftModal
                key={`${modal}-${nft.key}`}
                open={Boolean(modal)}
                mode={modal || "list"}
                nft={nft}
                onClose={() => setModal(null)}
            />
        </div>
    );
}
