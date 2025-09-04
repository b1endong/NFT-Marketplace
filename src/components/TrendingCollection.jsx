import Collection from "./Collection";

export default function TrendingCollection() {
    return (
        <div className="py-20">
            <h2 className="text-4xl font-bold">Trending Collections</h2>
            <p className="text-lg mt-2">
                Check out the most popular NFT collections right now.
            </p>
            <div className="flex-center-between gap-8 mt-15">
                <Collection />
                <Collection />
                <Collection />
            </div>
        </div>
    );
}
