import Category from "./Category";
import Categories from "../../testData/TestCategories";

export default function BrowseCategories() {
    return (
        <div className="py-20">
            <h2 className="text-4xl font-bold">Browse Categories</h2>
            <div className="grid grid-cols-4 grid-rows-2 gap-8 mt-15 place-items-center">
                {Categories.map((category) => {
                    return <Category key={category.id} {...category} />;
                })}
            </div>
        </div>
    );
}
