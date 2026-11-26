import Category from "./Category";
import Heading from "./Heading";
import Reveal from "../common/Reveal";
import CATEGORIES from "../../config/categories";
import {useMarket} from "../../context/MarketContext";

export default function BrowseCategories() {
    const {nfts} = useMarket();
    return (
        <div className="py-20">
            <Heading title="Browse Categories" subtitle="Find NFTs by what you love." />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mt-12 place-items-center">
                {CATEGORIES.map((category, i) => (
                    <Reveal key={category.id} delay={(i % 4) * 80} className="w-full">
                        <Category {...category} count={nfts.filter((n) => n.category === category.name).length} />
                    </Reveal>
                ))}
            </div>
        </div>
    );
}
