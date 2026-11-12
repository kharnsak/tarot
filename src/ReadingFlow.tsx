import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Layers,
  Moon,
  RotateCcw,
  Share2,
  Sparkles,
} from "lucide-react";
import { CardArt } from "./art";
import { cardById, cards, decision, interpretation, topics } from "./tarot";
import type { Topic } from "./tarot";
import { dayKey, drawCards, loadJournal, thaiDate } from "./storage";
import type { Reading } from "./storage";

export default function ReadingFlow({
  daily = false,
  initialTopic = "general",
  existing,
  onSave,
  onShare,
  onClose,
}: {
  daily?: boolean;
  initialTopic?: Topic;
  existing?: Reading;
  onSave: (r: Reading) => void;
  onShare: (r: Reading) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"setup" | "shuffle" | "pick" | "result">(
    existing ? "result" : "setup",
  );
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [count, setCount] = useState<1 | 3>(1);
  const [question, setQuestion] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [reading, setReading] = useState<Reading | undefined>(existing);
  const [deck, setDeck] = useState<string[]>([]);
  const locked = useRef(false);
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  const topicInfo = topics.find((t) => t.id === topic)!;
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (step !== "shuffle") return;
    const timer = window.setTimeout(() => setStep("pick"), reduce ? 200 : 1800);
    return () => window.clearTimeout(timer);
  }, [step, reduce]);
  function start() {
    if (daily) {
      const already = loadJournal().readings.find(
        (r) => r.daily && r.date === dayKey(),
      );
      if (already) {
        setReading(already);
        setStep("result");
        return;
      }
    }
    setDeck(
      drawCards(
        cards.map((c) => c.id),
        10,
      ),
    );
    setPicked([]);
    locked.current = false;
    setStep("shuffle");
  }
  function pick(index: number) {
    if (locked.current || picked.includes(index) || picked.length >= count)
      return;
    const next = [...picked, index];
    setPicked(next);
    if (next.length === count) {
      locked.current = true;
      const result: Reading = {
        id: crypto.randomUUID(),
        date: dayKey(),
        createdAt: new Date().toISOString(),
        topic,
        question: question.trim(),
        cards: next.map((i) => deck[i]),
        daily,
      };
      // Reuse the day's saved card if another tab completed a daily draw first.
      const current = daily
        ? loadJournal().readings.find((r) => r.daily && r.date === dayKey())
        : undefined;
      setReading(current || result);
      onSave(current || result);
    }
  }
  const result = reading?.cards.map((id) => cardById.get(id)!) || [];
  return (
    <div className="reading-flow">
      <div className="reading-progress" aria-label="ขั้นตอนการเปิดไพ่">
        {["ตั้งใจ", "เลือกไพ่", "รับข้อความ"].map((label, i) => {
          const active = step === "setup" ? 0 : step === "result" ? 2 : 1;
          return (
            <span key={label} className={i <= active ? "active" : ""}>
              <b>{i < active ? <Check size={12} /> : i + 1}</b>
              {label}
            </span>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div
            key="setup"
            className="reading-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <span className="eyebrow">A LITTLE SPACE FOR YOUR HEART</span>
            <h2 ref={heading} tabIndex={-1}>
              {daily ? "วันนี้ ใจคุณเป็นอย่างไร" : "มีเรื่องอะไรอยู่ในใจไหม"}
            </h2>
            <p className="muted">
              {daily
                ? "พักหายใจลึก ๆ แล้วให้ไพ่หนึ่งใบเป็นเพื่อนเริ่มต้นวัน"
                : "ค่อย ๆ นึกถึงเรื่องที่อยากเข้าใจ ไม่มีคำถามไหนเล็กเกินไป"}
            </p>
            {!daily && (
              <>
                <div className="topic-tabs" aria-label="หัวข้อ">
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      className={topic === t.id ? "selected" : ""}
                      aria-pressed={topic === t.id}
                      onClick={() => {
                        setTopic(t.id);
                        if (t.id === "decision") setCount(1);
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <label className="field-label" htmlFor="question">
                  คำถามของคุณ <span>ไม่ระบุก็ได้</span>
                </label>
                <textarea
                  id="question"
                  value={question}
                  maxLength={300}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={topicInfo.prompt}
                  rows={3}
                />
                <p className="field-hint">
                  เก็บคำถามนี้ไว้ทบทวนใจ
                  คำอ่านจะอิงหัวข้อและความหมายของไพ่ที่คุณเลือก
                </p>
                {topic !== "decision" && (
                  <fieldset className="spread-options">
                    <legend>เลือกสเปรดที่เหมาะกับใจ</legend>
                    {([1, 3] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={count === n}
                        className={count === n ? "selected" : ""}
                        onClick={() => setCount(n)}
                      >
                        <Layers size={20} />
                        <span>
                          <b>{n === 1 ? "ไพ่ 1 ใบ" : "ไพ่ 3 ใบ"}</b>
                          <small>
                            {n === 1
                              ? "ข้อความที่อยากให้คุณได้ยิน"
                              : "ที่ผ่านมา · เป็นอยู่ · แนวทางข้างหน้า"}
                          </small>
                        </span>
                        {count === n && <Check size={17} />}
                      </button>
                    ))}
                  </fieldset>
                )}
                {topic === "decision" && (
                  <div className="gentle-note">
                    <Sparkles size={17} />
                    <p>
                      ไพ่จะชวนมองทางเลือก ไม่ใช่คำสั่งให้ตอบตกลงหรือปฏิเสธ
                      ใช้ข้อมูลจริงประกอบการตัดสินใจเสมอนะ
                    </p>
                  </div>
                )}
              </>
            )}
            {daily && (
              <div className="daily-intention">
                <Moon size={38} strokeWidth={1} />
                <p>
                  ไม่ต้องรีบหาคำตอบให้ทุกอย่าง
                  <br />
                  แค่ให้เวลาตัวเองสักนิดก็พอ
                </p>
                <span>ฟรี 1 ใบทุกวัน · เปลี่ยนวันตามเวลาไทย</span>
              </div>
            )}
            <button className="button primary full" onClick={start}>
              <Sparkles size={17} />{" "}
              {daily ? "ตั้งใจ แล้วสับไพ่" : "พร้อมแล้ว สับไพ่กัน"}
              <ArrowRight size={17} />
            </button>
            <p className="private-note">
              คำถามและประวัติเก็บไว้ในเบราว์เซอร์นี้เท่านั้น
            </p>
          </motion.div>
        )}
        {step === "shuffle" && (
          <motion.div
            key="shuffle"
            className="reading-step ritual-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="eyebrow">TAKE A BREATH. TRUST YOUR TIMING.</span>
            <h2 ref={heading} tabIndex={-1}>
              ปล่อยให้ใจค่อย ๆ สงบ
            </h2>
            <p className="muted" role="status">
              กำลังสับไพ่ให้คุณ…
            </p>
            <div className="shuffle-deck" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="shuffle-card"
                  initial={{ x: 0, rotate: 0 }}
                  animate={
                    reduce
                      ? {}
                      : {
                          x: [0, (i - 2) * 34, 0],
                          rotate: [0, (i - 2) * 12, 0],
                          y: [0, Math.abs(i - 2) * -12, 0],
                        }
                  }
                  transition={{ duration: 0.85, repeat: 1, delay: i * 0.025 }}
                >
                  <CardArt decorative />
                </motion.div>
              ))}
            </div>
            <span className="ritual-caption">
              คำตอบบางอย่าง เริ่มต้นจากการได้ฟังตัวเอง
            </span>
          </motion.div>
        )}
        {step === "pick" && (
          <motion.div
            key="pick"
            className="reading-step pick-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="eyebrow">LET YOUR INTUITION LEAD</span>
            <h2 ref={heading} tabIndex={-1}>
              {picked.length === count
                ? "ไพ่ของคุณค่อย ๆ เปิดออก"
                : "ใบไหนกำลังเรียกคุณอยู่"}
            </h2>
            <p className="muted" aria-live="polite">
              {picked.length === count
                ? "ให้ข้อความนี้เป็นอีกมุมหนึ่งของการมองตัวเอง"
                : `เลือกไพ่ ${count} ใบ ตามความรู้สึกแรก · เลือกแล้ว ${picked.length}/${count}`}
            </p>
            <div className="pick-grid">
              {deck.map((id, i) => (
                <button
                  className={`pick-card ${picked.includes(i) ? "picked" : ""}`}
                  key={i}
                  aria-label={
                    picked.includes(i)
                      ? `ใบที่ ${i + 1}: ${cardById.get(id)!.thai}`
                      : `เลือกไพ่ใบที่ ${i + 1}`
                  }
                  aria-pressed={picked.includes(i)}
                  disabled={picked.includes(i) || picked.length === count}
                  onClick={() => pick(i)}
                >
                  <div className="flip-inner">
                    <div className="flip-back">
                      <CardArt decorative />
                    </div>
                    <div className="flip-front">
                      <CardArt card={cardById.get(id)} decorative />
                    </div>
                  </div>
                  {picked.includes(i) && (
                    <span className="pick-number">{picked.indexOf(i) + 1}</span>
                  )}
                </button>
              ))}
            </div>
            {picked.length === count && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="button primary"
                onClick={() => setStep("result")}
              >
                อ่านข้อความจากไพ่
                <ArrowRight size={17} />
              </motion.button>
            )}
            {!picked.length && (
              <button
                className="text-button muted"
                onClick={() => setStep("setup")}
              >
                <ArrowLeft size={14} />
                กลับไปตั้งคำถาม
              </button>
            )}
          </motion.div>
        )}
        {step === "result" && reading && (
          <motion.div
            key="result"
            className="reading-step result-step"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="eyebrow">A MESSAGE, JUST FOR YOU</span>
            <h2 ref={heading} tabIndex={-1}>
              {reading.daily
                ? "ข้อความเล็ก ๆ สำหรับวันนี้"
                : "สิ่งที่ไพ่อยากกระซิบกับคุณ"}
            </h2>
            <p className="result-date">
              {thaiDate(new Date(reading.createdAt))} <span>·</span>{" "}
              {reading.daily
                ? "ไพ่ประจำวัน"
                : topics.find((t) => t.id === reading.topic)?.label}
            </p>
            {reading.question && (
              <p className="your-question">“{reading.question}”</p>
            )}
            <div className={`result-cards count-${result.length}`}>
              {result.map((card, i) => (
                <motion.div
                  key={card.id}
                  className="result-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  {result.length === 3 && (
                    <span className="position-label">
                      {
                        ["สิ่งที่ผ่านมา", "สิ่งที่เป็นอยู่", "แนวทางข้างหน้า"][
                          i
                        ]
                      }
                    </span>
                  )}
                  <CardArt card={card} />
                  <h3>{card.thai}</h3>
                  <span className="card-english">{card.name}</span>
                </motion.div>
              ))}
            </div>
            <div className="interpretations">
              {result.map((card, i) => (
                <div className="interpretation" key={card.id}>
                  <h3>
                    {result.length === 3 && <span>0{i + 1} / </span>}
                    {reading.topic === "decision"
                      ? decision(card)
                      : card.keyword}
                  </h3>
                  <p>{interpretation(card, reading.topic)}</p>
                  <div className="advice">
                    <Sparkles size={15} />
                    <span>{card.advice}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="result-kindness">
              <Heart size={17} />
              <p>
                ไพ่ไม่ได้กำหนดชีวิตคุณ ใช้ข้อความนี้เป็นชวนคิด
                <br />
                แล้วเลือกทางที่อ่อนโยนกับตัวเองนะ
              </p>
            </div>
            <div className="result-actions">
              <button
                className="button primary"
                onClick={() => onShare(reading)}
              >
                <Share2 size={17} />
                แชร์เป็นภาพสวย ๆ
              </button>
              {!reading.daily && (
                <button
                  className="button secondary"
                  onClick={() => {
                    setReading(undefined);
                    setPicked([]);
                    setStep("setup");
                  }}
                >
                  <RotateCcw size={16} />
                  เปิดไพ่อีกครั้ง
                </button>
              )}
            </div>
            <button className="text-button muted" onClick={onClose}>
              กลับสู่พื้นที่ของคุณ
              <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
