import {useEffect, useRef, useState} from "react";
import {createHoloCard} from "../../three/holoCard";
import NftImage from "../common/NftImage";

/**
 * Thẻ bài NFT 3D: nghiêng theo con trỏ, click để lật, tự quay khi `card` đổi.
 * card: {key, name, image, creator, status, priceLabel, priceValue, tokenId}
 */
export default function HeroCard({card, onHoverChange}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const apiRef = useRef(null);
    const hoverRef = useRef(onHoverChange);
    const [webglFailed, setWebglFailed] = useState(false);

    useEffect(() => {
        hoverRef.current = onHoverChange;
    });

    useEffect(() => {
        try {
            apiRef.current = createHoloCard(containerRef.current, canvasRef.current, {
                onHoverChange: (v) => hoverRef.current?.(v),
            });
        } catch (err) {
            console.warn("WebGL is not available, showing a static card", err);
            setWebglFailed(true);
        }
        return () => {
            apiRef.current?.dispose();
            apiRef.current = null;
        };
    }, []);

    useEffect(() => {
        apiRef.current?.setCard(card);
    }, [card]);

    if (webglFailed) {
        return (
            <div className="w-full h-full flex-center">
                <div className="h-[85%] aspect-[5/7] rounded-3xl bg-[#1d1d22] border border-white/10 p-4 flex flex-col gap-3 shadow-2xl">
                    <NftImage src={card?.image} alt={card?.name} className="w-full aspect-square rounded-2xl" />
                    <p className="font-bold text-xl truncate">{card?.name}</p>
                    <p className="font-mono text-sm text-[#CCCCCC]">
                        {card?.priceLabel}: {card?.priceValue}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full min-h-72 relative">
            <canvas
                ref={canvasRef}
                className="block w-full h-full cursor-pointer"
                aria-label={card ? `3D card of ${card.name}. Click to flip.` : "3D card"}
                role="img"
            />
        </div>
    );
}
