import UserInfo from "../components/UserProfileComponents/UserInfo";
import {useState} from "react";
import NftCard from "../components/NftCard";

export default function UserProfile() {
    const [activeTab, setActiveTab] = useState("created");

    return (
        <>
            <div className="w-full h-[320px] relative">
                <img
                    src="/background.jpg"
                    alt=""
                    className="w-full h-full object-cover"
                />
                <div className="custom-background-color w-full h-full absolute top-0 left-0 opacity-50"></div>

                <div className="max-w-calc w-full h-36 m-auto absolute top-62 left-29">
                    <img
                        src="/avatar.jpg"
                        alt=""
                        className="w-30 h-30 top-0 left-0 rounded-2xl border-2 border-[#3B3B3B]"
                    />
                </div>
            </div>
            <div className="max-w-calc m-auto mt-21 relative bg-[#2B2B2B]">
                <UserInfo />
                <div className="flex-center-between mt-10">
                    <button
                        className={`
                            font-bold text-xl w-full py-4 text-[#858584] ${
                                activeTab === "created"
                                    ? "border-blue-500 text-white transform translate-y-[-1px] border-b-2"
                                    : "border-transparent hover:border-blue-500"
                            }
                        `}
                        onClick={() => setActiveTab("created")}
                    >
                        Created
                    </button>
                    <button
                        className={`
                            font-bold text-xl w-full py-4 text-[#858584] ${
                                activeTab === "owned"
                                    ? "border-blue-500 text-white transform translate-y-[-1px] border-b-2"
                                    : "border-transparent hover:border-blue-500"
                            }
                        `}
                        onClick={() => setActiveTab("owned")}
                    >
                        Owned
                    </button>
                    <button
                        className={`
                            font-bold text-xl w-full py-4 text-[#858584] ${
                                activeTab === "collections"
                                    ? "border-blue-500 text-white transform translate-y-[-1px] border-b-2"
                                    : "border-transparent hover:border-blue-500"
                            }
                        `}
                        onClick={() => setActiveTab("collections")}
                    >
                        Collections
                    </button>
                </div>
            </div>
            <div className="py-20 bg-[#3B3B3B] border-b-2 border-[#2B2B2B]">
                <div className="grid grid-cols-3 gap-8 place-items-center max-w-calc m-auto">
                    <NftCard type="userProfile" />
                    <NftCard type="userProfile" />
                    <NftCard type="userProfile" />
                    <NftCard type="userProfile" />
                    <NftCard type="userProfile" />
                    <NftCard type="userProfile" />
                    <NftCard type="userProfile" />
                    <NftCard type="userProfile" />
                    <NftCard type="userProfile" />
                </div>
            </div>
        </>
    );
}
