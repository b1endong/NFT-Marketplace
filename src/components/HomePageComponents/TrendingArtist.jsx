import Heading from "./Heading";
import Artist from "./Artist";
import {testArtists} from "../../testData/Test";

export default function TrendingArtist() {
    return (
        <div className="py-20">
            <div className="flex-center-between">
                <Heading
                    title="Trending Artists"
                    subtitle="Check out the most popular NFT artists right now."
                />
                <button className="base-button bg-transparent border-3 font-normal border-blue-500">
                    <i className="fa-solid fa-ranking-star mr-3 text-blue-500"></i>
                    View Ranking
                </button>
            </div>
            <div className="grid grid-cols-4 grid-rows-3 gap-8 mt-15">
                {testArtists.map((artist) => {
                    return <Artist key={artist.rank} {...artist} />;
                })}
            </div>
        </div>
    );
}
