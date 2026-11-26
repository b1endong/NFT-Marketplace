import {formatEther} from "ethers";
import {CHAIN} from "../config/contracts";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const tokenKey = (contract, tokenId) => `${contract.toLowerCase()}-${tokenId}`;

export function shortAddress(address, chars = 4) {
    if (!address) return "";
    return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function sameAddress(a, b) {
    return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export function formatEth(wei, maxDecimals = 4) {
    if (wei === undefined || wei === null) return "-";
    const value = Number(formatEther(wei));
    if (value === 0) return "0";
    if (value < 10 ** -maxDecimals) return `<${10 ** -maxDecimals}`;
    return value.toLocaleString("en-US", {maximumFractionDigits: maxDecimals});
}

export function explorerAddress(address) {
    return `${CHAIN.explorer}/address/${address}`;
}

export function explorerTx(hash) {
    return `${CHAIN.explorer}/tx/${hash}`;
}

export function formatDuration(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return d > 0
        ? `${d}d ${pad(h)}h ${pad(m)}m`
        : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

// Tạo màu gradient cố định từ một địa chỉ ví (dùng làm avatar).
export function addressGradient(address = "") {
    let hash = 0;
    for (const ch of address.toLowerCase()) {
        hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    }
    const h1 = hash % 360;
    const h2 = (h1 + 40 + ((hash >> 8) % 120)) % 360;
    return `linear-gradient(135deg, hsl(${h1} 80% 60%), hsl(${h2} 75% 45%))`;
}
