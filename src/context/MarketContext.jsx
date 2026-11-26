import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {getAddress, isAddress} from "ethers";
import {ADDRESSES} from "../config/contracts";
import {enumerateTokens, getContracts, getNftContract, scanMints} from "../lib/chain";
import {fetchMetadata} from "../lib/ipfs";
import {sameAddress, tokenKey, ZERO_ADDRESS} from "../lib/format";
import {useWallet} from "./WalletContext";

const MarketContext = createContext(null);

function normalizeItem(raw) {
    return {
        itemId: Number(raw.itemId),
        tokenId: raw.tokenId.toString(),
        nftContract: getAddress(raw.nftContract),
        seller: raw.seller,
        owner: raw.owner,
        price: raw.price,
        isSold: raw.isSold,
        isCancel: raw.isCancel,
    };
}

function normalizeAuction(raw) {
    return {
        itemId: Number(raw.itemId),
        owner: raw.owner,
        startingBid: raw.startingBid,
        highestBid: raw.highestBid,
        highestBidder: raw.highestBidder,
        endTime: Number(raw.endTime),
        isActive: raw.isActive,
    };
}

function isActiveListing(item) {
    return sameAddress(item.owner, ADDRESSES.marketplace) && !item.isSold && !item.isCancel;
}

const EMPTY = {
    config: null,
    items: [],
    tokens: [],
    auctions: {},
};

