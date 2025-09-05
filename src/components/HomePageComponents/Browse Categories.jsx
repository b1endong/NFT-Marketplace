import Category from "./Category";

export default function BrowseCategories() {
    return (
        <div className="py-20">
            <h2 className="text-4xl font-bold">Browse Categories</h2>
            <div className="grid grid-cols-4 grid-rows-2 gap-8 mt-15 place-items-center">
                <Category />
                <Category />
                <Category />
                <Category />
                <Category />
                <Category />
                <Category />
                <Category />
            </div>
        </div>
    );
}
