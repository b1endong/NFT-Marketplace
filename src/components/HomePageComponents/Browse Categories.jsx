import Category from "./Category";
import CATEGORIES from "../../config/categories";
import {useMarket} from "../../context/MarketContext";

export default function BrowseCategories() {
    const {nfts} = useMarket();
    return (
        <div className="py-20">
            <h2 className="text-4xl font-bold">Browse Categories</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-15 place-items-center">
                {CATEGORIES.map((category) => (
                    <Category
                        key={category.id}
                        {...category}
                        count={nfts.filter((n) => n.category === category.name).length}
                    />
                ))}
            </div>
        </div>
    );
}
