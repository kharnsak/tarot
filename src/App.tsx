import { useContext, useEffect, useState } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  Flame,
  Heart,
  History,
  LoaderCircle,
  Menu,
  Moon,
  Search,
  Share2,
  ShieldCheck,
  Sparkle,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ArtworkContext, CardArt } from "./art";
import { cards, cardById, topics } from "./tarot";
import type { Card, Topic } from "./tarot";
import { dayKey, loadJournal, saveJournal, streak, thaiDate } from "./storage";
import type { Reading } from "./storage";
import { createShareImage } from "./share";
import Dialog from "./Dialog";
import ReadingFlow from "./ReadingFlow";

type Screen =
  | { kind: "reading"; daily?: boolean; topic?: Topic; existing?: Reading }
  | { kind: "journal" }
  | { kind: "library" }
  | { kind: "about" }
  | { kind: "share"; reading: Reading }
  | null;
const topicIcons: Record<Topic, LucideIcon> = {
  love: Heart,
  work: BriefcaseBusiness,
  general: Sparkles,
  decision: CircleHelp,
};

function Library() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Card>();
  const [backScroll, setBackScroll] = useState(0);
  const results = cards.filter(
    (c) =>
      (filter === "all" ||
        (filter === "major" ? c.arcana === "major" : c.suit === filter)) &&
      `${c.name} ${c.thai} ${c.keyword}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  function view(card: Card) {
    setBackScroll(document.querySelector(".dialog")?.scrollTop || 0);
    setSelected(card);
    document.querySelector(".dialog")?.scrollTo({ top: 0 });
  }
  if (selected)
    return (
      <div className="library-detail">
        <button
          className="text-button muted"
          onClick={() => {
            setSelected(undefined);
            requestAnimationFrame(() =>
              document.querySelector(".dialog")?.scrollTo({ top: backScroll }),
            );
          }}
        >
          <ArrowLeft size={16} />
          กลับไปที่ห้องสมุดไพ่
        </button>
        <div className="library-detail-intro">
          <CardArt card={selected} />
          <div>
            <span className="eyebrow">
              {selected.arcana === "major" ? "MAJOR ARCANA" : "MINOR ARCANA"}
            </span>
            <h2>{selected.thai}</h2>
            <span className="serif english-title">{selected.name}</span>
            <p className="gold">{selected.keyword}</p>
          </div>
        </div>
        <section>
          <h3>ข้อความจากไพ่</h3>
          <p>{selected.message}</p>
        </section>
        <section>
          <h3>ความรักและความสัมพันธ์</h3>
          <p>{selected.love}</p>
        </section>
        <section>
          <h3>การงานและการเงิน</h3>
          <p>{selected.work}</p>
        </section>
        <div className="gentle-note">
          <Sparkles size={18} />
          <p>{selected.advice}</p>
        </div>
        <p className="fine-print">
          ความหมายในรูปแบบไพ่ตั้งตรง สำหรับการเรียนรู้และไตร่ตรอง
          ภาพประกอบเป็นภาพชั่วคราวของจันทร์ใจ
        </p>
      </div>
    );
  return (
    <div className="library">
      <span className="eyebrow">GET TO KNOW YOUR CARDS</span>
      <h2>ไพ่แต่ละใบ มีเรื่องเล่า</h2>
      <p className="muted">รู้จักความหมายไพ่ทั้ง 78 ใบ ในภาษาที่ใกล้หัวใจ</p>
      <label className="search-field">
        <Search size={18} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อไพ่ หรือสิ่งที่อยากรู้"
          aria-label="ค้นหาไพ่"
        />
      </label>
      <div className="library-tabs" aria-label="หมวดไพ่">
        {[
          ["all", "ทั้งหมด"],
          ["major", "ไพ่หลัก 22 ใบ"],
          ["cups", "ถ้วย"],
          ["wands", "ไม้เท้า"],
          ["swords", "ดาบ"],
          ["pentacles", "เหรียญ"],
        ].map(([id, label]) => (
          <button
            className={filter === id ? "selected" : ""}
            onClick={() => setFilter(id)}
            key={id}
            aria-pressed={filter === id}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="search-count" aria-live="polite">
        พบ {results.length} ใบ
      </p>
      <div className="library-grid">
        {results.map((card) => (
          <button key={card.id} onClick={() => view(card)}>
            <CardArt card={card} decorative />
            <h3>{card.thai}</h3>
            <span>{card.name}</span>
          </button>
        ))}
      </div>
      {!results.length && (
        <div className="empty-state">
          <Search />
          <h3>ยังไม่พบไพ่ที่ค้นหา</h3>
          <p>ลองค้นหาชื่อภาษาไทย ภาษาอังกฤษ หรือเลือกหมวดใหม่</p>
          <button
            className="button secondary"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            ดูไพ่ทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}
function Journal({
  readings,
  onOpen,
  onDelete,
  storageUnavailable,
}: {
  readings: Reading[];
  onOpen: (r: Reading) => void;
  onDelete: () => void;
  storageUnavailable: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="journal">
      <span className="eyebrow">YOUR LITTLE BOOK OF REFLECTIONS</span>
      <h2>บันทึกของใจ</h2>
      <p className="muted">กลับมาอ่านวันที่ผ่านมา แล้วเห็นตัวเองในมุมใหม่</p>
      <div className="privacy-note">
        <ShieldCheck size={17} />
        <span>
          {storageUnavailable
            ? "เบราว์เซอร์นี้บันทึกข้อมูลไม่ได้ ประวัติจะอยู่ชั่วคราวจนกว่าจะปิดหน้า"
            : "เก็บเฉพาะในเบราว์เซอร์นี้ ไม่ซิงก์ข้ามเครื่อง การล้างข้อมูลเว็บไซต์จะลบประวัติด้วย"}
        </span>
      </div>
      {!readings.length ? (
        <div className="empty-state">
          <BookOpen size={34} strokeWidth={1} />
          <h3>หน้ากระดาษแรกกำลังรอคุณ</h3>
          <p>
            เมื่อเปิดไพ่ ข้อความและไพ่ของคุณ
            <br />
            จะกลับมาอ่านได้ที่นี่
          </p>
        </div>
      ) : (
        <>
          <div className="journal-list">
            {readings.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpen(r)}
                className="journal-entry"
              >
                <CardArt card={cardById.get(r.cards[0])} decorative />
                <span className="journal-entry-copy">
                  <small>
                    {thaiDate(new Date(r.createdAt), true)} ·{" "}
                    {r.daily
                      ? "ไพ่ประจำวัน"
                      : topics.find((t) => t.id === r.topic)?.label}
                  </small>
                  <b>
                    {r.question ||
                      r.cards.map((id) => cardById.get(id)!.thai).join(" · ")}
                  </b>
                  <span>
                    {r.cards.length} ใบ · กลับมาอ่านข้อความ
                    <ArrowRight size={13} />
                  </span>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
          <div className="delete-area">
            {confirm ? (
              <>
                <p>
                  ลบประวัติทั้งหมด {readings.length} รายการจากเบราว์เซอร์นี้?
                  <br />
                  <small>ลบแล้วเรียกคืนไม่ได้</small>
                </p>
                <button
                  className="button danger"
                  onClick={() => {
                    onDelete();
                    setConfirm(false);
                  }}
                >
                  ยืนยันลบประวัติ
                </button>
                <button
                  className="text-button muted"
                  onClick={() => setConfirm(false)}
                >
                  เก็บบันทึกไว้
                </button>
              </>
            ) : (
              <button
                className="text-button muted"
                onClick={() => setConfirm(true)}
              >
                <Trash2 size={14} />
                ลบประวัติในเครื่องนี้
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
function ShareView({
  reading,
  onBack,
  notify,
}: {
  reading: Reading;
  onBack: () => void;
  notify: (text: string) => void;
}) {
  const artwork = useContext(ArtworkContext);
  const [blob, setBlob] = useState<Blob>();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    createShareImage(reading, artwork)
      .then((data) => {
        if (active) {
          objectUrl = URL.createObjectURL(data);
          setBlob(data);
          setUrl(objectUrl);
        }
      })
      .catch(() => {
        if (active)
          setError(
            "สร้างภาพไม่สำเร็จ ลองเปิดด้วยเบราว์เซอร์รุ่นล่าสุด แล้วลองใหม่อีกครั้งนะ",
          );
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reading, artwork]);
  const file = blob
    ? new File([blob], `chanjai-${reading.date}.png`, { type: "image/png" })
    : undefined;
  const nativeShare = !!(file && navigator.canShare?.({ files: [file] }));
  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: "ข้อความจากไพ่จันทร์ใจ" });
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError"))
        notify("แชร์ไม่สำเร็จ บันทึกภาพแล้วแชร์จากแกลเลอรีได้เลยนะ");
    }
  }
  return (
    <div className="share-view">
      <button className="text-button muted" onClick={onBack}>
        <ArrowLeft size={16} />
        กลับไปอ่านข้อความ
      </button>
      <span className="eyebrow">A LITTLE MAGIC TO KEEP</span>
      <h2>เก็บข้อความดี ๆ ไว้ใกล้ใจ</h2>
      <p className="muted">บันทึกลงเครื่อง หรือส่งต่อพลังดี ๆ ให้ใครสักคน</p>
      {error ? (
        <div className="empty-state">
          <p role="alert">{error}</p>
          <button className="button secondary" onClick={onBack}>
            กลับไปที่ผลไพ่
          </button>
        </div>
      ) : url ? (
        <>
          <img
            className="share-preview"
            src={url}
            alt="ภาพผลไพ่ของคุณสำหรับแชร์"
          />
          <div className="share-actions">
            <a
              className="button primary"
              href={url}
              download={`chanjai-${reading.date}.png`}
            >
              <ArrowDownToLine size={17} />
              บันทึกภาพ PNG
            </a>
            {nativeShare && (
              <button className="button secondary" onClick={share}>
                <Share2 size={17} />
                แชร์ภาพ
              </button>
            )}
          </div>
          <p className="fine-print">
            ภาพขนาด 1080 × 1440 · ไม่แสดงคำถามส่วนตัวของคุณ
            <br />
            {!nativeShare &&
              "บันทึกภาพ แล้วเลือกแชร์ผ่าน LINE, Instagram หรือแอปที่คุณใช้ได้เลย"}
          </p>
        </>
      ) : (
        <div className="share-loading" role="status">
          <LoaderCircle className="spin" size={28} />
          <p>กำลังจัดข้อความให้เป็นภาพสวย ๆ…</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const reduce = useReducedMotion();
  const [journal, setJournal] = useState(loadJournal);
  const [screen, setScreen] = useState<Screen>(null);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [today, setToday] = useState(dayKey);
  const [artwork, setArtwork] = useState<Record<string, string>>({});
  const daily = journal.readings.find((r) => r.daily && r.date === today);
  const currentStreak = streak(journal.readings);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(dayKey()), 30000);
    const sync = () => setJournal(loadJournal());
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}cards/manifest.json`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        const safe: Record<string, string> = {};
        for (const [id, path] of Object.entries(data)) {
          if (
            cardById.has(id) &&
            typeof path === "string" &&
            path.startsWith("/cards/") &&
            !path.includes("..")
          )
            safe[id] = `${import.meta.env.BASE_URL}${path.slice(1)}`;
        }
        setArtwork(safe);
      })
      .catch(() => {});
  }, []);
  function openDaily() {
    setMenu(false);
    setScreen({
      kind: "reading",
      daily: true,
      existing: journal.readings.find((r) => r.daily && r.date === dayKey()),
    });
  }
  function openScreen(next: Screen) {
    setMenu(false);
    setScreen(next);
  }
  function save(reading: Reading) {
    const fresh = loadJournal();
    const merged = [reading, ...fresh.readings, ...journal.readings]
      .filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i)
      .slice(0, 150);
    const success = saveJournal(merged);
    setJournal({ readings: merged, storageUnavailable: !success });
    if (!success)
      setToast("เบราว์เซอร์นี้บันทึกไม่ได้ เก็บผลเป็นภาพไว้ก่อนปิดหน้านะ");
  }
  function erase() {
    if (saveJournal([])) {
      setJournal({ readings: [], storageUnavailable: false });
      setToast("ลบประวัติในเบราว์เซอร์นี้แล้ว");
    } else
      setToast("ยังลบข้อมูลไม่ได้ ลองตรวจสอบสิทธิ์จัดเก็บข้อมูลของเบราว์เซอร์");
  }
  return (
    <MotionConfig reducedMotion="user">
      <ArtworkContext.Provider value={artwork}>
        <div className="site-shell">
          <div className="ambient ambient-one" aria-hidden="true" />
          <div className="ambient ambient-two" aria-hidden="true" />
          <div className="noise" aria-hidden="true" />
          <a href="#main-content" className="skip-link">
            ข้ามไปยังเนื้อหา
          </a>
          <header className="header page-width">
            <a href="#" className="brand" aria-label="จันทร์ใจ หน้าหลัก">
              <span className="brand-mark">
                <Moon size={29} strokeWidth={1.2} />
                <Sparkle size={11} />
              </span>
              <span>
                จันทร์ใจ<small>CHANJAI</small>
              </span>
            </a>
            <nav
              className={`nav ${menu ? "mobile-open" : ""}`}
              aria-label="เมนูหลัก"
            >
              <button className="nav-link nav-active" onClick={openDaily}>
                ไพ่ประจำวัน
              </button>
              <button
                className="nav-link"
                onClick={() => openScreen({ kind: "library" })}
              >
                ห้องสมุดไพ่
              </button>
              <button
                className="nav-link"
                onClick={() => openScreen({ kind: "journal" })}
              >
                บันทึกของใจ
              </button>
              <a
                href="#how-it-works"
                className="nav-link"
                onClick={() => setMenu(false)}
              >
                รู้จักจันทร์ใจ
              </a>
            </nav>
            <button
              className="button header-cta"
              onClick={() => openScreen({ kind: "reading" })}
            >
              <Sparkles size={15} />
              เปิดไพ่ฟรี <ArrowUpRight />
            </button>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-label={menu ? "ปิดเมนู" : "เปิดเมนู"}
            >
              {menu ? <X size={23} /> : <Menu size={23} />}
            </button>
          </header>
          <main id="main-content">
            <section className="hero page-width" aria-labelledby="hero-heading">
              <motion.div
                className="hero-copy"
                initial={reduce ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="hero-kicker">
                  <span />
                  <span>พื้นที่เล็ก ๆ ให้ใจได้พัก</span>
                </div>
                <h1 id="hero-heading">
                  ให้ไพ่กระซิบ
                  <br />
                  <span>สิ่งที่ใจอยากรู้</span>
                  <Sparkle className="heading-star" size={27} strokeWidth={1} />
                </h1>
                <p className="hero-description">
                  บางคำตอบ ไม่ต้องรีบหา
                  <br />
                  แค่ลองหยุดฟังเสียงข้างใน ให้ไพ่เป็นเพื่อนคุยกับใจ
                </p>
                <div className="hero-actions">
                  <button
                    className="button primary hero-cta"
                    onClick={openDaily}
                  >
                    <Moon size={18} strokeWidth={1.5} />
                    {daily ? "อ่านข้อความของวันนี้" : "เปิดไพ่ประจำวัน"}
                    <ArrowRight size={18} />
                  </button>
                  <a href="#readings" className="hero-secondary">
                    เลือกเรื่องที่อยู่ในใจ
                    <ArrowDown size={15} />
                  </a>
                </div>
                <div className="hero-reassurance">
                  <span>
                    <Check size={13} />
                    ฟรีทุกวัน
                  </span>
                  <i />
                  <span>ไม่ต้องสมัครสมาชิก</span>
                  <i />
                  <span>เก็บเป็นภาพได้</span>
                </div>
              </motion.div>
              <motion.div
                className="hero-visual"
                aria-hidden="true"
                initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, delay: 0.1 }}
              >
                <div className="celestial-disc">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit-cross" />
                  <span className="orbit-label">AS ABOVE, SO WITHIN</span>
                  <div className="moon-halo" />
                  <span className="orbital-dot dot-one" />
                  <span className="orbital-dot dot-two" />
                </div>
                <Sparkle
                  className="visual-star star-a"
                  size={32}
                  strokeWidth={0.7}
                />
                <Sparkle
                  className="visual-star star-b"
                  size={18}
                  strokeWidth={1}
                />
                <Sparkle
                  className="visual-star star-c"
                  size={12}
                  strokeWidth={1}
                />
                <div className="hero-card hero-card-back-left">
                  <CardArt decorative />
                </div>
                <div className="hero-card hero-card-back-right">
                  <CardArt decorative />
                </div>
                <div className="hero-card hero-card-left">
                  <CardArt card={cards[18]} decorative />
                </div>
                <div className="hero-card hero-card-right">
                  <CardArt card={cards[17]} decorative />
                </div>
                <div className="hero-card hero-card-main">
                  <CardArt card={cards[19]} decorative />
                </div>
                <div className="floating-tag">
                  <Sparkles size={14} />
                  <span>a little magic, just for you</span>
                </div>
                <span className="art-coordinate">
                  19° THE SUN
                  <br />
                  <span>YOUR LIGHT IS STILL HERE</span>
                </span>
              </motion.div>
            </section>
            <div className="page-width">
              <section
                className="daily-banner glass"
                aria-labelledby="daily-heading"
              >
                <div className="daily-banner-icon">
                  <Moon size={26} strokeWidth={1.2} />
                  <Sparkle size={10} />
                </div>
                <div className="daily-banner-copy">
                  <div className="daily-banner-top">
                    <span className="eyebrow">YOUR DAILY LITTLE RITUAL</span>
                    <span className="today-date">
                      {thaiDate(new Date(), true)}
                    </span>
                  </div>
                  <h2 id="daily-heading">
                    {daily
                      ? "วันนี้ คุณได้ให้เวลากับใจแล้ว"
                      : "ไพ่วันนี้ของคุณ รออยู่ตรงนี้"}{" "}
                    <span className="free-badge">ฟรี 1 ใบ</span>
                  </h2>
                  <p>
                    {daily
                      ? `ข้อความจากไพ่${cardById.get(daily.cards[0])!.thai} กลับมาอ่านได้เสมอ`
                      : "เริ่มต้นวันด้วยข้อความเล็ก ๆ ที่อาจทำให้คุณยิ้มได้"}
                  </p>
                </div>
                <div
                  className="streak-chip"
                  title="นับวันที่เปิดไพ่ประจำวันต่อเนื่อง"
                >
                  <Flame size={18} />
                  <span>
                    {currentStreak > 0 ? (
                      <>
                        <b>{currentStreak} วัน</b> ที่ดูแลใจ
                      </>
                    ) : (
                      <>เริ่มวันแรกด้วยกัน</>
                    )}
                  </span>
                </div>
                <button className="daily-banner-action" onClick={openDaily}>
                  {daily ? "อ่านอีกครั้ง" : "รับข้อความวันนี้"}
                  <ArrowRight size={18} />
                </button>
              </section>
            </div>
            <section
              id="readings"
              className="readings-section page-width"
              aria-labelledby="readings-heading"
            >
              <div className="section-top">
                <div>
                  <span className="eyebrow">WHAT'S ON YOUR MIND?</span>
                  <h2 id="readings-heading">วันนี้ อยากคุยเรื่องอะไร</h2>
                </div>
                <p>
                  ให้ไพ่ช่วยส่องอีกมุม
                  <br />
                  <span>แล้วให้หัวใจคุณเป็นคนเลือกทาง</span>
                </p>
              </div>
              <div className="topic-grid">
                {topics.map((topic, i) => {
                  const Icon = topicIcons[topic.id];
                  return (
                    <motion.button
                      className={`topic-card topic-${topic.id}`}
                      onClick={() =>
                        openScreen({ kind: "reading", topic: topic.id })
                      }
                      key={topic.id}
                      initial={reduce ? false : { y: 20 }}
                      whileInView={{ y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.45, delay: i * 0.07 }}
                    >
                      <div className="topic-card-top">
                        <span className="topic-icon">
                          <Icon size={23} strokeWidth={1.3} />
                        </span>
                        <span className="topic-number">0{i + 1}</span>
                      </div>
                      <h3>{topic.label}</h3>
                      <p>{topic.subtitle}</p>
                      <div className="topic-card-bottom">
                        <span>
                          {topic.id === "decision"
                            ? "1 ใบ · มุมมองก่อนตัดสินใจ"
                            : "เลือกได้ 1 หรือ 3 ใบ"}
                        </span>
                        <ArrowRight size={18} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="readings-footnote">
                <ShieldCheck size={14} />
                <span>
                  พื้นที่ปลอดภัยสำหรับการสำรวจใจ ไม่มีคำตอบไหนมาตัดสินคุณ
                </span>
              </div>
            </section>
            <section
              id="how-it-works"
              className="how-section page-width"
              aria-labelledby="how-heading"
            >
              <div className="how-intro">
                <span className="eyebrow">SLOW DOWN. TUNE IN.</span>
                <h2 id="how-heading">
                  ไม่ต้องรู้อนาคตทั้งหมด
                  <br />
                  <span>แค่เข้าใจตัวเองอีกนิดก็พอ</span>
                </h2>
                <p>
                  จันทร์ใจเชื่อว่าไพ่เป็นกระจกบานเล็ก
                  <br />
                  ที่ช่วยให้คุณเห็นใจตัวเองชัดขึ้น
                  <br />
                  ไม่ใช่สิ่งที่กำหนดว่าชีวิตคุณต้องเป็นอย่างไร
                </p>
                <button
                  className="text-button gold"
                  onClick={() => openScreen({ kind: "about" })}
                >
                  รู้จักพื้นที่ของเรา
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="how-steps">
                {[
                  {
                    icon: Moon,
                    title: "พักใจ แล้วตั้งคำถาม",
                    text: "เลือกเรื่องที่อยากคุย หรือแค่เปิดใจรับข้อความของวัน",
                  },
                  {
                    icon: Sparkles,
                    title: "ให้ความรู้สึกพาคุณเลือก",
                    text: "หายใจช้า ๆ สับไพ่ แล้วเลือกใบที่รู้สึกเชื่อมโยง",
                  },
                  {
                    icon: Heart,
                    title: "เก็บสิ่งที่ดีกับใจไว้",
                    text: "อ่านข้อความ ทบทวนตัวเอง แล้วแชร์เป็นภาพสวย ๆ",
                  },
                ].map((item, i) => (
                  <div className="how-step" key={i}>
                    <span className="step-icon">
                      <item.icon size={20} strokeWidth={1.2} />
                    </span>
                    <div>
                      <span className="step-label">STEP 0{i + 1}</span>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="closing-note page-width">
              <Sparkle size={22} strokeWidth={0.9} />
              <p>
                “ไม่ว่าวันนี้ไพ่จะบอกอะไร
                <br className="mobile-break" />{" "}
                คุณยังเป็นคนเขียนเรื่องราวของตัวเองเสมอ”
              </p>
              <span>A GENTLE REMINDER FROM CHANJAI</span>
            </section>
          </main>
          <footer className="footer page-width">
            <div className="footer-row">
              <a href="#" className="footer-brand">
                <Moon size={19} strokeWidth={1.3} />
                จันทร์ใจ <span>ให้ใจได้มีพื้นที่</span>
              </a>
              <div>
                <button onClick={() => openScreen({ kind: "library" })}>
                  ความหมายไพ่
                </button>
                <button onClick={() => openScreen({ kind: "about" })}>
                  เกี่ยวกับเรา & ความเป็นส่วนตัว
                </button>
                <button onClick={() => openScreen({ kind: "journal" })}>
                  <History size={13} />
                  บันทึกของใจ
                </button>
              </div>
            </div>
            <div className="footer-bottom">
              <p>
                เพื่อความบันเทิงและการไตร่ตรอง ไม่ใช่การทำนายที่แน่นอน
                หรือคำแนะนำทางการแพทย์ การเงิน และกฎหมาย
              </p>
              <span>© {new Date().getFullYear()} CHANJAI</span>
            </div>
          </footer>
          {screen && (
            <Dialog
              wide={
                screen.kind === "library" ||
                (screen.kind === "reading" &&
                  !!screen.existing &&
                  screen.existing.cards.length === 3)
              }
              title={
                screen.kind === "reading"
                  ? "เปิดไพ่จันทร์ใจ"
                  : screen.kind === "journal"
                    ? "บันทึกของใจ"
                    : screen.kind === "library"
                      ? "ห้องสมุดไพ่"
                      : screen.kind === "share"
                        ? "แชร์ผลไพ่"
                        : "เกี่ยวกับจันทร์ใจ"
              }
              onClose={() =>
                screen.kind === "share"
                  ? setScreen({ kind: "reading", existing: screen.reading })
                  : setScreen(null)
              }
            >
              {screen.kind === "reading" && (
                <ReadingFlow
                  key={screen.existing?.id || `${screen.topic}-${screen.daily}`}
                  daily={screen.daily}
                  initialTopic={screen.topic}
                  existing={screen.existing}
                  onSave={save}
                  onShare={(reading) => setScreen({ kind: "share", reading })}
                  onClose={() => setScreen(null)}
                />
              )}
              {screen.kind === "journal" && (
                <Journal
                  readings={journal.readings}
                  onOpen={(r) => setScreen({ kind: "reading", existing: r })}
                  onDelete={erase}
                  storageUnavailable={journal.storageUnavailable}
                />
              )}
              {screen.kind === "library" && <Library />}
              {screen.kind === "share" && (
                <ShareView
                  reading={screen.reading}
                  onBack={() =>
                    setScreen({ kind: "reading", existing: screen.reading })
                  }
                  notify={setToast}
                />
              )}
              {screen.kind === "about" && (
                <div className="about">
                  <span className="eyebrow">A SOFT PLACE TO LAND</span>
                  <h2>ยินดีต้อนรับสู่จันทร์ใจ</h2>
                  <p>
                    ในวันที่มีคำถามมากมาย เราอยากให้คุณมีพื้นที่เล็ก ๆ
                    ไว้พักและฟังเสียงของตัวเอง ไพ่ทุกใบเป็นคำชวนมองชีวิตอีกมุม
                    ด้วยภาษาที่อ่อนโยนและไม่ตัดสิน
                  </p>
                  <div className="about-values">
                    <div>
                      <Sun size={20} />
                      <h3>ไพ่ฟรีที่กลับมาได้ทุกวัน</h3>
                      <p>
                        ไพ่ประจำวัน 1 ใบ เปลี่ยนวันเวลาเที่ยงคืนของประเทศไทย
                        และสเปรดพื้นฐาน 1–3 ใบ โดยไม่ต้องสมัครสมาชิก
                      </p>
                    </div>
                    <div>
                      <ShieldCheck size={20} />
                      <h3>เรื่องของคุณ เป็นของคุณ</h3>
                      <p>
                        คำถามและประวัติสูงสุด 150 รายการเก็บไว้ในเบราว์เซอร์นี้
                        ไม่ส่งไปยังบริการ AI และไม่ซิงก์ข้ามอุปกรณ์
                        คุณลบได้จากหน้าบันทึกของใจ
                        การล้างข้อมูลเว็บไซต์จะลบประวัติและสตรีคด้วย
                      </p>
                    </div>
                    <div>
                      <Heart size={20} />
                      <h3>ไพ่ชวนคิด ไม่ชี้ชะตา</h3>
                      <p>
                        คำอ่านเป็นเนื้อหาภาษาไทยตามความหมายของไพ่ตั้งตรงและหัวข้อที่คุณเลือก
                        ไม่ใช่การอ่านใจผู้อื่นหรือคำทำนายที่รับประกันผล
                        ใช้ข้อมูลจริงและผู้เชี่ยวชาญประกอบการตัดสินใจเรื่องสำคัญ
                      </p>
                    </div>
                    <div>
                      <BookOpen size={20} />
                      <h3>พื้นที่ที่กำลังเติบโต</h3>
                      <p>
                        เวอร์ชันแรกนี้ยังไม่มี AI สนทนา การแจ้งเตือน LINE OA
                        หรือระบบบัญชี
                        ภาพไพ่เป็นภาพประกอบชั่วคราวระหว่างรอชุดไพ่จริง
                      </p>
                    </div>
                  </div>
                  <button className="button primary full" onClick={openDaily}>
                    ให้เวลาตัวเองสักนิด
                    <Moon size={17} />
                  </button>
                </div>
              )}
            </Dialog>
          )}
          {toast && (
            <div className="toast" role="status">
              <Sparkles size={17} />
              {toast}
              <button onClick={() => setToast("")} aria-label="ปิดข้อความ">
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </ArtworkContext.Provider>
    </MotionConfig>
  );
}
function ArrowUpRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5 15 15 5M5 5h10v10" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
