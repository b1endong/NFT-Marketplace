export function Spinner({className = ""}) {
    return <i className={`fa-solid fa-spinner fa-spin ${className}`}></i>;
}

export function EmptyState({icon = "fa-regular fa-folder-open", title, children}) {
    return (
        <div className="flex-center flex-col gap-4 py-16 text-center col-span-full">
            <i className={`${icon} text-5xl text-[#858584]`}></i>
            <p className="text-xl font-bold">{title}</p>
            {children && <div className="text-[#CCCCCC]">{children}</div>}
        </div>
    );
}

export function ErrorState({message, onRetry}) {
    return (
        <div className="flex-center flex-col gap-4 py-16 text-center col-span-full">
            <i className="fa-solid fa-triangle-exclamation text-5xl text-red-400"></i>
            <p className="text-xl font-bold">Could not load data from the blockchain</p>
            <p className="text-[#CCCCCC] max-w-xl break-words">{message}</p>
            {onRetry && (
                <button className="base-button px-8" onClick={onRetry}>
                    Retry
                </button>
            )}
        </div>
    );
}
