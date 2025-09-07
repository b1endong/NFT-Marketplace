export default function SubscribeButton() {
    return (
        <div className="w-full relative ">
            <input
                type="text"
                placeholder="Enter your email"
                className="w-full bg-white text-black p-5 rounded-2xl "
            />
            <button className="base-button absolute right-0 py-5 w-[40%]">
                <i className="fa-regular fa-envelope mr-3"></i>
                Subscribe
            </button>
        </div>
    );
}