export function MarketProvider({children}) {
    const {account} = useWallet();
    const [data, setData] = useState(EMPTY);
    const [metadata, setMetadata] = useState({});
    const [mints, setMints] = useState({});
    const [refunds, setRefunds] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const requestRef = useRef(0);

    const load = useCallback(async () => {
        const requestId = ++requestRef.current;
        setRefreshing(true);
        setError(null);
        try {
            const {marketplace, auction} = getContracts();
            const [listingPrice, feePercentage, owner, pendingWithdrawals, maxDuration, rawItems, kseaTokens] =
                await Promise.all([
                    marketplace.listingPrice(),
                    marketplace.feePercentage(),
                    marketplace.getOwner(),
                    marketplace.getPendingWithdrawals(),
                    auction.maxDuration(),
                    marketplace.getAllNfts(),
                    enumerateTokens(ADDRESSES.nft),
                ]);

            const items = rawItems.map(normalizeItem);

            // NFT thuộc contract khác KSeaNFT nhưng được list lên marketplace
            const known = new Set(kseaTokens.map((t) => tokenKey(t.contract, t.tokenId)));
            const external = new Map();
            for (const item of items) {
                const key = tokenKey(item.nftContract, item.tokenId);
                if (!known.has(key) && !external.has(key)) external.set(key, item);
            }
            const externalTokens = await Promise.all(
                [...external.values()].map(async (item) => {
                    const c = getNftContract(item.nftContract);
                    const [holder, tokenURI] = await Promise.all([
                        c.ownerOf(item.tokenId).catch(() => ZERO_ADDRESS),
                        c.tokenURI(item.tokenId).catch(() => ""),
                    ]);
                    return {contract: item.nftContract, tokenId: item.tokenId, holder, tokenURI};
                })
            );

            const auctionList = await Promise.all(items.map((it) => auction.getAuction(it.itemId)));
            const auctions = {};
            auctionList.forEach((a, i) => {
                const normalized = normalizeAuction(a);
                if (normalized.endTime > 0) auctions[items[i].itemId] = normalized;
            });

            if (requestId !== requestRef.current) return;
            setData({
                config: {listingPrice, feePercentage, owner, pendingWithdrawals, maxDuration: Number(maxDuration)},
                items,
                tokens: [
                    ...kseaTokens.map((t) => ({...t, contract: getAddress(t.contract)})),
                    ...externalTokens,
                ],
                auctions,
            });
        } catch (err) {
            console.error(err);
            if (requestId === requestRef.current) {
                setError(err.shortMessage || err.message || "Failed to load marketplace data");
            }
        } finally {
            if (requestId === requestRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Tải metadata (IPFS / data URI) cho từng token
    useEffect(() => {
        let cancelled = false;
        const uris = [...new Set(data.tokens.map((t) => t.tokenURI).filter(Boolean))];
        uris.forEach((uri) => {
            fetchMetadata(uri).then((meta) => {
                if (!cancelled) setMetadata((m) => (uri in m ? m : {...m, [uri]: meta}));
            });
        });
        return () => {
            cancelled = true;
        };
    }, [data.tokens]);

    // Quét sự kiện mint để biết người tạo (chạy nền, có cache)
    useEffect(() => {
        let cancelled = false;
        scanMints(ADDRESSES.nft, (m) => !cancelled && setMints(m)).catch((err) =>
            console.warn("Mint scan failed:", err.shortMessage || err.message)
        );
        return () => {
            cancelled = true;
        };
    }, []);

    // Số ETH người dùng có thể rút lại từ các phiên đấu giá bị vượt giá
    useEffect(() => {
        let cancelled = false;
        if (!account) {
            setRefunds({});
            return;
        }
        const {auction} = getContracts();
        const ids = Object.keys(data.auctions);
        Promise.all(ids.map((itemId) => auction.getUserRefundableAmount(itemId, account)))
            .then((amounts) => {
                if (cancelled) return;
                const result = {};
                amounts.forEach((amount, i) => {
                    if (amount > 0n) result[ids[i]] = amount;
                });
                setRefunds(result);
            })
            .catch((err) => console.warn("Cannot load refunds", err));
        return () => {
            cancelled = true;
        };
    }, [account, data.auctions]);

    // Gộp token + listing + đấu giá + metadata thành danh sách NFT
    const nfts = useMemo(() => {
        const itemsByToken = new Map();
        for (const item of data.items) {
            const key = tokenKey(item.nftContract, item.tokenId);
            if (!itemsByToken.has(key)) itemsByToken.set(key, []);
            itemsByToken.get(key).push(item);
        }
        const now = Math.floor(Date.now() / 1000);

        return data.tokens.map((token) => {
            const key = tokenKey(token.contract, token.tokenId);
            const history = itemsByToken.get(key) || [];
            const listing = history.filter(isActiveListing).at(-1) || null;
            const rawAuction = listing ? data.auctions[listing.itemId] : null;
            const auction = rawAuction?.isActive ? rawAuction : null;
            const meta = token.tokenURI ? metadata[token.tokenURI] : null;
            const metaLoading = Boolean(token.tokenURI) && !(token.tokenURI in metadata);
            const isKsea = sameAddress(token.contract, ADDRESSES.nft);

            let creator = null;
            if (isKsea && mints[token.tokenId]) creator = getAddress(mints[token.tokenId]);
            else if (meta?.creator && isAddress(meta.creator)) creator = getAddress(meta.creator);

            const owner = listing ? listing.seller : token.holder;
            const category =
                meta?.category ||
                meta?.attributes?.find?.((a) => /category/i.test(a?.trait_type || ""))?.value ||
                null;

            return {
                key,
                contract: token.contract,
                tokenId: token.tokenId,
                tokenURI: token.tokenURI,
                metadata: meta,
                metaLoading,
                name: meta?.name || `${isKsea ? "KSEA" : "NFT"} #${token.tokenId}`,
                description: meta?.description || "",
                image: meta?.image || meta?.image_url || "",
                attributes: Array.isArray(meta?.attributes) ? meta.attributes : [],
                category,
                creator,
                holder: token.holder,
                owner,
                listing,
                auction,
                auctionEnded: auction ? auction.endTime <= now : false,
                history,
                path: `/nft/${token.contract}/${token.tokenId}`,
            };
        });
    }, [data, metadata, mints]);

    const stats = useMemo(() => {
        const sold = data.items.filter((i) => i.isSold);
        const salePrice = (item) => {
            const a = data.auctions[item.itemId];
            return a && !a.isActive && sameAddress(a.highestBidder, item.owner) ? a.highestBid : item.price;
        };
        const volume = sold.reduce((sum, i) => sum + salePrice(i), 0n);
        const creators = new Set(nfts.map((n) => n.creator?.toLowerCase()).filter(Boolean));
        return {
            totalNfts: nfts.length,
            listed: nfts.filter((n) => n.listing).length,
            liveAuctions: nfts.filter((n) => n.auction && !n.auctionEnded).length,
            sales: sold.length,
            volume,
            creators: creators.size,
            salePrice,
        };
    }, [data, nfts]);

    const value = useMemo(
        () => ({
            ...data,
            nfts,
            stats,
            refunds,
            loading,
            refreshing,
            error,
            refresh: load,
        }),
        [data, nfts, stats, refunds, loading, refreshing, error, load]
    );

    return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMarket() {
    const ctx = useContext(MarketContext);
    if (!ctx) throw new Error("useMarket must be used inside MarketProvider");
    return ctx;
}
