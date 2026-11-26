import {useState} from "react";
import {parseEther} from "ethers";
import Modal from "./common/Modal";
import {Spinner} from "./common/States";
import {useMarket} from "../context/MarketContext";
import {useTransaction} from "../hooks/useTransaction";
import {getContracts, getNftContract} from "../lib/chain";
import {ADDRESSES} from "../config/contracts";
import {formatDuration, formatEth, sameAddress} from "../lib/format";
import {inputClass} from "../lib/styles";

// Lấy itemId của listing vừa tạo từ event MarketItemCreated trong receipt.
function itemIdFromReceipt(receipt) {
    const {marketplace} = getContracts();
    for (const log of receipt.logs) {
        if (!sameAddress(log.address, ADDRESSES.marketplace)) continue;
        try {
            const parsed = marketplace.interface.parseLog(log);
            if (parsed?.name === "MarketItemCreated") return parsed.args.itemId;
        } catch {
            /* log khác */
        }
    }
    throw new Error("Could not find the new listing id in the transaction receipt");
}

function createAuctionStep(getItemId, durationSeconds) {
    return {
        label: "Start auction",
        send: (signer, ctx) => {
            const {auction} = getContracts(signer);
            return auction.createAuction(getItemId(ctx), durationSeconds);
        },
    };
}

