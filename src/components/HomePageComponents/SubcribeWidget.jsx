import SubscribeButton from "../SubscribeButton";

export default function SubcribeWidget() {
    return (
        <div className="py-20">
            <div className="bg-[#3B3B3B] flex-center gap-20 rounded-2xl py-15 px-12">
                <img src="/Subscribe Photo.svg" alt="Image 1" />
                <div className="flex-center flex-col gap-10">
                    <div className="">
                        <div className="flex flex-col gap-3 mb-10">
                            <h1 className="text-5xl font-bold">
                                Join our weekly digest
                            </h1>
                            <p className="text-lg">
                                Get exclusive promotions & updates straight{" "}
                                <br /> to your inbox.
                            </p>
                        </div>
                        <SubscribeButton />
                    </div>
                </div>
            </div>
        </div>
    );
}
