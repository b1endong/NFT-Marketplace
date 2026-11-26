// Vẽ mặt trước / mặt sau thẻ bài NFT bằng Canvas 2D (không cần file asset).
// Texture này được Three.js dùng trong holoCard.js.
import {GATEWAYS, isIpfsUri, resolveUri} from "../lib/ipfs";
import {shortAddress} from "../lib/format";

export const CARD_W = 1000;
export const CARD_H = 1400; // tỉ lệ 5:7 như thẻ bài thật
export const CARD_RADIUS = 56;
export const IMAGE_RECT = {x: 56, y: 150, w: 888, h: 888};

const BLUE = "#3ab0f0";
const PURPLE = "#b343d9";
const BASE = "#1d1d22";

export function createCanvas(w = CARD_W, h = CARD_H) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
        return;
    }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function frameGradient(ctx) {
    const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    g.addColorStop(0, BLUE);
    g.addColorStop(1, PURPLE);
    return g;
}

function hashString(str) {
    let h = 2166136261;
    for (const ch of str) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(seed) {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function fitText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
    return `${t}…`;
}

// Ảnh trừu tượng sinh từ seed — dùng khi NFT không có ảnh / ảnh lỗi.
// Giữ tông xanh-tím của thương hiệu để không bị loè loẹt.
function drawGenerativeArt(ctx, {x, y, w, h}, seed) {
    const rnd = mulberry32(hashString(seed || "ksea"));
    const h1 = 205 + rnd() * 30;
    const h2 = 255 + rnd() * 30;
    const bg = ctx.createLinearGradient(x, y, x + w, y + h);
    bg.addColorStop(0, `hsl(${h1}, 45%, 20%)`);
    bg.addColorStop(1, `hsl(${h2}, 40%, 12%)`);
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) {
        const cx = x + rnd() * w;
        const cy = y + rnd() * h;
        const r = w * (0.2 + rnd() * 0.35);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `hsla(${h1 + rnd() * 70}, 65%, 55%, 0.32)`);
        g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
    }
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 2;
    for (let gx = x; gx <= x + w; gx += 56) {
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h);
        ctx.stroke();
    }
    for (let gy = y; gy <= y + h; gy += 56) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }

    const cx = x + w * (0.35 + rnd() * 0.3);
    const cy = y + h * (0.35 + rnd() * 0.3);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    for (let k = 1; k <= 5; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.075 * k, 0, Math.PI * 2);
        ctx.stroke();
    }
}

const artCache = new Map();

// Data URL ảnh trừu tượng theo seed (dùng cho thẻ NFT không có ảnh ở các trang 2D).
export function generativeArtUrl(seed, size = 480) {
    const key = `${seed}:${size}`;
    if (!artCache.has(key)) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";
        drawGenerativeArt(ctx, {x: 0, y: 0, w: size, h: size}, seed);
        artCache.set(key, canvas.toDataURL("image/webp", 0.85));
    }
    return artCache.get(key);
}

