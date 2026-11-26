import {useInView} from "../../hooks/useEffects";

// Hiện dần (fade + trượt lên) khi cuộn tới. `delay` (ms) để tạo hiệu ứng lần lượt.
export default function Reveal({delay = 0, className = "", style, children, ...rest}) {
    const [ref, inView] = useInView();
    return (
        <div
            ref={ref}
            className={`reveal ${inView ? "is-visible" : ""} ${className}`}
            style={{"--reveal-delay": `${delay}ms`, ...style}}
            {...rest}
        >
            {children}
        </div>
    );
}
