import SubscribeButton from "./SubscribeButton";

export default function Footer() {
    return (
        <div className="bg-[#3B3B3B]">
            <div className="flex gap-20 justify-center pt-10 footer-content relative">
                <div className="flex flex-col gap-7">
                    <div className="flex items-center ">
                        <i className="fa-solid fa-shop mr-3 text-blue-400"></i>
                        <h1 className="space-mono-bold text-blue-400 text-2xl">
                            KSEA Marketplace
                        </h1>
                    </div>
                    <p className="text-[#CCCCCC]">
                        NFT marketplace UI <br />
                        created with Anima for Figma.
                    </p>
                    <div className="flex flex-col gap-3">
                        <p className="text-[#CCCCCC]">Join our community</p>
                        <ul className="flex gap-2">
                            <li>
                                <a href="">
                                    <i class="fa-brands fa-discord text-2xl text-[#858584]"></i>
                                </a>
                            </li>
                            <li>
                                <a href="">
                                    <i class="fa-brands fa-twitter text-2xl text-[#858584]"></i>
                                </a>
                            </li>
                            <li>
                                <a href="">
                                    <i class="fa-brands fa-github text-2xl text-[#858584]"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col">
                    <h1 className="space-mono-bold text-blue-400 text-2xl">
                        Explore
                    </h1>
                    <ul className="flex flex-col gap-7 mt-7 ">
                        <li className="text-[#CCCCCC]">Marketplace</li>
                        <li className="text-[#CCCCCC]">Rankings</li>
                        <li className="text-[#CCCCCC]">Auction</li>
                    </ul>
                </div>
                <div className="flex flex-col gap-7">
                    <h1 className="space-mono-bold text-blue-400 text-2xl">
                        Join Our Weekly Digest{" "}
                    </h1>
                    <p className="text-[#CCCCCC]">
                        Get exclusive promotions & updates straight to your
                        inbox.
                    </p>
                    <SubscribeButton />
                </div>
            </div>
            <p className="text-sm text-[#858584] py-6 mt-8 text-center">
                © 2023 KSEA Marketplace. All rights reserved.
            </p>
        </div>
    );
}
