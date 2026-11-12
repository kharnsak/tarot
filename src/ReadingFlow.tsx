import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Share2, MessageCircleQuestion } from "lucide-react";
import { CardArt } from "./art";
import { cardById, cards, decision, interpretation } from "./tarot";
import type { Topic } from "./tarot";
import { dayKey, drawCards, loadJournal, thaiDate } from "./storage";
import type { Reading } from "./storage";
import Picker from "./ui/Picker";
import FlipCard from "./ui/FlipCard";
import { chips, positions, ui } from "./ui/copy";

type Step = "setup" | "pick" | "result";
const spring = { type: "spring", stiffness: 120, damping: 20 } as const;

function Deck({ shuffling }: { shuffling: boolean }) {
  const reduce = useReducedMotion();
  const n = 14;
  return (
    <div className={`deck ${shuffling ? "is-shuffling" : ""}`} aria-hidden="true">
      {Array.from({ length: n }, (_, k) => {
        const side = k % 2 ? 1 : -1;
        const drop = 0.34 + 0.5 * (k / n);
        const x = side * 62;
        return (
          <motion.div
            className="deck-card"
            key={k}
            style={{ zIndex: k }}
            initial={false}
            animate={
              shuffling && !reduce
                ? {
                    x: [0, x, x, 0, 0],
                    y: [0, -6, -14, -k * 0.5, -k * 0.5],
                    rotate: [0, side * 7, side * 7, 0, 0],
                  }
                : { x: 0, y: -k * 0.8, rotate: 0 }
            }
            transition={
              shuffling && !reduce
                ? { duration: 1.1, repeat: Infinity, ease: "easeInOut", times: [0, 0.3, drop, drop + 0.1, 1] }
                : spring
            }
          >
            <CardArt decorative />
          </motion.div>
        );
      })}
    </div>
  );
}

