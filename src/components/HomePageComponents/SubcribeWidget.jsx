import SubscribeButton from "../SubscribeButton";
import Reveal from "../common/Reveal";

export default function SubcribeWidget() {
    return (
        <Reveal className="py-20">
            <div className="bg-[#3B3B3B] flex-center flex-col lg:flex-row gap-10 lg:gap-20 rounded-2xl py-10 lg:py-15 px-6 lg:px-12">
                <img src="/Subscribe Photo.svg" alt="Image 1" />
                <div className="flex-center flex-col gap-10">
                    <div className="">
                        <div className="flex flex-col gap-3 mb-10">
                            <h1 className="text-4xl lg:text-5xl font-bold">
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
        </Reveal>
    );
}
