const env = import.meta.env;

// Danh sách gateway thử lần lượt (gateway công cộng hay bị giới hạn / chậm).
export const GATEWAYS = [
    env.VITE_IPFS_GATEWAY,
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.filebase.io/ipfs/",
    "https://dweb.link/ipfs/",
]
    .filter(Boolean)
    .map((g) => g.replace(/\/?$/, "/"));

const PINATA_JWT = env.VITE_PINATA_JWT;

export const canUploadToIpfs = Boolean(PINATA_JWT);

function ipfsPath(uri) {
    if (uri.startsWith("ipfs://")) return uri.slice(7).replace(/^ipfs\//, "");
    if (/^(Qm[1-9A-Za-z]{44}|b[a-z2-7]{58,})/.test(uri)) return uri;
    return null;
}

export function isIpfsUri(uri) {
    return Boolean(uri && ipfsPath(uri));
}

// Chuyển ipfs://... hoặc CID trần sang URL HTTP qua gateway thứ `gatewayIndex`.
export function resolveUri(uri, gatewayIndex = 0) {
    if (!uri) return "";
    const path = ipfsPath(uri);
    if (!path) return uri;
    return GATEWAYS[Math.min(gatewayIndex, GATEWAYS.length - 1)] + path;
}

function decodeBase64Utf8(b64) {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
}

const metadataCache = new Map();

async function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, {signal: controller.signal});
    } finally {
        clearTimeout(timer);
    }
}

// Đọc metadata JSON từ tokenURI (hỗ trợ data:, ipfs://, http(s)://).
export function fetchMetadata(tokenURI) {
    if (!tokenURI) return Promise.resolve(null);
    if (metadataCache.has(tokenURI)) return metadataCache.get(tokenURI);

    const promise = (async () => {
        try {
            if (tokenURI.startsWith("data:")) {
                const [header, body] = tokenURI.split(",", 2);
                const text = header.includes(";base64")
                    ? decodeBase64Utf8(body)
                    : decodeURIComponent(body);
                return JSON.parse(text);
            }
            const attempts = isIpfsUri(tokenURI) ? GATEWAYS.length : 1;
            for (let i = 0; i < attempts; i++) {
                try {
                    const res = await fetchWithTimeout(resolveUri(tokenURI, i), 12000);
                    if (!res.ok) continue;
                    const type = res.headers.get("content-type") || "";
                    // tokenURI trỏ thẳng tới một ảnh
                    if (type.startsWith("image/")) return {image: tokenURI};
                    return await res.json();
                } catch {
                    /* thử gateway tiếp theo */
                }
            }
            throw new Error("all gateways failed");
        } catch (err) {
            console.warn("Cannot load metadata", tokenURI, err.message);
            return null;
        }
    })();

    metadataCache.set(tokenURI, promise);
    return promise;
}

export function metadataToDataUri(metadata) {
    return (
        "data:application/json;base64," +
        encodeBase64Utf8(JSON.stringify(metadata))
    );
}

async function pinataRequest(url, body, isJson) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            ...(isJson ? {"Content-Type": "application/json"} : {}),
        },
        body,
    });
    if (!res.ok) {
        throw new Error(`Pinata upload failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    return `ipfs://${data.IpfsHash}`;
}

export function uploadFileToIpfs(file) {
    const form = new FormData();
    form.append("file", file);
    form.append("pinataMetadata", JSON.stringify({name: file.name}));
    return pinataRequest(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        form,
        false
    );
}

export function uploadJsonToIpfs(json) {
    return pinataRequest(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        JSON.stringify({
            pinataContent: json,
            pinataMetadata: {name: `${json.name || "nft"}.json`},
        }),
        true
    );
}
