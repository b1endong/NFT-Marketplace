import {Link} from "react-router-dom";
import {addressGradient, sameAddress, shortAddress} from "../../lib/format";
import {useWallet} from "../../context/WalletContext";

export function Avatar({address, size = 24, className = ""}) {
    return (
        <span
            className={`inline-block rounded-full shrink-0 ${className}`}
            style={{width: size, height: size, background: addressGradient(address)}}
        />
    );
}

// Hiển thị avatar + địa chỉ rút gọn, link tới trang profile.
export function AddressLink({address, showAvatar = true, className = ""}) {
    const {account} = useWallet();
    if (!address) return <span className="text-[#858584]">Unknown</span>;
    const isMe = sameAddress(address, account);
    return (
        <Link
            to={`/profile/${address}`}
            className={`inline-flex items-center gap-2 hover:underline font-mono ${className}`}
            title={address}
            onClick={(e) => e.stopPropagation()}
        >
            {showAvatar && <Avatar address={address} />}
            {isMe ? "You" : shortAddress(address)}
        </Link>
    );
}
