export default function NftCard() {
    return (
        <div className="w-105 h-117.25 h-flex-center flex-col rounded-xl overflow-hidden">
            <div className="w-full h-75">
                <img src="/nft1.jpg" alt="" className="w-full h-full" />
            </div>
            <div className="bg-[#3B3B3B] py-5 px-7 w-full ">
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
