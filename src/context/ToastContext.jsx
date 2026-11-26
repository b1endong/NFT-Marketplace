import {createContext, useCallback, useContext, useMemo, useRef, useState} from "react";

const ToastContext = createContext(null);

const STYLES = {
    pending: {icon: "fa-solid fa-spinner fa-spin", color: "text-blue-400"},
    success: {icon: "fa-solid fa-circle-check", color: "text-green-400"},
    error: {icon: "fa-solid fa-circle-exclamation", color: "text-red-400"},
    info: {icon: "fa-solid fa-circle-info", color: "text-blue-400"},
};

export function ToastProvider({children}) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((list) => list.filter((t) => t.id !== id));
    }, []);

    const scheduleDismiss = useCallback(
        (id, type) => {
            if (type !== "pending") setTimeout(() => dismiss(id), type === "error" ? 8000 : 5000);
        },
        [dismiss]
    );

    const push = useCallback(
        (toast) => {
            const id = ++idRef.current;
            setToasts((list) => [...list, {id, type: "info", ...toast}]);
            scheduleDismiss(id, toast.type);
            return id;
        },
        [scheduleDismiss]
    );

    const update = useCallback(
        (id, patch) => {
            setToasts((list) => list.map((t) => (t.id === id ? {...t, ...patch} : t)));
            scheduleDismiss(id, patch.type);
        },
        [scheduleDismiss]
    );

    const value = useMemo(() => ({push, update, dismiss}), [push, update, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-3 sm:w-96">
                {toasts.map((t) => {
                    const style = STYLES[t.type] || STYLES.info;
                    return (
                        <div
                            key={t.id}
                            className="bg-[#3B3B3B]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-3 items-start animate-slide-in"
                        >
                            <i className={`${style.icon} ${style.color} text-xl mt-0.5`}></i>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold">{t.title}</p>
                                {t.message && (
                                    <p className="text-sm text-[#CCCCCC] break-words">{t.message}</p>
                                )}
                                {t.link && (
                                    <a
                                        href={t.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm !text-blue-400 underline"
                                    >
                                        View on Etherscan
                                    </a>
                                )}
                            </div>
                            <button onClick={() => dismiss(t.id)} aria-label="Close">
                                <i className="fa-solid fa-xmark text-[#858584]"></i>
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}
