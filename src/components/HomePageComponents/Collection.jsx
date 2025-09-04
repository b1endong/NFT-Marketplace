import {div} from "three/tsl";

export default function Collection() {
    return (
        <div>
            <div className="grid grid-cols-3 grid-rows-4 gap-3">
                <img
                    className="row-span-3 col-span-3"
                    src="../public/Highlighted NFT.svg"
                    alt="Collection"
                />
                <img
                    className="col-span-1 row-span-1"
                    src="../public/Highlighted NFT.svg"
                    alt="Collection"
                />
                <img
                    className="col-span-1 row-span-1"
                    src="../public/Highlighted NFT.svg"
                    alt="Collection"
                />
                <img
                    className="col-span-1 row-span-1"
                    src="../public/Highlighted NFT.svg"
                    alt="Collection"
                />
            </div>
            <div className="flex flex-col gap-3 mt-3">
                <h3 className="text-xl font-bold">Name Collection</h3>
                <p className="text-normal text-white">Name Artist</p>
            </div>
        </div>
    );
}
