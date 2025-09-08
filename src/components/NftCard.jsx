export default function NftCard({type}) {
    if (type == "userProfile") {
        var customBackground = "bg-[#2B2B2B]";
        var customClass = "w-full";
    } else if (type == "homePage") {
        var customBackground = "bg-[#3B3B3B]";
        var customClass = "w-105";
    }
    return (
        <div
            className={`h-117.25 h-flex-center flex-col rounded-t-2xl overflow-hidden ${customClass}`}
        >
            <div className="w-full h-75">
                <img
                    src="/nft1.jpg"
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>
            <div
                className={`py-5 px-7 w-full rounded-b-2xl ${customBackground}`}
            >
                <div>
                    <p className="text-xl font-bold">Name Nft</p>
                    <p>
                        <span className="font-mono">Name Artist</span>
                    </p>
                </div>
                <div className="mt-5">
                    <p className="flex flex-col gap-2">
                        <strong className="text-xs text-[#858584]">
                            Price:
                        </strong>{" "}
                        <span className="font-mono">0.5 ETH</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
