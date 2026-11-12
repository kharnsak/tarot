import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

const COLORS = ["#f6b9cf", "#d9b45c", "#b9a8ff", "#f6b9cf", "#c9b6ff", "#e8c872"];
// Bodhi leaf, lotus petal and a slim willow leaf: simple outlines with a hairline vein.
const SHAPES = [
  <svg viewBox="0 0 40 48" key="bodhi"><path d="M20 46C19 36 8 30 5 19 2 9 12 2 20 12 28 2 38 9 35 19 32 30 21 36 20 46Z" fill="currentColor" /><path d="M20 46V14" stroke="#fff" strokeOpacity=".55" strokeWidth="1" fill="none" /></svg>,
  <svg viewBox="0 0 40 48" key="lotus"><path d="M20 2C32 14 34 32 20 46 6 32 8 14 20 2Z" fill="currentColor" /><path d="M20 10V42" stroke="#fff" strokeOpacity=".5" strokeWidth="1" fill="none" /></svg>,
  <svg viewBox="0 0 40 48" key="willow"><path d="M20 2C30 12 30 34 20 46 10 34 10 12 20 2Z" fill="currentColor" /><path d="M20 8V44M20 22l6-5M20 30l-6-5" stroke="#fff" strokeOpacity=".5" strokeWidth="1" fill="none" /></svg>,
];
// deterministic pseudo-random so the layout is stable between renders
function rnd(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** A handful of drifting leaves behind the page. CSS-only motion; paused when the tab is hidden. */
export default function Leaves({ count = 11 }: { count?: number }) {
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const fall = 38 + rnd(i, 1) * 28;
        return {
          shape: SHAPES[i % SHAPES.length],
          style: {
            ["--x" as string]: `${((i + 0.5) / count) * 100 + (rnd(i, 2) - 0.5) * 6}%`,
            ["--size" as string]: `${16 + rnd(i, 3) * 16}px`,
            ["--o" as string]: 0.22 + rnd(i, 4) * 0.22,
            ["--fall" as string]: `${fall}s`,
            ["--sway" as string]: `${5 + rnd(i, 5) * 4}s`,
            ["--spin" as string]: `${6 + rnd(i, 6) * 6}s`,
            ["--rot" as string]: `${Math.round(rnd(i, 7) * 160 - 80)}deg`,
            ["--delay" as string]: `${-(rnd(i, 8) * fall).toFixed(1)}s`,
            color: COLORS[i % COLORS.length],
          } as React.CSSProperties,
        };
      }),
    [count],
  );
  if (reduce) return null;
  return (
    <div className={`leaves ${hidden ? "paused" : ""}`} aria-hidden="true">
      {leaves.map((l, i) => (
        <div className="leaf" style={l.style} key={i}>
          <span>{l.shape}</span>
        </div>
      ))}
    </div>
  );
}
