import {useState} from "react";
import {GATEWAYS, isIpfsUri, resolveUri} from "../../lib/ipfs";
import {generativeArtUrl} from "../../three/cardTextures";

/**
 * Ảnh NFT: tự đổi gateway IPFS khi lỗi, mờ dần khi tải xong.
 * Không có ảnh -> dùng ảnh trừu tượng sinh từ `seed` (nếu có) hoặc placeholder.
 */
export default function NftImage({src, alt = "", className = "", loading = false, seed}) {
    const [attempt, setAttempt] = useState({src, index: 0, failed: false});
    const [loadedUrl, setLoadedUrl] = useState(null);
    // reset khi src đổi
    const state = attempt.src === src ? attempt : {src, index: 0, failed: false};

    if (loading) {
        return <div className={`bg-[#3B3B3B] skeleton ${className}`} />;
    }

    if (!src || state.failed) {
        const art = seed ? generativeArtUrl(seed) : "";
        return (
            <div className={`relative overflow-hidden bg-gradient-to-br from-[#2c3447] via-[#2a2a35] to-[#33283f] ${className}`}>
                {art ? (
                    <img src={art} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex-center">
                        <i className="fa-regular fa-image text-4xl !text-white/30"></i>
                    </div>
                )}
                <span className="absolute bottom-3 right-3 text-xs rounded-lg bg-black/40 backdrop-blur-sm px-2 py-1 !text-white/60">
                    {src ? "Image unavailable" : "No image"}
                </span>
            </div>
        );
    }

    const url = resolveUri(src, state.index);
    const handleError = () => {
        if (isIpfsUri(src) && state.index < GATEWAYS.length - 1) {
            setAttempt({src, index: state.index + 1, failed: false});
        } else {
            setAttempt({src, index: state.index, failed: true});
        }
    };

    return (
        <div className={`relative overflow-hidden bg-[#3B3B3B] ${className}`}>
            {loadedUrl !== url && <div className="absolute inset-0 skeleton" />}
            <img
                src={url}
                alt={alt}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    loadedUrl === url ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setLoadedUrl(url)}
                onError={handleError}
                loading="lazy"
            />
        </div>
    );
}
