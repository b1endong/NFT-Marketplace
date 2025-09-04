import Collection from "./Collection";
import Heading from "./Heading";

export default function TrendingCollection() {
    return (
        <div className="py-20">
            <Heading
                title="Trending Collections"
                subtitle="Check out the most popular NFT collections right now."
            />
            <div className="flex-center-between gap-8 mt-15">
                <Collection />
                <Collection />
                <Collection />
            </div>
        </div>
    );
}
