import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {parseEther} from "ethers";
import NftImage from "../components/common/NftImage";
import {Spinner} from "../components/common/States";
import {inputClass} from "../lib/styles";
import CATEGORIES from "../config/categories";
import {ADDRESSES, CHAIN} from "../config/contracts";
import {useWallet} from "../context/WalletContext";
import {useMarket} from "../context/MarketContext";
import {useToast} from "../context/ToastContext";
import {useTransaction} from "../hooks/useTransaction";
import {getContracts} from "../lib/chain";
import {canUploadToIpfs, metadataToDataUri, uploadFileToIpfs, uploadJsonToIpfs} from "../lib/ipfs";
import {parseError} from "../lib/errors";
import {formatEth, sameAddress} from "../lib/format";

const MAX_FILE_MB = 20;

function tokenIdFromReceipt(receipt) {
    const {nft} = getContracts();
    for (const log of receipt.logs) {
        if (!sameAddress(log.address, ADDRESSES.nft)) continue;
        try {
            const parsed = nft.interface.parseLog(log);
            if (parsed?.name === "Transfer") return parsed.args.tokenId;
        } catch {
            /* bỏ qua */
        }
    }
    return null;
}

export default function CreateNft() {
    const {account, connect} = useWallet();
    const {config} = useMarket();
    const toast = useToast();
    const {run, pending} = useTransaction();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [imageUrl, setImageUrl] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0].name);
    const [props, setProps] = useState([]);
    const [listNow, setListNow] = useState(false);
    const [price, setPrice] = useState("");
    const [uploading, setUploading] = useState(false);
    const [formError, setFormError] = useState("");

    const preview = useMemo(() => (file ? URL.createObjectURL(file) : imageUrl.trim()), [file, imageUrl]);
    useEffect(() => {
        if (!file) return;
        return () => URL.revokeObjectURL(preview);
    }, [file, preview]);

    const busy = uploading || pending;

    const onFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > MAX_FILE_MB * 1024 * 1024) {
            setFormError(`File is larger than ${MAX_FILE_MB}MB.`);
            return;
        }
        setFormError("");
        setFile(f);
    };

    const submit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!name.trim()) return setFormError("Name is required.");
        if (!file && !imageUrl.trim()) return setFormError("Please add an image.");
        let priceWei = 0n;
        if (listNow) {
            try {
                priceWei = parseEther(price || "0");
            } catch {
                return setFormError("Invalid price.");
            }
            if (priceWei <= 0n) return setFormError("Price must be greater than 0.");
        }

        let creator = account;
        try {
            if (!creator) {
                await connect();
                const accounts = await window.ethereum?.request({method: "eth_accounts"});
                creator = accounts?.[0];
            }
            if (!creator) return;
        } catch (err) {
            return setFormError(parseError(err));
        }

        // 1. Upload ảnh + metadata
        let tokenURI;
        setUploading(true);
        try {
            const image = file ? await uploadFileToIpfs(file) : imageUrl.trim();
            const metadata = {
                name: name.trim(),
                description: description.trim(),
                image,
                category,
                creator,
                attributes: [
                    {trait_type: "Category", value: category},
                    ...props
                        .filter((p) => p.trait_type.trim() && String(p.value).trim())
                        .map((p) => ({trait_type: p.trait_type.trim(), value: p.value.trim()})),
                ],
            };
            tokenURI = canUploadToIpfs ? await uploadJsonToIpfs(metadata) : metadataToDataUri(metadata);
        } catch (err) {
            toast.push({type: "error", title: "Upload failed", message: parseError(err)});
            return;
        } finally {
            setUploading(false);
        }

        // 2. Mint (+ approve + list nếu chọn)
        const steps = [
            {label: "Mint NFT", send: (signer) => getContracts(signer).nft.createToken(tokenURI)},
        ];
        const getTokenId = (ctx) => {
            const id = tokenIdFromReceipt(ctx.receipts[0]);
            if (id === null) throw new Error("Could not read the new token id");
            return id;
        };
        if (listNow) {
            steps.push(
                {
                    label: "Approve marketplace",
                    send: (signer, ctx) => getContracts(signer).nft.approve(ADDRESSES.marketplace, getTokenId(ctx)),
                },
                {
                    label: "List NFT",
                    send: async (signer, ctx) => {
                        const {marketplace} = getContracts(signer);
                        const fee = await marketplace.listingPrice();
                        return marketplace.createMarketItems(ADDRESSES.nft, getTokenId(ctx), priceWei, {value: fee});
                    },
                }
            );
        }

        const receipts = await run(`Create "${name.trim()}"`, steps, {
            successMessage: listNow ? "NFT minted and listed!" : "NFT minted!",
        });
        if (receipts) {
            const tokenId = tokenIdFromReceipt(receipts[0]);
            navigate(tokenId !== null ? `/nft/${ADDRESSES.nft}/${tokenId}` : `/profile/${creator}`);
        }
    };

    return (
        <div className="max-w-calc m-auto py-12 lg:py-16">
            <h1 className="text-4xl lg:text-5xl font-bold">Create New NFT</h1>
            <p className="text-[#CCCCCC] mt-3 text-lg">
                Mint a new KSEA token on {CHAIN.name}. You can list it for sale right away or later from its page.
            </p>

            <form onSubmit={submit} className="grid lg:grid-cols-[1fr_1.2fr] gap-10 mt-10 items-start">
                <div className="flex flex-col gap-4 lg:sticky lg:top-28">
                    <div className="rounded-2xl overflow-hidden border-2 border-dashed border-[#555] aspect-square relative">
                        {preview ? (
                            <NftImage src={preview} alt="Preview" className="w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex-center flex-col gap-3 text-[#858584]">
                                <i className="fa-regular fa-image text-6xl"></i>
                                <p>Image preview</p>
                            </div>
                        )}
                    </div>
                    {canUploadToIpfs ? (
                        <label className="base-button bg-transparent border-2 border-blue-500 text-center cursor-pointer">
                            <i className="fa-solid fa-upload mr-2"></i>
                            {file ? file.name : "Choose image (PNG, JPG, GIF, SVG, WEBP)"}
                            <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
                        </label>
                    ) : null}
                    <div>
                        <label className="text-sm text-[#CCCCCC]">
                            {canUploadToIpfs ? "…or use an image URL" : "Image URL (https:// or ipfs://)"}
                        </label>
                        <input
                            className={`${inputClass} mt-2`}
                            placeholder="https://… or ipfs://…"
                            value={imageUrl}
                            onChange={(e) => {
                                setImageUrl(e.target.value);
                                setFile(null);
                            }}
                            disabled={busy}
                        />
                        {!canUploadToIpfs && (
                            <p className="text-xs text-[#858584] mt-2">
                                Set <code>VITE_PINATA_JWT</code> in <code>.env</code> to upload files to IPFS directly.
                                Without it, metadata is stored on-chain as a data URI.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div>
                        <label className="text-sm text-[#CCCCCC]">Name *</label>
                        <input
                            className={`${inputClass} mt-2`}
                            placeholder="e.g. Space Walking"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                            disabled={busy}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#CCCCCC]">Description</label>
                        <textarea
                            className={`${inputClass} mt-2 min-h-32`}
                            placeholder="Tell the story behind your artwork"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={busy}
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#CCCCCC]">Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                            {CATEGORIES.map((c) => (
                                <button
                                    type="button"
                                    key={c.id}
                                    onClick={() => setCategory(c.name)}
                                    className={`rounded-xl border-2 py-3 px-2 text-sm custom-transition ${
                                        category === c.name ? "border-blue-500 bg-blue-500/10" : "border-[#555]"
                                    }`}
                                    disabled={busy}
                                >
                                    <i className={`${c.icon} mr-2`}></i>
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex-center-between">
                            <label className="text-sm text-[#CCCCCC]">Properties</label>
                            <button
                                type="button"
                                className="text-blue-400 text-sm"
                                onClick={() => setProps((p) => [...p, {trait_type: "", value: ""}])}
                                disabled={busy}
                            >
                                <i className="fa-solid fa-plus mr-1 text-blue-400"></i>Add
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            {props.map((p, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        className={inputClass}
                                        placeholder="Type (e.g. Background)"
                                        value={p.trait_type}
                                        onChange={(e) =>
                                            setProps((list) =>
                                                list.map((x, j) => (j === i ? {...x, trait_type: e.target.value} : x))
                                            )
                                        }
                                        disabled={busy}
                                    />
                                    <input
                                        className={inputClass}
                                        placeholder="Value (e.g. Blue)"
                                        value={p.value}
                                        onChange={(e) =>
                                            setProps((list) =>
                                                list.map((x, j) => (j === i ? {...x, value: e.target.value} : x))
                                            )
                                        }
                                        disabled={busy}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setProps((list) => list.filter((_, j) => j !== i))}
                                        aria-label="Remove property"
                                        className="px-3"
                                    >
                                        <i className="fa-solid fa-trash text-[#858584] hover:text-red-400"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#3B3B3B] rounded-2xl p-5 flex flex-col gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-blue-500"
                                checked={listNow}
                                onChange={(e) => setListNow(e.target.checked)}
                                disabled={busy}
                            />
                            <span className="font-bold">List for sale right after minting</span>
                        </label>
                        {listNow && (
                            <>
                                <input
                                    className={inputClass}
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="Price in ETH, e.g. 0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    disabled={busy}
                                />
                                {config && (
                                    <p className="text-sm text-[#858584]">
                                        Listing fee: {formatEth(config.listingPrice)} ETH · Marketplace fee on sale:{" "}
                                        {config.feePercentage.toString()}%. Want an auction instead? Mint first, then
                                        choose "Timed Auction" on the NFT page.
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {formError && <p className="text-red-400">{formError}</p>}

                    <button type="submit" className="gradient-button py-5 text-lg font-bold" disabled={busy}>
                        {busy && <Spinner className="mr-2" />}
                        {uploading ? "Uploading…" : pending ? "Waiting for transactions…" : listNow ? "Mint & List" : "Mint NFT"}
                    </button>
                </div>
            </form>
        </div>
    );
}