export default function ReadingFlow({
  daily = false,
  initialChip,
  existing,
  onSave,
  onShare,
  onClose,
}: {
  daily?: boolean;
  initialChip?: string;
  existing?: Reading;
  onSave: (r: Reading) => void;
  onShare: (r: Reading) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const startChip = chips.find((c) => c.id === initialChip) ?? chips[0];
  const [step, setStep] = useState<Step>(existing ? "result" : "setup");
  const chip = startChip;
  const [count, setCount] = useState<1 | 3>(1);
  const [question, setQuestion] = useState(startChip.preset);
  const [reading, setReading] = useState<Reading | undefined>(existing);
  const [deck, setDeck] = useState<string[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [asking, setAsking] = useState(false);
  const holdStart = useRef(0);
  const holdTimer = useRef<number>(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const topic: Topic = reading?.topic ?? (daily ? "general" : chip.topic);
  const decide = (existing?.topic ?? chip.topic) === "decision";
  const pickCount = decide ? 1 : count;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  function begin(q = question) {
    if (daily) {
      const already = loadJournal().readings.find((r) => r.daily && r.date === dayKey());
      if (already) {
        setReading(already);
        setStep("result");
        return;
      }
    }
    setQuestion(q);
    setDeck(drawCards(cards.map((c) => c.id), 15));
    setShuffling(false);
    setStep("pick");
  }

  // press and hold to shuffle: at least 1.1s of riffle, then go to the fan
  function holdDown() {
    if (shuffling) return;
    holdStart.current = performance.now();
    window.clearTimeout(holdTimer.current);
    setShuffling(true);
    navigator.vibrate?.([10, 40, 10, 40, 10]);
  }
  function holdUp() {
    if (!shuffling) return;
    const wait = Math.max(0, (reduce ? 250 : 1150) - (performance.now() - holdStart.current));
    holdTimer.current = window.setTimeout(() => begin(), wait);
  }

  function picked(indices: number[]) {
    const result: Reading = {
      id: crypto.randomUUID(),
      date: dayKey(),
      createdAt: new Date().toISOString(),
      topic,
      question: question.trim(),
      cards: indices.map((i) => deck[i]),
      daily,
    };
    const current = daily ? loadJournal().readings.find((r) => r.daily && r.date === dayKey()) : undefined;
    setReading(current || result);
    onSave(current || result);
  }

  function again(q: string) {
    setReading(undefined);
    setAsking(false);
    setQuestion(q);
    setCount(1);
    setDeck(drawCards(cards.map((c) => c.id), 15));
    setStep("pick");
  }

  const result = reading?.cards.map((id) => cardById.get(id)!) ?? [];
  const stepIndex = step === "setup" ? 0 : step === "pick" ? 1 : 2;

  return (
    <div className="reading-flow">
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={stepIndex + 1} aria-label={ui.steps[stepIndex]}>
        {ui.steps.map((s, i) => (
          <span key={s} className={i <= stepIndex ? "on" : ""}>
            <i />
            <b>{s}</b>
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" className="step setup" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={spring}>
            <h2 ref={heading} tabIndex={-1}>{daily ? ui.setup.dailyTitle : ui.setup.title}</h2>
            <p className="muted lead">{daily ? ui.setup.dailySub : ui.setup.sub}</p>

            {!daily && (
              <div className="ask">
                <label className="sr-only" htmlFor="question">{ui.setup.label}</label>
                <textarea id="question" aria-label={ui.setup.label} value={question} maxLength={300} rows={2} placeholder={ui.setup.placeholder} onChange={(e) => setQuestion(e.target.value)} />
                <div className="examples" aria-label={ui.setup.examples}>
                  {chip.examples.map((ex) => (
                    <button key={ex} type="button" className="pill" onClick={() => setQuestion(ex)}>{ex}</button>
                  ))}
                </div>
                {!decide && (
                  <div className="segment" role="group" aria-label={ui.setup.spreadLabel}>
                    {([1, 3] as const).map((n) => (
                      <button key={n} type="button" aria-pressed={count === n} className={count === n ? "on" : ""} onClick={() => setCount(n)}>
                        {n === 1 ? ui.setup.spread1 : ui.setup.spread3}
                      </button>
                    ))}
                  </div>
                )}
                {!decide && count === 3 && <p className="fine center">{ui.setup.spreadHint3}</p>}
              </div>
            )}

            <div className="deck-zone">
              <button
                className="deck-button"
                aria-label={ui.setup.holdAria}
                onPointerDown={holdDown}
                onPointerUp={holdUp}
                onPointerCancel={holdUp}
                onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); holdDown(); } }}
                onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") holdUp(); }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Deck shuffling={shuffling} />
              </button>
              <p className="hold-hint" role="status">{shuffling ? ui.setup.holding : ui.setup.holdHint}</p>
            </div>
          </motion.div>
        )}

        {step === "pick" && (
          <motion.div key="pick" className="step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Picker deck={deck} count={pickCount as 1 | 3} onPicked={picked} onRead={() => setStep("result")} />
          </motion.div>
        )}

        {step === "result" && reading && (
          <motion.div key="result" className="step result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <p className="eyebrow center">
              {reading.daily ? ui.home.dailyTitle : (chips.find((c) => c.topic === reading.topic)?.label ?? "")} · {thaiDate(new Date(reading.createdAt), true)}
            </p>
            <h2 ref={heading} tabIndex={-1} className="sr-only">{ui.result.title}</h2>
            <div className={`result-cards count-${result.length}`}>
              {result.map((card, i) => (
                <motion.figure className="result-card" key={card.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 + i * 0.12 }}>
                  <FlipCard card={card} flipped />
                  {result.length > 1 && <figcaption>{positions[i]}</figcaption>}
                </motion.figure>
              ))}
            </div>
            {reading.question && <p className="your-question">“{reading.question}”</p>}
            <motion.p className="quote" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={spring}>
              {result[result.length === 3 ? 1 : 0].keyword}
            </motion.p>
            <div className="readings">
              {result.map((card, i) => (
                <motion.article className="read-block" key={card.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={spring}>
                  <header>
                    {result.length > 1 && <small>{positions[i]}</small>}
                    <h3>{card.thai}</h3>
                    <span className="en">{card.name}</span>
                  </header>
                  <p>{interpretation(card, reading.topic)}</p>
                  {reading.topic === "decision" && <p className="verdict">{decision(card)}</p>}
                  {card.advice && <p className="advice"><b>{ui.result.advice}</b>{card.advice}</p>}
                </motion.article>
              ))}
            </div>

            <div className="result-actions">
              <button className="button primary" onClick={() => onShare(reading)}>
                <Share2 size={18} />
                {ui.result.share}
              </button>
              <button className="button secondary" aria-expanded={asking} onClick={() => setAsking(!asking)}>
                <MessageCircleQuestion size={18} />
                {ui.result.ask}
              </button>
            </div>
            <AnimatePresence>
              {asking && (
                <motion.div className="followups" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <p className="fine center">{ui.result.askTitle}</p>
                  {(chips.find((c) => c.topic === reading.topic && c.id === chip.id) ?? chips.find((c) => c.topic === reading.topic) ?? chips[5]).followUps.map((q) => (
                    <button key={q} className="pill block" onClick={() => again(q)}>{q}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <button className="text-button" onClick={onClose}>{ui.result.done}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
