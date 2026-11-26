import {Link} from "react-router-dom";
import Heading from "./Heading";
import Artist from "./Artist";
import Reveal from "../common/Reveal";
import {useRankings} from "../../hooks/useRankings";
import {useMarket} from "../../context/MarketContext";

export default function TrendingArtist() {
    const {creators} = useRankings();
    const {loading} = useMarket();
    if (!loading && creators.length === 0) return null;

    return (
        <div className="py-20">
            <div className="flex-center-between flex-wrap gap-4">
                <Heading title="Top Creators" subtitle="Checkout top rated creators on the KSEA Marketplace." />
                <Link to="/rankings" className="base-button bg-transparent border-3 font-normal border-blue-500 px-6">
                    <i className="fa-solid fa-ranking-star mr-3 text-blue-500"></i>
                    View Rankings
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                {loading
                    ? Array.from({length: 4}, (_, i) => <div key={i} className="h-64 bg-[#3B3B3B] rounded-2xl skeleton" />)
                    : creators.slice(0, 12).map((artist, i) => (
                          <Reveal key={artist.address} delay={(i % 4) * 80}>
                              <Artist {...artist} />
                          </Reveal>
                      ))}
            </div>
        </div>
    );
}
