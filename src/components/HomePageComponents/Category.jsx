export default function Categories() {
    return (
        <div className="w-full rounded-2xl overflow-hidden cursor-pointer hover:scale-105 custom-transition">
            <div className="relative w-full flex-center overflow-hidden ">
                <img
                    src="../../public/Category.svg"
                    className="w-full blur-sm "
                    alt=""
                />
                <placeholder className="absolute top-0 left-0 w-full h-full flex-center flex-col bg-white opacity-10"></placeholder>
                <div className="flex-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <i className="fa-solid fa-paintbrush text-9xl max-xl:text-6xl"></i>
                </div>
            </div>
            <div className="bg-[#3B3B3B] w-full ">
                <p className="py-5 px-7 text-xl font-bold">Art</p>
            </div>
        </div>
    );
}
