import {useEffect, useRef, useState} from "react";

export const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Số chạy từ giá trị cũ tới `target` (ease-out).
export function useCountUp(target, duration = 1200) {
    const [value, setValue] = useState(0);
    const valueRef = useRef(0);

    useEffect(() => {
        if (prefersReducedMotion()) {
            valueRef.current = target;
            setValue(target);
            return;
        }
        const from = valueRef.current;
        const start = performance.now();
        let frame;
        const step = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const v = from + (target - from) * (1 - Math.pow(1 - p, 3));
            valueRef.current = v;
            setValue(v);
            if (p < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return value;
}

// Nghiêng nhẹ phần tử theo con trỏ (CSS 3D). Dùng kèm class "tilt-card".
export function useTilt(max = 6) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || prefersReducedMotion() || window.matchMedia?.("(hover: none)").matches) return;
        let frame = 0;
        const onMove = (e) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                el.classList.add("is-tilting");
                el.style.setProperty("--rx", `${((0.5 - py) * max).toFixed(2)}deg`);
                el.style.setProperty("--ry", `${((px - 0.5) * max).toFixed(2)}deg`);
                el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
                el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
            });
        };
        const onLeave = () => {
            cancelAnimationFrame(frame);
            el.classList.remove("is-tilting");
            el.style.setProperty("--rx", "0deg");
            el.style.setProperty("--ry", "0deg");
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
            cancelAnimationFrame(frame);
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
        };
    }, [max]);

    return ref;
}

// true khi phần tử lần đầu lọt vào màn hình.
export function useInView(options) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (!("IntersectionObserver" in window)) {
            setInView(true);
            return;
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    io.disconnect();
                }
            },
            {threshold: 0.1, rootMargin: "0px 0px -40px 0px", ...options}
        );
        io.observe(el);
        return () => io.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [ref, inView];
}
