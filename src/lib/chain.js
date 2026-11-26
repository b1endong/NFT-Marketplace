import {Contract, JsonRpcProvider, id, zeroPadValue} from "ethers";
import {ADDRESSES, AUCTION_ABI, CHAIN, MARKETPLACE_ABI, NFT_ABI} from "../config/contracts";
import {ZERO_ADDRESS} from "./format";

// Provider chỉ-đọc, dùng được cả khi chưa kết nối ví.
// staticNetwork: bỏ bước dò mạng (tránh treo với RPC công cộng).
export const readProvider = new JsonRpcProvider(CHAIN.rpcUrl, CHAIN.id, {
    staticNetwork: true,
    batchMaxCount: 50,
});

export function getContracts(runner = readProvider) {
    return {
        nft: new Contract(ADDRESSES.nft, NFT_ABI, runner),
        marketplace: new Contract(ADDRESSES.marketplace, MARKETPLACE_ABI, runner),
        auction: new Contract(ADDRESSES.auction, AUCTION_ABI, runner),
    };
}

export function getNftContract(address, runner = readProvider) {
    return new Contract(address, NFT_ABI, runner);
}

// KSeaNFT không có totalSupply -> dò ownerOf(1..n) theo lô cho tới khi gặp token chưa tồn tại.
// (Contract không có hàm burn nên các tokenId liên tục.)
export async function enumerateTokens(nftAddress, batchSize = 20) {
    const nft = getNftContract(nftAddress);
    const tokens = [];
    for (let start = 1; ; start += batchSize) {
        const ids = Array.from({length: batchSize}, (_, i) => start + i);
        const results = await Promise.allSettled(
            ids.map(async (tokenId) => {
                const [holder, tokenURI] = await Promise.all([
                    nft.ownerOf(tokenId),
                    nft.tokenURI(tokenId),
                ]);
                return {contract: nftAddress, tokenId: String(tokenId), holder, tokenURI};
            })
        );
        let reachedEnd = false;
        for (const r of results) {
            if (r.status === "fulfilled") tokens.push(r.value);
            else {
                const err = r.reason;
                const notExist =
                    err?.code === "CALL_EXCEPTION" || /revert/i.test(err?.message || "");
                if (!notExist) throw err; // lỗi mạng thật sự
                reachedEnd = true;
            }
        }
        if (reachedEnd) break;
    }
    return tokens;
}

// ----- Quét sự kiện mint (Transfer từ 0x0) để biết người tạo NFT -----
// RPC công cộng giới hạn getLogs 50k block/lần nên quét từng đoạn và cache vào localStorage.
const DEPLOY_BLOCK = Number(import.meta.env.VITE_NFT_DEPLOY_BLOCK || 9096185);
const CHUNK = 49000;
const TRANSFER_TOPIC = id("Transfer(address,address,uint256)");

function loadMintCache(key) {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
    } catch {
        /* ignore */
    }
    return {lastBlock: DEPLOY_BLOCK - 1, mints: {}};
}

function saveMintCache(key, cache) {
    try {
        localStorage.setItem(key, JSON.stringify(cache));
    } catch {
        /* ignore */
    }
}

export async function scanMints(nftAddress, onProgress) {
    const key = `ksea:mints:${CHAIN.id}:${nftAddress.toLowerCase()}`;
    const cache = loadMintCache(key);
    const latest = await readProvider.getBlockNumber();
    const ranges = [];
    for (let from = cache.lastBlock + 1; from <= latest; from += CHUNK) {
        ranges.push([from, Math.min(from + CHUNK - 1, latest)]);
    }
    onProgress?.(cache.mints);
    if (!ranges.length) return cache.mints;

    const fetchRange = async ([fromBlock, toBlock], attempt = 0) => {
        try {
            return await readProvider.getLogs({
                address: nftAddress,
                topics: [TRANSFER_TOPIC, zeroPadValue(ZERO_ADDRESS, 32)],
                fromBlock,
                toBlock,
            });
        } catch (err) {
            if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
                return fetchRange([fromBlock, toBlock], attempt + 1);
            }
            throw err;
        }
    };

    // Chạy tuần tự theo nhóm nhỏ, lưu tiến độ sau mỗi nhóm để lần sau không quét lại.
    const CONCURRENCY = 4;
    for (let i = 0; i < ranges.length; i += CONCURRENCY) {
        const group = ranges.slice(i, i + CONCURRENCY);
        const logsList = await Promise.all(group.map((r) => fetchRange(r)));
        for (const logs of logsList) {
            for (const log of logs) {
                const tokenId = BigInt(log.topics[3]).toString();
                cache.mints[tokenId] = "0x" + log.topics[2].slice(26);
            }
        }
        cache.lastBlock = group[group.length - 1][1];
        saveMintCache(key, cache);
        onProgress?.({...cache.mints});
    }
    return cache.mints;
}
