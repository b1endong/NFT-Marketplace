import {Link} from "react-router-dom";

export default function Category({name, icon, img, count}) {
    return (
        <Link
            to={`/marketplace?tab=all&category=${encodeURIComponent(name)}`}
            className="w-full rounded-2xl overflow-hidden cursor-pointer hover:scale-105 custom-transition"
        >
            <div className="relative w-full flex-center overflow-hidden ">
                <img src={img} className="w-full blur-sm" alt="" />
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10"></div>
                <div className="flex-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <i className={icon + " text-6xl xl:text-9xl"}></i>
                </div>
            </div>
            <div className="bg-[#3B3B3B] w-full py-5 px-7 flex-center-between">
                <p className="text-xl xl:text-2xl font-bold">{name}</p>
                <span className="text-sm text-[#858584] font-mono">{count}</span>
            </div>
        </Link>
    );
}
