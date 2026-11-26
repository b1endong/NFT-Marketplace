import {useWallet} from "../context/WalletContext";
import {CHAIN} from "../config/contracts";

// Cảnh báo khi ví đang ở sai mạng.
export default function NetworkBanner() {
    const {account, isCorrectChain, switchChain} = useWallet();
    if (!account || isCorrectChain) return null;
    return (
        <div className="bg-red-500/20 border-b border-red-500 px-4 py-3 text-center">
            Your wallet is connected to the wrong network. This marketplace runs on <strong>{CHAIN.name}</strong>.{" "}
            <button className="underline font-bold" onClick={() => switchChain().catch(() => {})}>
                Switch network
            </button>
        </div>
    );
}
