import {Link} from "react-router-dom";

export default function Category({name, icon, img, count}) {
    return (
        <Link
            to={`/marketplace?tab=all&category=${encodeURIComponent(name)}`}
            className="group block w-full rounded-2xl overflow-hidden ring-1 ring-white/5 transition duration-500 hover:-translate-y-1.5 hover:ring-blue-400/30 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]"
        >
            <div className="relative w-full flex-center overflow-hidden">
                <img
                    src={img}
                    className="w-full blur-sm scale-105 transition duration-700 ease-out group-hover:blur-[2px] group-hover:scale-110"
                    alt=""
                />
                <div className="absolute inset-0 bg-black/20 transition duration-500 group-hover:bg-black/5"></div>
                <div className="flex-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <i
                        className={`${icon} text-6xl xl:text-8xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110`}
                    ></i>
                </div>
            </div>
            <div className="bg-[#3B3B3B] w-full py-5 px-6 flex-center-between">
                <p className="text-lg xl:text-2xl font-bold">{name}</p>
                <span className="text-sm text-[#858584] font-mono">{count}</span>
            </div>
        </Link>
    );
}
