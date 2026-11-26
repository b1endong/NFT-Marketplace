import {useEffect, useState} from "react";
import {formatDuration} from "../../lib/format";

// Trả về thời gian hiện tại (giây), cập nhật mỗi `interval` ms.
// eslint-disable-next-line react-refresh/only-export-components
export function useNow(interval = 1000) {
    const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
    useEffect(() => {
        const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), interval);
        return () => clearInterval(id);
    }, [interval]);
    return now;
}

export default function Countdown({endTime, className = ""}) {
    const now = useNow();
    const left = endTime - now;
    if (left <= 0) return <span className={className}>Ended</span>;
    return <span className={`font-mono ${className}`}>{formatDuration(left)}</span>;
}
