export default function SubcribeWidget() {
    return (
        <div className="py-20">
            <div className="bg-[#3B3B3B] flex-center gap-20 rounded-2xl py-15 px-12">
                <img src="/Subscribe Photo.svg" alt="Image 1" />
                <div className="flex-center flex-col gap-10">
                    <div className="gap-2">
                        <h1 className="text-4xl font-bold">
                            Join our weekly digest
                        </h1>
                        <p className="text-lg">
                            Get exclusive promotions & updates straight to your
                            inbox.
                        </p>
                    </div>
                    <div className="w-full relative ">
                        <input
                            type="text"
                            placeholder="Enter your email"
                            className="w-[90%] bg-white text-black p-5 rounded-2xl "
                        />
                        <button className="base-button absolute right-0 py-5 w-[40%]">
                            <i className="fa-regular fa-envelope mr-3"></i>
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