export function DurationPicker({hours, minutes, setHours, setMinutes, maxDuration}) {
    const maxHours = Math.floor(maxDuration / 3600);
    return (
        <div>
            <label className="text-sm text-[#CCCCCC]">
                Duration (max {formatDuration(maxDuration)})
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
                <select className={inputClass} value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                    {Array.from({length: maxHours + 1}, (_, h) => (
                        <option key={h} value={h} className="bg-[#2B2B2B]">
                            {h} hour{h === 1 ? "" : "s"}
                        </option>
                    ))}
                </select>
                <select className={inputClass} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                    {[0, 5, 10, 15, 30, 45].map((m) => (
                        <option key={m} value={m} className="bg-[#2B2B2B]">
                            {m} minutes
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

/**
 * mode = "list"    : đăng bán NFT đang sở hữu (giá cố định hoặc đấu giá)
 * mode = "auction" : bắt đầu đấu giá cho một listing có sẵn
 */
export default function ListNftModal({open, onClose, nft, mode = "list"}) {
    const {config} = useMarket();
    const {run, pending} = useTransaction();
    const [saleType, setSaleType] = useState(mode === "auction" ? "auction" : "fixed");
    const [price, setPrice] = useState("");
    const [hours, setHours] = useState(1);
    const [minutes, setMinutes] = useState(0);
    const [formError, setFormError] = useState("");

    if (!config || (mode === "auction" && !nft.listing)) return null;
    const maxDuration = config.maxDuration;
    const duration = hours * 3600 + minutes * 60;
    const isAuction = saleType === "auction";

    const submit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (isAuction && (duration <= 0 || duration > maxDuration)) {
            setFormError(`Duration must be between 1 minute and ${formatDuration(maxDuration)}.`);
            return;
        }

        let steps;
        if (mode === "auction") {
            steps = [createAuctionStep(() => nft.listing.itemId, duration)];
        } else {
            let priceWei;
            try {
                priceWei = parseEther(price || "0");
            } catch {
                setFormError("Invalid price.");
                return;
            }
            if (priceWei <= 0n) {
                setFormError("Price must be greater than 0.");
                return;
            }
            steps = [
                {
                    label: "Approve marketplace",
                    send: async (signer) => {
                        const c = getNftContract(nft.contract, signer);
                        const owner = await signer.getAddress();
                        const [approved, approvedAll] = await Promise.all([
                            c.getApproved(nft.tokenId),
                            c.isApprovedForAll(owner, ADDRESSES.marketplace),
                        ]);
                        if (approvedAll || sameAddress(approved, ADDRESSES.marketplace)) return null;
                        return c.approve(ADDRESSES.marketplace, nft.tokenId);
                    },
                },
                {
                    label: "List NFT",
                    send: async (signer) => {
                        const {marketplace} = getContracts(signer);
                        // đọc lại phí listing mới nhất để tránh lỗi MustPayListingFee
                        const fee = await marketplace.listingPrice();
                        return marketplace.createMarketItems(nft.contract, nft.tokenId, priceWei, {value: fee});
                    },
                },
            ];
            if (isAuction) {
                steps.push(createAuctionStep((ctx) => itemIdFromReceipt(ctx.receipts[1]), duration));
            }
        }

        const result = await run(mode === "auction" ? "Start auction" : `List ${nft.name}`, steps, {
            successMessage: isAuction ? "Your auction is live!" : "Your NFT is now listed for sale!",
        });
        if (result) onClose();
    };

    return (
        <Modal open={open} onClose={pending ? undefined : onClose} title={mode === "auction" ? "Start Auction" : "List for Sale"}>
            <form onSubmit={submit} className="flex flex-col gap-5">
                {mode === "list" && (
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {id: "fixed", icon: "fa-tag", label: "Fixed Price"},
                            {id: "auction", icon: "fa-gavel", label: "Timed Auction"},
                        ].map((t) => (
                            <button
                                type="button"
                                key={t.id}
                                onClick={() => setSaleType(t.id)}
                                className={`rounded-2xl border-2 py-4 flex-center flex-col gap-2 custom-transition ${
                                    saleType === t.id ? "border-blue-500 bg-blue-500/10" : "border-[#555]"
                                }`}
                            >
                                <i className={`fa-solid ${t.icon} text-xl`}></i>
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                {mode === "list" && (
                    <div>
                        <label className="text-sm text-[#CCCCCC]">{isAuction ? "Starting bid (ETH)" : "Price (ETH)"}</label>
                        <input
                            className={`${inputClass} mt-2`}
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>
                )}

                {mode === "auction" && (
                    <p className="text-[#CCCCCC]">
                        Starting bid will be your listing price:{" "}
                        <strong className="font-mono">{formatEth(nft.listing.price)} ETH</strong>
                    </p>
                )}

                {isAuction && (
                    <DurationPicker
                        hours={hours}
                        minutes={minutes}
                        setHours={setHours}
                        setMinutes={setMinutes}
                        maxDuration={maxDuration}
                    />
                )}

                <div className="bg-[#2B2B2B] rounded-2xl p-4 text-sm flex flex-col gap-2">
                    {mode === "list" && (
                        <div className="flex-center-between">
                            <span className="text-[#858584]">Listing fee (paid now)</span>
                            <span className="font-mono">{formatEth(config.listingPrice)} ETH</span>
                        </div>
                    )}
                    <div className="flex-center-between">
                        <span className="text-[#858584]">Marketplace fee on sale</span>
                        <span className="font-mono">{config.feePercentage.toString()}%</span>
                    </div>
                    {mode === "list" && !isAuction && price > 0 && (
                        <div className="flex-center-between">
                            <span className="text-[#858584]">You receive</span>
                            <span className="font-mono">
                                {(Number(price) * (1 - Number(config.feePercentage) / 100)).toLocaleString("en-US", {
                                    maximumFractionDigits: 6,
                                })}{" "}
                                ETH
                            </span>
                        </div>
                    )}
                    {isAuction && (
                        <p className="text-[#858584]">
                            While the auction runs the fixed-price buy button is hidden. Once time is up anyone can
                            settle it: the NFT goes to the highest bidder and you receive the payment.
                        </p>
                    )}
                </div>

                {formError && <p className="text-red-400">{formError}</p>}

                <button type="submit" className="gradient-button py-4 font-bold" disabled={pending}>
                    {pending ? <Spinner className="mr-2" /> : null}
                    {mode === "auction" ? "Start Auction" : isAuction ? "List & Start Auction" : "Complete Listing"}
                </button>
            </form>
        </Modal>
    );
}
