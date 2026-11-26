import {useState} from "react";
import {GATEWAYS, isIpfsUri, resolveUri} from "../../lib/ipfs";

// Ảnh NFT: tự đổi gateway IPFS khi lỗi, hiện placeholder nếu không tải được.
export default function NftImage({src, alt = "", className = "", loading = false}) {
    const [attempt, setAttempt] = useState({src, index: 0, failed: false});
    // reset khi src đổi
    const state = attempt.src === src ? attempt : {src, index: 0, failed: false};

    if (loading) {
        return <div className={`bg-[#3B3B3B] animate-pulse ${className}`} />;
    }

    if (!src || state.failed) {
        return (
            <div className={`flex-center flex-col gap-2 custom-gradient opacity-90 ${className}`}>
                <i className="fa-regular fa-image text-5xl"></i>
                <span className="text-sm">{src ? "Image unavailable" : "No image"}</span>
            </div>
        );
    }

    const handleError = () => {
        if (isIpfsUri(src) && state.index < GATEWAYS.length - 1) {
            setAttempt({src, index: state.index + 1, failed: false});
        } else {
            setAttempt({src, index: state.index, failed: true});
        }
    };

    return (
        <img
            src={resolveUri(src, state.index)}
            alt={alt}
            className={`object-cover ${className}`}
            onError={handleError}
            loading="lazy"
        />
    );
}
