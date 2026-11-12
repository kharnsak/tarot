import { useContext, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { ArtworkContext } from "../art";

type Layer = { src: string; px: number; py: number; z: number; d: number; ry: number; rz: number; t: number; dl: number; main?: boolean };

/** Right half of the hero: real card back + real faces floating in 3D with soft mouse parallax. */
export default function HeroStage() {
  const artwork = useContext(ArtworkContext);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", String(((e.clientX / innerWidth) * 2 - 1).toFixed(3)));
        el.style.setProperty("--my", String(((e.clientY / innerHeight) * 2 - 1).toFixed(3)));
      });
    };
    const leave = () => { el.style.setProperty("--mx", "0"); el.style.setProperty("--my", "0"); };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); };
  }, [reduce]);

  const faces = Object.values(artwork).slice(0, 2);
  const back = `${import.meta.env.BASE_URL}cards/back.webp`;
  const layers: Layer[] = [
    ...(faces[0] ? [{ src: faces[0], px: -0.98, py: 0.06, z: -90, d: 14, ry: 22, rz: -5, t: 11, dl: -2 }] : []),
    ...(faces[1] ? [{ src: faces[1], px: 0.98, py: 0.06, z: -90, d: 14, ry: -22, rz: 5, t: 13, dl: -6 }] : []),
    { src: back, px: 0, py: 0.08, z: 30, d: 26, ry: 0, rz: 0, t: 10, dl: 0, main: true },
  ];
  return (
    <div className="stage" ref={ref} aria-hidden="true">
      <span className="stage-glow" />
      <span className="stage-ring" />
      <span className="stage-ring r2" />
      <div className="stage-scene">
        {layers.map((l, i) => (
          <div
            key={i}
            className={`s-card ${l.main ? "main" : ""}`}
            style={{ ["--px" as string]: l.px, ["--py" as string]: l.py, ["--z" as string]: `${l.z}px`, ["--d" as string]: l.d } as React.CSSProperties}
          >
            <div className="s-float" style={{ ["--ry" as string]: `${l.ry}deg`, ["--rz" as string]: `${l.rz}deg`, ["--t" as string]: `${l.t}s`, ["--dl" as string]: `${l.dl}s` } as React.CSSProperties}>
              <img src={l.src} alt="" draggable={false} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
