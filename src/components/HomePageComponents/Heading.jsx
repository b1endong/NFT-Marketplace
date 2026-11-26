import Reveal from "../common/Reveal";

export default function Heading({title, subtitle}) {
    return (
        <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
            <p className="text-lg mt-2 text-[#CCCCCC]">{subtitle}</p>
        </Reveal>
    );
}
