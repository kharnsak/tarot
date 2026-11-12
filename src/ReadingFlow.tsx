import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Share2, MessageCircleQuestion } from "lucide-react";
import { CardArt } from "./art";
import { astroProfile } from "./astro";
import { cardText, dailyCard, drawCards as drawTarot, drawSpread, getDeck, SPREADS, yesNo } from "./tarot";
import type { SpreadId, Topic } from "./tarot";
import { dayKey, drawCards, loadBirth, loadJournal, thaiDate, userId } from "./storage";
import type { Reading } from "./storage";
import { focusOf, isYesNo, resolveCards, quoteIndex } from "./reading";
import followups from "../content/followup.json";
import Picker from "./ui/Picker";
import FlipCard from "./ui/FlipCard";
import { chipOf, chips, ui } from "./ui/copy";

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
  const startChip = chips.find((c) => c.id === initialChip) ?? (existing ? chipOf(existing) : chips[0]);
  const [step, setStep] = useState<Step>(existing ? "result" : "setup");
  const chip = startChip;
  const [count, setCount] = useState<1 | 3>(1);
  const [question, setQuestion] = useState(startChip.preset);
  const [reading, setReading] = useState<Reading | undefined>(existing);
  const [deck, setDeck] = useState<string[]>([]);
  const [fanReversed, setFanReversed] = useState<boolean[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [asking, setAsking] = useState(false);
  const holdStart = useRef(0);
  const holdTimer = useRef<number>(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const topic: Topic = reading?.topic ?? (daily ? "general" : chip.topic);
  const spreadId: SpreadId | null = daily ? "daily" : chip.spread;
  const toggle = !daily && spreadId === null;
  const pickCount = (spreadId ? SPREADS[spreadId].count : count) as 1 | 3;
  const pickLabels = spreadId ? SPREADS[spreadId].positions.map((p) => p.label) : count === 3 ? SPREADS.love3.positions.map((p) => p.label) : undefined;
  const fresh = () => drawCards(getDeck("major").map((c) => c.id), 15);
  const personal = useMemo(() => {
    const birth = loadBirth();
    return birth ? astroProfile(birth)?.lines[0] : undefined;
  }, []);
  const askKey = reading ? chipOf(reading).followKey : null;
  const followList = useMemo(() => {
    const pool = askKey ? (followups as Record<string, string[]>)[askKey] : undefined;
    if (!pool?.length) return (reading ? chipOf(reading) : chip).followUps;
    return drawCards(pool, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askKey, reading?.id]);

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
    setDeck(fresh());
    setFanReversed([]);
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
    // The draw itself comes from the data API; the fan is only the ritual, so the chosen slots
    // are dealt the drawn cards.
    const sid = spreadId ?? (count === 3 ? "love3" : null);
    const drawn = daily
      ? [dailyCard(userId(), dayKey())]
      : sid
        ? drawSpread(sid)
        : drawTarot(1, { allowReversed: true });
    const nextDeck = [...deck];
    indices.forEach((slot, i) => (nextDeck[slot] = drawn[i].card.id));
    setDeck(nextDeck);
    setFanReversed(drawn.map((d) => d.reversed));
    const result: Reading = {
      id: crypto.randomUUID(),
      date: dayKey(),
      createdAt: new Date().toISOString(),
      topic,
      question: question.trim(),
      cards: drawn.map((d) => d.card.id),
      daily,
      spread: sid ?? undefined,
      reversed: drawn.map((d) => d.reversed),
      focus: daily ? "core" : chip.focus,
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
    setDeck(fresh());
    setFanReversed([]);
    setStep("pick");
  }

  const result = reading ? resolveCards(reading) : [];
  const focus = reading ? focusOf(reading) : "core";
  const qi = quoteIndex(result.length);
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
                {toggle && (
                  <div className="segment" role="group" aria-label={ui.setup.spreadLabel}>
                    {([1, 3] as const).map((n) => (
                      <button key={n} type="button" aria-pressed={count === n} className={count === n ? "on" : ""} onClick={() => setCount(n)}>
                        {n === 1 ? ui.setup.spread1 : ui.setup.spread3}
                      </button>
                    ))}
                  </div>
                )}
                {pickLabels && pickLabels.length > 1 && <p className="fine center">{pickLabels.join(" · ")}</p>}
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
            <Picker deck={deck} count={pickCount} reversed={fanReversed} labels={pickLabels} onPicked={picked} onRead={() => setStep("result")} />
          </motion.div>
        )}

        {step === "result" && reading && (
          <motion.div key="result" className="step result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <p className="eyebrow center">
              {reading.daily ? ui.home.dailyTitle : chipOf(reading).label} · {thaiDate(new Date(reading.createdAt), true)}
            </p>
            <h2 ref={heading} tabIndex={-1} className="sr-only">{ui.result.title}</h2>
            <div className={`result-cards count-${result.length}`}>
              {result.map((r, i) => (
                <motion.figure className="result-card" key={r.card.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 + i * 0.12 }}>
                  <FlipCard card={r.card} flipped reversed={r.reversed} />
                  {(r.label || r.reversed) && (
                    <figcaption>
                      {r.label}
                      {r.reversed && <span className="reversed-tag">{ui.result.reversed}</span>}
                    </figcaption>
                  )}
                </motion.figure>
              ))}
            </div>
            {reading.question && <p className="your-question">“{reading.question}”</p>}
            {isYesNo(reading) && (() => {
              const v = ui.result.verdict[yesNo(result[0].card, result[0].reversed)];
              return (
                <div className="verdict-big" data-testid="verdict">
                  <small className="fine">{ui.result.yesno}</small>
                  <strong>{v.big}</strong>
                  <span>{v.sub}</span>
                </div>
              );
            })()}
            <motion.p className="quote" data-testid="quote" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={spring}>
              {cardText(result[qi].card, result[qi].reversed, "advice")}
            </motion.p>
            <div className="readings">
              {result.map((r) => (
                <motion.article className="read-block" key={r.card.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={spring}>
                  <header>
                    {r.label && <small>{r.label}</small>}
                    <h3>{r.card.nameTh}{r.reversed && <span className="reversed-tag">{ui.result.reversed}</span>}</h3>
                    <span className="en">{r.card.nameEn}</span>
                  </header>
                  <p><b className="sr-only">{ui.result.labels[focus]}: </b>{cardText(r.card, r.reversed, focus)}</p>
                </motion.article>
              ))}
            </div>
            {personal && (
              <p className="personal" data-testid="personal"><b>{ui.result.personal}</b>{personal}</p>
            )}

            <div className="result-actions">
              <button className="button primary" data-testid="share" onClick={() => onShare(reading)}>
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
                  {followList.map((q) => (
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
