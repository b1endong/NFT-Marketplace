import Reveal from "../common/Reveal";

export default function Work({imgSrc, title, description, step, delay = 0}) {
    return (
        <Reveal delay={delay} className="h-full">
            <div className="group h-full bg-[#3B3B3B] flex-center gap-5 flex-col px-8 pb-8 pt-2 rounded-2xl ring-1 ring-white/5 relative transition duration-500 hover:-translate-y-1.5 hover:ring-blue-400/30 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]">
                {step && (
                    <span className="absolute top-4 left-5 text-xs font-mono !text-[#858584]">0{step}</span>
                )}
                <img src={imgSrc} alt="" className="transition-transform duration-500 group-hover:scale-105" />
                <div className="flex-center flex-col gap-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="text-md text-center text-[#CCCCCC]">{description}</p>
                </div>
            </div>
        </Reveal>
    );
}
