import {useEffect} from "react";

export default function Modal({open, onClose, title, children}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
            onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div className="bg-[#3B3B3B] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl ring-1 ring-white/10 animate-scale-in">
                <div className="flex-center-between mb-6">
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <button onClick={onClose} aria-label="Close">
                        <i className="fa-solid fa-xmark text-2xl text-[#858584] hover:text-white"></i>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