function drawCover(ctx, img, {x, y, w, h}) {
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function avatarColors(address) {
    let hash = 0;
    for (const ch of address.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const a = hash % 360;
    const b = (a + 40 + ((hash >> 8) % 120)) % 360;
    return [`hsl(${a}, 80%, 60%)`, `hsl(${b}, 75%, 45%)`];
}

function drawFrame(ctx) {
    ctx.lineWidth = 8;
    ctx.strokeStyle = frameGradient(ctx);
    roundRect(ctx, 4, 4, CARD_W - 8, CARD_H - 8, CARD_RADIUS - 4);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    roundRect(ctx, 24, 24, CARD_W - 48, CARD_H - 48, CARD_RADIUS - 20);
    ctx.stroke();
}

const BADGES = {
    auction: ["LIVE AUCTION", "#fbbf24"],
    sale: ["FOR SALE", "#4ade80"],
    featured: ["FEATURED", "#60a5fa"],
};

/**
 * data: {name, creator, status: "auction"|"sale"|"featured", priceLabel, priceValue, tokenId, key}
 * img : HTMLImageElement hoặc null
 */
export function drawCardFront(canvas, data, img) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CARD_W, CARD_H);

    roundRect(ctx, 0, 0, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fillStyle = BASE;
    ctx.fill();
    const sheen = ctx.createLinearGradient(0, 0, 0, CARD_H);
    sheen.addColorStop(0, "rgba(255,255,255,0.06)");
    sheen.addColorStop(0.45, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fill();
    drawFrame(ctx);

    // Header: logo + badge trạng thái
    ctx.textBaseline = "middle";
    ctx.font = '700 38px "Space Mono", monospace';
    ctx.fillStyle = frameGradient(ctx);
    ctx.fillText("KSEA", 64, 92);

    const [badgeText, badgeColor] = BADGES[data.status] || BADGES.featured;
    ctx.font = '700 24px "Space Mono", monospace';
    const bw = ctx.measureText(badgeText).width + 74;
    const bx = CARD_W - 64 - bw;
    roundRect(ctx, bx, 66, bw, 52, 26);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + 28, 92, 7, 0, Math.PI * 2);
    ctx.fillStyle = badgeColor;
    ctx.fill();
    ctx.fillStyle = "#e4e4e7";
    ctx.fillText(badgeText, bx + 46, 93);

    // Ảnh NFT
    ctx.save();
    roundRect(ctx, IMAGE_RECT.x, IMAGE_RECT.y, IMAGE_RECT.w, IMAGE_RECT.h, 36);
    ctx.clip();
    if (img) {
        ctx.fillStyle = "#111";
        ctx.fillRect(IMAGE_RECT.x, IMAGE_RECT.y, IMAGE_RECT.w, IMAGE_RECT.h);
        drawCover(ctx, img, IMAGE_RECT);
    } else {
        drawGenerativeArt(ctx, IMAGE_RECT, data.key || data.name);
    }
    ctx.restore();
    roundRect(ctx, IMAGE_RECT.x, IMAGE_RECT.y, IMAGE_RECT.w, IMAGE_RECT.h, 36);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.stroke();

    // Tên + creator
    ctx.textBaseline = "alphabetic";
    ctx.font = '700 60px "Work Sans", sans-serif';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(fitText(ctx, data.name || "Untitled", 888), 56, 1124);

    ctx.textBaseline = "middle";
    if (data.creator) {
        const [c1, c2] = avatarColors(data.creator);
        const g = ctx.createLinearGradient(58, 1162, 98, 1202);
        g.addColorStop(0, c1);
        g.addColorStop(1, c2);
        ctx.beginPath();
        ctx.arc(78, 1182, 20, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.font = '400 30px "Space Mono", monospace';
        ctx.fillStyle = "#a1a1aa";
        ctx.fillText(`by ${shortAddress(data.creator)}`, 112, 1184);
    } else {
        ctx.font = '400 30px "Space Mono", monospace';
        ctx.fillStyle = "#a1a1aa";
        ctx.fillText(data.subtitle || "KSEA Marketplace", 56, 1184);
    }

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(56, 1236, 888, 2);

    // Giá + token id
    ctx.textBaseline = "alphabetic";
    ctx.font = '400 24px "Space Mono", monospace';
    ctx.fillStyle = "#858584";
    ctx.fillText((data.priceLabel || "").toUpperCase(), 56, 1292);
    ctx.textAlign = "right";
    ctx.fillText("TOKEN", 944, 1292);
    ctx.font = '700 44px "Space Mono", monospace';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.tokenId ? `#${data.tokenId}` : "—", 944, 1348);
    ctx.textAlign = "left";
    ctx.fillText(fitText(ctx, data.priceValue || "", 600), 56, 1348);
}

export function drawCardBack(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CARD_W, CARD_H);
    roundRect(ctx, 0, 0, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fillStyle = BASE;
    ctx.fill();

    ctx.save();
    ctx.clip();
    const glow = ctx.createRadialGradient(CARD_W / 2, CARD_H / 2, 0, CARD_W / 2, CARD_H / 2, CARD_H * 0.6);
    glow.addColorStop(0, "rgba(58,176,240,0.18)");
    glow.addColorStop(0.5, "rgba(179,67,217,0.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Hoạ tiết ô quả trám
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 2;
    const step = 70;
    for (let y = -step; y < CARD_H + step; y += step) {
        for (let x = (Math.round(y / step) % 2) * (step / 2) - step; x < CARD_W + step; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, y - 16);
            ctx.lineTo(x + 16, y);
            ctx.lineTo(x, y + 16);
            ctx.lineTo(x - 16, y);
            ctx.closePath();
            ctx.stroke();
        }
    }
    ctx.restore();

    // Biểu tượng trung tâm
    const cx = CARD_W / 2;
    const cy = CARD_H / 2 - 30;
    ctx.beginPath();
    ctx.arc(cx, cy, 170, 0, Math.PI * 2);
    ctx.fillStyle = BASE;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = frameGradient(ctx);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 145, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '700 84px "Space Mono", monospace';
    ctx.fillStyle = frameGradient(ctx);
    ctx.fillText("KSEA", cx, cy + 4);
    ctx.font = '400 26px "Space Mono", monospace';
    ctx.fillStyle = "#a1a1aa";
    ctx.fillText("M A R K E T P L A C E", cx, cy + 250);
    ctx.font = '400 22px "Space Mono", monospace';
    ctx.fillStyle = "#71717a";
    ctx.fillText("SEPOLIA · ERC-721", cx, CARD_H - 110);
    ctx.textAlign = "left";

    drawFrame(ctx);
}

// Texture gradient tròn (dùng cho quầng sáng phía sau thẻ và bóng đổ)
export function radialCanvas(stops, size = 256) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([offset, color]) => g.addColorStop(offset, color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return canvas;
}

function tryLoadImage(url, timeout = 10000) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // cần CORS để dùng làm texture WebGL
        img.decoding = "async";
        const timer = setTimeout(() => {
            img.src = "";
            resolve(null);
        }, timeout);
        img.onload = () => {
            clearTimeout(timer);
            resolve(img);
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
        };
        img.src = url;
    });
}

// Tải ảnh NFT, thử lần lượt các gateway IPFS. Trả về null nếu không tải được.
export async function loadCardImage(src) {
    if (!src) return null;
    const attempts = isIpfsUri(src) ? GATEWAYS.length : 1;
    for (let i = 0; i < attempts; i++) {
        const img = await tryLoadImage(resolveUri(src, i));
        if (img) return img;
    }
    return null;
}

// Đợi font web (Work Sans, Space Mono) sẵn sàng để chữ trên canvas đúng font.
export function waitForFonts(timeout = 2500) {
    if (!document.fonts?.load) return Promise.resolve();
    const fonts = Promise.all([
        document.fonts.load('700 60px "Work Sans"'),
        document.fonts.load('700 40px "Space Mono"'),
        document.fonts.load('400 30px "Space Mono"'),
    ]).catch(() => {});
    return Promise.race([fonts, new Promise((r) => setTimeout(r, timeout))]);
}
