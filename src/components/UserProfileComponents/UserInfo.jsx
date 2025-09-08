export default function UserProfile() {
    return (
        <div>
            <div className="flex flex-col gap-7 w-[60%]">
                <h1 className="text-3xl font-bold">Artist Name</h1>
                <ul className="flex gap-10 ">
                    <li>
                        <strong className="text-xl">250k+</strong>
                        <p>Volume</p>
                    </li>
                    <li>
                        <strong className="text-xl">50+</strong>
                        <p>NFT Sold</p>
                    </li>
                    <li>
                        <strong className="text-xl">3000+</strong>
                        <p>Followers</p>
                    </li>
                </ul>
                <div>
                    <p className="space-mono-bold text-[#858584]">Bio</p>
                    <p>The Internet's Friendliest Designer Kit</p>
                </div>
                <div>
                    <p className="space-mono-bold text-[#858584]">Link</p>
                    <ul className="flex gap-3">
                        <li>
                            <i className="fab fa-facebook text-[#858584]"></i>
                        </li>
                        <li>
                            <i className="fab fa-twitter text-[#858584]"></i>
                        </li>
                        <li>
                            <i className="fab fa-instagram text-[#858584]"></i>
                        </li>
                        <li>
                            <i className="fab fa-linkedin text-[#858584]"></i>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="absolute top-0 right-0 flex-center gap-5">
                <button className="flex-center base-button px-12 gap-2">
                    <i class="fa-regular fa-copy"></i>
                    <p>Address</p>
                </button>
                <button className="flex-center base-button bg-transparent px-12 border-2 border-blue-500 gap-2">
                    <i class="fa-solid fa-plus text-blue-500"></i>
                    <p>Follow</p>
                </button>
            </div>
        </div>
    );
}
