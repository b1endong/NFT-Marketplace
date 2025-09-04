export default function Heading({title, subtitle}) {
    return (
        <div>
            <h2 className="text-4xl font-bold">{title}</h2>
            <p className="text-lg mt-2">{subtitle}</p>
        </div>
    );
}
