import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {BrowserProvider, getAddress} from "ethers";
import {CHAIN} from "../config/contracts";

const WalletContext = createContext(null);
const DISCONNECT_KEY = "ksea:disconnected";

function storage(action, value) {
    try {
        if (action === "get") return localStorage.getItem(DISCONNECT_KEY);
        if (action === "set") localStorage.setItem(DISCONNECT_KEY, value);
        if (action === "remove") localStorage.removeItem(DISCONNECT_KEY);
    } catch {
        /* localStorage có thể bị chặn */
    }
    return null;
}

export function WalletProvider({children}) {
    const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [connecting, setConnecting] = useState(false);

    const handleAccounts = useCallback((accounts) => {
        setAccount(accounts?.length ? getAddress(accounts[0]) : null);
    }, []);

    // Tự kết nối lại nếu người dùng đã cấp quyền trước đó
    useEffect(() => {
        if (!ethereum) return;
        ethereum
            .request({method: "eth_chainId"})
            .then((id) => setChainId(Number(id)))
            .catch(() => {});
        if (storage("get") !== "1") {
            ethereum
                .request({method: "eth_accounts"})
                .then(handleAccounts)
                .catch(() => {});
        }

        const onChain = (id) => setChainId(Number(id));
        ethereum.on?.("accountsChanged", handleAccounts);
        ethereum.on?.("chainChanged", onChain);
        return () => {
            ethereum.removeListener?.("accountsChanged", handleAccounts);
            ethereum.removeListener?.("chainChanged", onChain);
        };
    }, [ethereum, handleAccounts]);

    const switchChain = useCallback(async () => {
        if (!ethereum) return;
        try {
            await ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{chainId: CHAIN.hexId}],
            });
        } catch (err) {
            // 4902: ví chưa có mạng này -> thêm mới
            if (err?.code === 4902 || err?.data?.originalError?.code === 4902) {
                await ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: CHAIN.hexId,
                            chainName: CHAIN.name,
                            nativeCurrency: CHAIN.currency,
                            rpcUrls: [CHAIN.rpcUrl],
                            blockExplorerUrls: [CHAIN.explorer],
                        },
                    ],
                });
            } else {
                throw err;
            }
        }
    }, [ethereum]);

    const connect = useCallback(async () => {
        if (!ethereum) {
            window.open("https://metamask.io/download/", "_blank", "noopener");
            return;
        }
        setConnecting(true);
        try {
            const accounts = await ethereum.request({
                method: "eth_requestAccounts",
            });
            storage("remove");
            handleAccounts(accounts);
            const id = Number(await ethereum.request({method: "eth_chainId"}));
            setChainId(id);
            if (id !== CHAIN.id) await switchChain().catch(() => {});
        } finally {
            setConnecting(false);
        }
    }, [ethereum, handleAccounts, switchChain]);

    const disconnect = useCallback(() => {
        storage("set", "1");
        setAccount(null);
    }, []);

    const isCorrectChain = chainId === CHAIN.id;

    // Trả về signer, tự đòi kết nối / chuyển mạng nếu cần.
    const getSigner = useCallback(async () => {
        if (!ethereum) throw new Error("Please install MetaMask to continue.");
        if (!account) await connect();
        const id = Number(await ethereum.request({method: "eth_chainId"}));
        if (id !== CHAIN.id) await switchChain();
        const provider = new BrowserProvider(ethereum);
        return provider.getSigner();
    }, [ethereum, account, connect, switchChain]);

    const value = useMemo(
        () => ({
            hasWallet: Boolean(ethereum),
            account,
            chainId,
            isCorrectChain,
            connecting,
            connect,
            disconnect,
            switchChain,
            getSigner,
        }),
        [ethereum, account, chainId, isCorrectChain, connecting, connect, disconnect, switchChain, getSigner]
    );

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
    return ctx;
}
