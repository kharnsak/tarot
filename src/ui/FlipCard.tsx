import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CardArt } from "../art";
import type { Card } from "../tarot";

/** 3D Y-axis flip (700ms) with a gold sweep and a little dust. */
export default function FlipCard({
  card,
  flipped,
  className = "",
  delay = 0,
  reversed = false,
}: {
  card: Card;
  flipped: boolean;
  className?: string;
  delay?: number;
  reversed?: boolean;
}) {
  const reduce = useReducedMotion();
  const [burst, setBurst] = useState(false);
  const dust = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.2;
        const r = 50 + ((i * 37) % 40);
        return {
          x: Math.cos(a) * r,
          y: Math.sin(a) * r * 1.2 - 10,
          s: 2 + (i % 3),
          d: 0.35 + (i % 5) * 0.04,
        };
      }),
    [],
  );
  useEffect(() => {
    if (!flipped || reduce) return;
    const t = window.setTimeout(() => setBurst(true), delay * 1000 + 380);
    return () => window.clearTimeout(t);
  }, [flipped, reduce, delay]);
  return (
    <div className={`flip ${className}`}>
      {reduce ? (
        <div className="flip-plain">
          <motion.div
            className="flip-face"
            animate={{ opacity: flipped ? 0 : 1 }}
            transition={{ duration: 0.3, delay }}
          >
            <CardArt decorative />
          </motion.div>
          <motion.div
            className="flip-face"
            initial={false}
            animate={{ opacity: flipped ? 1 : 0 }}
            transition={{ duration: 0.3, delay }}
          >
            <div className={reversed ? "is-reversed" : undefined}><CardArt card={card} /></div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          className="flip-inner"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, delay, ease: [0.35, 0.05, 0.2, 1] }}
        >
          <div className="flip-face flip-back">
            <CardArt decorative />
          </div>
          <div className="flip-face flip-front">
            <div className={reversed ? "is-reversed" : undefined}><CardArt card={card} /></div>
            {flipped && (
              <motion.span
                className="flip-shine"
                aria-hidden="true"
                initial={{ x: "-130%" }}
                animate={{ x: "130%" }}
                transition={{ duration: 0.9, delay: delay + 0.35, ease: "easeInOut" }}
              />
            )}
          </div>
        </motion.div>
      )}
      {burst && !reduce && (
        <span className="dust" aria-hidden="true">
          {dust.map((p, i) => (
            <motion.i
              key={i}
              style={{ width: p.s, height: p.s }}
              initial={{ x: 0, y: 0, opacity: 0.95, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.9 + p.d, ease: "easeOut" }}
            />
          ))}
        </span>
      )}
    </div>
  );
}
