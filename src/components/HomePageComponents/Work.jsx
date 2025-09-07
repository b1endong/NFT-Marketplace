export default function Work({imgSrc, title, description}) {
    return (
        <div className="bg-[#3B3B3B] flex-center gap-5 flex-col px-8 pb-8 pt-2 rounded-2xl">
            <img src={imgSrc} alt="" />
            <div className="flex-center flex-col gap-4 ">
                <h1 className="text-xl font-bold ">{title}</h1>
                <p className="text-md text-center">{description}</p>
            </div>
        </div>
    );
}
