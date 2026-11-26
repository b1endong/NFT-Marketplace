export default function SubscribeButton() {
    return (
        <div className="w-full relative ">
            <input
                type="text"
                placeholder="Enter your email"
                className="w-full bg-white text-black p-5 pr-36 sm:pr-5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/30 transition"
            />
            <button className="base-button absolute right-0 inset-y-0 px-5 sm:w-[40%] whitespace-nowrap">
                <i className="fa-regular fa-envelope mr-3"></i>
                Subscribe
            </button>
        </div>
    );
}
