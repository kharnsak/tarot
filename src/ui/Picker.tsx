import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CardArt } from "../art";
import { cardById } from "../tarot";
import FlipCard from "./FlipCard";
import Hand from "./Hand";
import { ui } from "./copy";
import { hintSeen, markHintSeen } from "./theme";

const N = 15; // cards in the fan
const SPAN = 28; // degrees each side
const STEP = (SPAN * 2) / (N - 1);
const CARD_W = 88;
const PIVOT = 330; // distance from card top to fan pivot
const R = PIVOT - 70; // pivot to card centre
const angleOf = (i: number) => -SPAN + i * STEP;
const centreX = (i: number) => R * Math.sin((angleOf(i) * Math.PI) / 180);

type Fly = { x: number; y: number; rotate: number; scale: number };

export default function Picker({
  deck,
  count,
  onPicked,
  onRead,
}: {
  deck: string[];
  count: 1 | 3;
  onPicked: (indices: number[]) => void;
  onRead: () => void;
}) {
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState<number[]>([]);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [ghost, setGhost] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [hint, setHint] = useState(false);
  const [scale, setScale] = useState(1);
  const fanRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pressed = useRef(false);
  const full = picked.length >= count;
  const phase = !full ? "pick" : revealed >= count ? "done" : revealed > 0 || false ? "reveal" : "ready";
  const [revealing, setRevealing] = useState(false);

  useLayoutEffect(() => {
    const el = fanRef.current?.parentElement;
    if (!el) return;
    const rad = (SPAN * Math.PI) / 180;
    const half = R * Math.sin(rad) + (CARD_W / 2) * Math.cos(rad) + ((CARD_W * 350) / 220 / 2) * Math.sin(rad);
    const fit = () => setScale(Math.min(1, (el.clientWidth - 6) / (2 * half)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // first-time hand hint
  useEffect(() => {
    if (reduce || hintSeen()) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setHint(true), 1300));
    timers.push(window.setTimeout(() => { setHint(false); setGhost(null); markHintSeen(); }, 1300 + 3700));
    // the card under the hand lifts as it passes
    const start = 1300;
    for (let k = 0; k <= 12; k++)
      timers.push(window.setTimeout(() => setGhost(1 + k), start + 560 + k * 205));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  const nearest = useCallback(
    (clientX: number) => {
      const rect = fanRef.current!.getBoundingClientRect();
      const dx = (clientX - rect.left - rect.width / 2) / scale;
      let best = -1;
      let bd = Infinity;
      for (let i = 0; i < N; i++) {
        if (picked.includes(i)) continue;
        const d = Math.abs(centreX(i) - dx);
        if (d < bd) { bd = d; best = i; }
      }
      return best < 0 ? null : best;
    },
    [picked, scale],
  );

  function pick(i: number) {
    if (full || picked.includes(i)) return;
    const card = cardRefs.current[i];
    const slot = slotRefs.current[picked.length];
    let fly: Fly = { x: 0, y: 160, rotate: angleOf(i), scale: 1 };
    if (card && slot) {
      const c = card.getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      fly = {
        x: c.left + c.width / 2 - (s.left + s.width / 2),
        y: c.top + c.height / 2 - (s.top + s.height / 2),
        rotate: angleOf(i),
        scale: c.width / s.width,
      };
    }
    const next = [...picked, i];
    setFlies([...flies, fly]);
    setPicked(next);
    setActive(null);
    setGhost(null);
    setHint(false);
    markHintSeen();
    navigator.vibrate?.(12);
    if (next.length === count) onPicked(next);
  }

  function down(e: React.PointerEvent) {
    if (full) return;
    pressed.current = true;
    setHint(false);
    setGhost(null);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setActive(nearest(e.clientX));
  }
  function move(e: React.PointerEvent) {
    if (full) return;
    if (e.pointerType === "mouse" || pressed.current) {
      const n = nearest(e.clientX);
      if (n !== active) {
        setActive(n);
        if (n !== null && pressed.current) navigator.vibrate?.(4);
      }
    }
  }
  function up(e: React.PointerEvent) {
    if (!pressed.current) return;
    pressed.current = false;
    const n = nearest(e.clientX);
    if (n !== null) pick(n);
    setActive(null);
  }
  function cancel() {
    pressed.current = false;
    setActive(null);
  }

  function reveal() {
    setRevealing(true);
    const gap = reduce ? 350 : 800;
    for (let k = 1; k <= count; k++)
      window.setTimeout(() => setRevealed(k), (k - 1) * gap + 150);
  }

  const lift = (i: number) => (active ?? ghost) === i;
  const slotW = count === 1 ? 150 : 100;
  const next = Math.min(picked.length + 1, count);

  return (
    <div className="picker">
      <div className="pick-head">
        <h2 tabIndex={-1} id="pick-title">
          {full ? ui.pick.pickedAll : ui.pick.title(next, count)}
        </h2>
        <p className="muted" aria-live="polite">{ui.pick.sub}</p>
      </div>

      <div className={`slots count-${count}`} style={{ ["--slot-w" as string]: `${slotW}px` }}>
        {Array.from({ length: count }, (_, k) => {
          const idx = picked[k];
          const card = idx !== undefined ? cardById.get(deck[idx]) : undefined;
          return (
            <div className="slot" key={k}>
              <div className="slot-box" ref={(el) => { slotRefs.current[k] = el; }}>
                <span className="slot-ring" aria-hidden="true" />
                {card && (
                  <motion.div
                    className="slot-card"
                    initial={reduce ? { opacity: 0 } : { x: flies[k]?.x, y: flies[k]?.y, rotate: flies[k]?.rotate, scale: flies[k]?.scale }}
                    animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
                    transition={reduce ? { duration: 0.25 } : { type: "spring", stiffness: 120, damping: 18 }}
                  >
                    <FlipCard card={card} flipped={revealed > k} />
                  </motion.div>
                )}
              </div>
              {count === 3 && <span className="slot-label">{["ที่ผ่านมา", "ตอนนี้", "ข้างหน้า"][k]}</span>}
            </div>
          );
        })}
      </div>

      <div className="fan-wrap" style={{ height: 260 * scale }}>
        <AnimatePresence>
          {!full && (
            <motion.div
              className="fan"
              ref={fanRef}
              style={{ scale, ["--card-w" as string]: `${CARD_W}px` }}
              exit={{ opacity: 0, y: 40, transition: { duration: 0.4 } }}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={cancel}
              onPointerLeave={(e) => e.pointerType === "mouse" && cancel()}
              role="group"
              aria-label="พัดไพ่"
            >
              {Array.from({ length: N }, (_, i) => (
                <motion.div
                  className="fan-slot"
                  key={i}
                  style={{ transformOrigin: `50% ${PIVOT}px`, visibility: picked.includes(i) ? "hidden" : "visible", zIndex: lift(i) ? 40 : i }}
                  initial={reduce ? { rotate: angleOf(i), opacity: 0 } : { rotate: 0, y: 10 }}
                  animate={{ rotate: angleOf(i), y: 0, opacity: 1 }}
                  transition={reduce ? { duration: 0.4, delay: i * 0.01 } : { type: "spring", stiffness: 120, damping: 20, delay: 0.1 + i * 0.03 }}
                >
                  <motion.div
                    className="fan-card"
                    ref={(el) => { cardRefs.current[i] = el; }}
                    animate={{ y: lift(i) ? -34 : 0, scale: lift(i) ? 1.07 : 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <CardArt decorative />
                    <button
                      className="fan-btn"
                      aria-label={ui.pick.cardAria(i + 1)}
                      tabIndex={i === 0 ? 0 : -1}
                      onClick={(e) => { if (e.detail === 0) pick(i); }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                          const d = e.key === "ArrowRight" ? 1 : -1;
                          const t = document.querySelectorAll<HTMLButtonElement>(".fan-btn")[Math.max(0, Math.min(N - 1, i + d))];
                          t?.focus();
                        }
                      }}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                    />
                  </motion.div>
                </motion.div>
              ))}
              {hint && (
                <div className="hand-pos"><Hand /></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pick-cta">
        {phase === "ready" && !revealing && (
          <motion.button className="button primary" onClick={reveal} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {ui.pick.reveal}
          </motion.button>
        )}
        {(phase === "ready" && revealing) || phase === "reveal" ? (
          <p className="muted" role="status">{ui.pick.revealing}</p>
        ) : null}
        {phase === "done" && (
          <motion.button className="button primary" onClick={onRead} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            {ui.pick.read}
          </motion.button>
        )}
      </div>
    </div>
  );
}
