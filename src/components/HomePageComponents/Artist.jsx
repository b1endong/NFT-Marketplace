export default function Artist({rank, name, sales}) {
    return (
        <div className="flex-center flex-col bg-[#3B3B3B] p-5 rounded-2xl relative">
            <p className="flex-center bg-[#2B2B2B] w-8 h-8 rounded-full absolute top-4 left-5 text-sm text-white">
                {rank}
            </p>

            <img src="../../public/Avatar Placeholder.svg" alt="Avatar" />
            <div className="mt-5 flex-center flex-col gap-2">
                <h3 className="text-xl font-bold">{name}</h3>
                <p className=" text-[#858584]">
                    Total Sales:{" "}
                    <strong className="font-normal">{sales} ETH</strong>
                </p>
            </div>
        </div>
    );
}
