export default function Collection() {
    return (
        <div>
            <div className="grid grid-cols-3 grid-rows-2 gap-3 ">
                <div className="w-full h-full row-span-2 col-span-3 overflow-hidden rounded-2xl">
                    <img
                        className="hover:scale-110 custom-transition"
                        src="/CollectionImg.jpg"
                        alt="Collection"
                    />
                </div>
                <div className="w-full h-full col-span-1 row-span-1 overflow-hidden rounded-2xl">
                    <img
                        className="hover:scale-110 custom-transition"
                        src="/CollectionImg.jpg"
                        alt="Collection"
                    />
                </div>
                <div className="w-full h-full col-span-1 row-span-1 overflow-hidden rounded-2xl">
                    <img
                        className="hover:scale-110 custom-transition"
                        src="/CollectionImg.jpg"
                        alt="Collection"
                    />
                </div>
                <div className="w-full h-full col-span-1 row-span-1 overflow-hidden rounded-2xl">
                    <img
                        className="hover:scale-110 custom-transition"
                        src="/CollectionImg.jpg"
                        alt="Collection"
                    />
                </div>
                <div className="flex flex-col gap-3 mt-3">
                    <h3 className="text-2xl font-bold">Name Collection</h3>
                    <p className="text-normal text-white">Name Artist</p>
                </div>
            </div>
        </div>
    );
}
