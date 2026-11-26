import {useCallback, useState} from "react";
import {useWallet} from "../context/WalletContext";
import {useToast} from "../context/ToastContext";
import {useMarket} from "../context/MarketContext";
import {parseError} from "../lib/errors";
import {explorerTx} from "../lib/format";

/**
 * Chạy một chuỗi giao dịch với thông báo trạng thái.
 * steps: [{label, send: async (signer, ctx) => TransactionResponse | null}]
 *  - ctx.receipts chứa receipt của các bước trước (để lấy event, ví dụ itemId mới).
 *  - send trả về null => bỏ qua bước (ví dụ đã approve rồi).
 */
export function useTransaction() {
    const {getSigner} = useWallet();
    const toast = useToast();
    const {refresh} = useMarket();
    const [pending, setPending] = useState(false);

    const run = useCallback(
        async (title, steps, {successMessage} = {}) => {
            setPending(true);
            const toastId = toast.push({type: "pending", title, message: "Preparing…"});
            const ctx = {receipts: []};
            try {
                const signer = await getSigner();
                for (let i = 0; i < steps.length; i++) {
                    const step = steps[i];
                    const prefix = steps.length > 1 ? `Step ${i + 1}/${steps.length}: ` : "";
                    toast.update(toastId, {message: `${prefix}${step.label} — confirm in your wallet`, link: null});
                    const tx = await step.send(signer, ctx);
                    if (!tx) {
                        ctx.receipts.push(null);
                        continue;
                    }
                    toast.update(toastId, {
                        message: `${prefix}${step.label} — waiting for confirmation…`,
                        link: explorerTx(tx.hash),
                    });
                    const receipt = await tx.wait();
                    ctx.receipts.push(receipt);
                }
                const last = ctx.receipts.filter(Boolean).at(-1);
                toast.update(toastId, {
                    type: "success",
                    title: "Success",
                    message: successMessage || title,
                    link: last ? explorerTx(last.hash) : null,
                });
                refresh();
                return ctx.receipts;
            } catch (err) {
                console.error(err);
                toast.update(toastId, {type: "error", title: `${title} failed`, message: parseError(err)});
                refresh();
                return null;
            } finally {
                setPending(false);
            }
        },
        [getSigner, toast, refresh]
    );

    return {run, pending};
}
