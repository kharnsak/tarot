import { useContext, useEffect, useState } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronRight,
  CircleHelp,
  Flame,
  Heart,
  History,
  LoaderCircle,
  MessageCircleHeart,
  Moon,
  PenLine,
  Search,
  Settings,
  Share2,
  Sparkles,
  ShieldCheck,
  Sun,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ArtworkContext, CardArt } from "./art";
import { astroProfile } from "./astro";
import { cardById, cardText, entryById, getDeck, topics } from "./tarot";
import type { CardEntry } from "./tarot";
import { dayKey, loadBirth, loadJournal, saveBirth, saveJournal, streakInfo, thaiDate } from "./storage";
import type { Birth, Reading } from "./storage";
import { createShareImage } from "./share";
import type { ShareFormat } from "./share";
import Dialog from "./Dialog";
import ReadingFlow from "./ReadingFlow";
import { chipOf, ui } from "./ui/copy";
import { chips } from "./ui/copy";
import { applyTheme, readTheme } from "./ui/theme";
import Leaves from "./ui/Leaves";
import HeroStage from "./ui/HeroStage";
import { luckyFromCard, moonPath, moonPhase, thaiDay } from "./ui/today";
import type { Theme } from "./ui/theme";

type Screen =
  | { kind: "reading"; daily?: boolean; chip?: string; existing?: Reading }
  | { kind: "journal" }
  | { kind: "library" }
  | { kind: "about" }
  | { kind: "settings" }
  | { kind: "share"; reading: Reading }
  | null;

const chipIcons: Record<string, LucideIcon> = {
  love: Heart,
  mind: MessageCircleHeart,
  work: Briefcase,
  money: Wallet,
  yesno: CircleHelp,
  ask: PenLine,
};
const spring = { type: "spring", stiffness: 120, damping: 20 } as const;

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", hour12: false }).format(new Date())) % 24;
  return h < 11 ? ui.greet.morning : h < 16 ? ui.greet.noon : h < 19 ? ui.greet.evening : ui.greet.night;
}
function topicLabel(r: Reading) {
  return r.daily ? ui.journal.daily : (chipOf(r).label || topics.find((t) => t.id === r.topic)?.label || "");
}

const allCards = getDeck("full");

function Library() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<CardEntry>();
  const [side, setSide] = useState<"up" | "rev">("up");
  const [backScroll, setBackScroll] = useState(0);
  const q = search.toLowerCase().trim();
  const results = allCards.filter(
    (c) =>
      (filter === "all" || (filter === "major" ? c.arcana === "major" : c.suit === filter)) &&
      `${c.nameEn} ${c.nameTh} ${c.keywords.join(" ")}`.toLowerCase().includes(q),
  );
  const scroller = () => document.querySelector(".dialog-body");
  function view(card: CardEntry) {
    setBackScroll(scroller()?.scrollTop || 0);
    setSelected(card);
    setSide("up");
    scroller()?.scrollTo({ top: 0 });
  }
  if (selected) {
    const rev = side === "rev";
    return (
      <div className="library-detail">
        <button
          className="text-button"
          onClick={() => {
            setSelected(undefined);
            requestAnimationFrame(() => scroller()?.scrollTo({ top: backScroll }));
          }}
        >
          <ArrowLeft size={16} />
          {ui.library.back}
        </button>
        <div className="detail-grid">
          <div className="detail-hero">
            <CardArt card={selected} />
            <span className="en">{selected.nameEn}</span>
            <h2>{selected.nameTh}</h2>
            <div className="kw">{selected.keywords.map((k) => <i key={k}>{k}</i>)}</div>
          </div>
          <div className="detail-body">
            <div className="segment" role="group" aria-label="ด้านของไพ่">
              <button className={!rev ? "on" : ""} aria-pressed={!rev} onClick={() => setSide("up")}>ไพ่หัวตั้ง</button>
              <button className={rev ? "on" : ""} aria-pressed={rev} onClick={() => setSide("rev")}>ไพ่กลับหัว</button>
            </div>
            <section><h3>{ui.library.message}</h3><p>{cardText(selected, rev, "core")}</p></section>
            <section><h3>{ui.library.love}</h3><p>{cardText(selected, rev, "love")}</p></section>
            <section><h3>{ui.library.work}</h3><p>{cardText(selected, rev, "work")}</p></section>
            <section><h3>การเงิน</h3><p>{cardText(selected, rev, "money")}</p></section>
            <section className="note"><p>{cardText(selected, rev, "advice")}</p></section>
            <p className="fine">{ui.library.note}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="library">
      <h2>{ui.library.title}</h2>
      <p className="muted lead">{ui.library.sub}</p>
      <label className="search-field">
        <Search size={18} />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ui.library.search} aria-label={ui.library.searchAria} />
      </label>
      <div className="tabs" aria-label="หมวดไพ่">
        {ui.library.tabs.map(([id, label]) => (
          <button className={filter === id ? "on" : ""} onClick={() => setFilter(id)} key={id} aria-pressed={filter === id}>
            {label}
          </button>
        ))}
      </div>
      <p className="fine" aria-live="polite">{ui.library.count(results.length)}</p>
      <div className="library-grid">
        {results.map((card) => (
          <button key={card.id} onClick={() => view(card)}>
            <CardArt card={card} decorative />
            <h3>{card.nameTh}</h3>
            <span>{card.nameEn}</span>
          </button>
        ))}
      </div>
      {!results.length && (
        <div className="empty">
          <Search size={28} strokeWidth={1.2} />
          <h3>{ui.library.empty}</h3>
          <p className="muted">{ui.library.emptyHint}</p>
          <button className="button secondary" onClick={() => { setSearch(""); setFilter("all"); }}>
            {ui.library.all}
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsForm({ birth, onSave, onClose }: { birth?: Birth; onSave: (b?: Birth) => void; onClose: () => void }) {
  const [date, setDate] = useState(birth?.date ?? "");
  const [time, setTime] = useState(birth?.time ?? "");
  const valid = !date || !!astroProfile({ date });
  return (
    <form
      className="settings-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSave(date ? { date, time: time || undefined } : undefined);
        onClose();
      }}
    >
      <h2>{ui.settings.title}</h2>
      <p className="muted lead">{ui.settings.sub}</p>
      <label>
        {ui.settings.date}
        <input type="date" name="birth-date" value={date} max={dayKey()} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        {ui.settings.time}
        <input type="time" name="birth-time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <p className="fine">{ui.settings.hint}</p>
      <button className="button primary full" type="submit">{ui.settings.save}</button>
      {birth && (
        <button className="text-button" type="button" onClick={() => { onSave(undefined); onClose(); }}>{ui.settings.clear}</button>
      )}
    </form>
  );
}

function Journal({ readings, onOpen, onDelete, storageUnavailable }: { readings: Reading[]; onOpen: (r: Reading) => void; onDelete: () => void; storageUnavailable: boolean }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="journal">
      <h2>{ui.journal.title}</h2>
      <p className="muted lead">{ui.journal.sub}</p>
      <p className="privacy"><ShieldCheck size={15} />{storageUnavailable ? ui.journal.noStorage : ui.journal.local}</p>
      {!readings.length ? (
        <div className="empty">
          <BookOpen size={30} strokeWidth={1.2} />
          <h3>{ui.journal.emptyTitle}</h3>
          <p className="muted">{ui.journal.emptyText}</p>
        </div>
      ) : (
        <>
          <div className="journal-list">
            {readings.map((r) => (
              <button key={r.id} onClick={() => onOpen(r)} className="journal-entry">
                <CardArt card={cardById.get(r.cards[0])} decorative />
                <span className="copy">
                  <small>{thaiDate(new Date(r.createdAt), true)} · {topicLabel(r)}</small>
                  <b>{r.question || r.cards.map((id) => cardById.get(id)!.thai).join(" · ")}</b>
                  <span>{ui.journal.cardsCount(r.cards.length)}</span>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
          <div className="delete-area">
            {confirm ? (
              <>
                <p>{ui.journal.delConfirm(readings.length)}<br /><small>{ui.journal.delWarn}</small></p>
                <button className="button danger" onClick={() => { onDelete(); setConfirm(false); }}>{ui.journal.delYes}</button>
                <button className="text-button" onClick={() => setConfirm(false)}>{ui.journal.delNo}</button>
              </>
            ) : (
              <button className="text-button" onClick={() => setConfirm(true)}><Trash2 size={14} />{ui.journal.del}</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ShareView({ reading, onBack, notify }: { reading: Reading; onBack: () => void; notify: (text: string) => void }) {
  const artwork = useContext(ArtworkContext);
  const [format, setFormat] = useState<ShareFormat>("story");
  const [blob, setBlob] = useState<Blob>();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setBlob(undefined);
    setUrl("");
    setError("");
    createShareImage(reading, artwork, format)
      .then((data) => {
        if (active) {
          objectUrl = URL.createObjectURL(data);
          setBlob(data);
          setUrl(objectUrl);
        }
      })
      .catch(() => active && setError(ui.share.error));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reading, artwork, format]);
  const name = `chanjai-${reading.date}-${format}.png`;
  const file = blob ? new File([blob], name, { type: "image/png" }) : undefined;
  const nativeShare = !!(file && navigator.canShare?.({ files: [file] }));
  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: ui.share.sheetTitle });
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError")) notify(ui.share.shareError);
    }
  }
  return (
    <div className="share-view">
      <button className="text-button" onClick={onBack}><ArrowLeft size={16} />{ui.share.back}</button>
      <h2>{ui.share.title}</h2>
      <p className="muted lead">{ui.share.sub}</p>
      <div className="segment" role="group" aria-label="ขนาดภาพ">
        {(["story", "feed"] as const).map((f) => (
          <button key={f} className={format === f ? "on" : ""} aria-pressed={format === f} onClick={() => setFormat(f)}>
            {f === "story" ? ui.share.story : ui.share.feed}
          </button>
        ))}
      </div>
      {error ? (
        <div className="empty"><p role="alert">{error}</p></div>
      ) : url ? (
        <>
          <img className={`share-preview ${format}`} src={url} alt={ui.share.imgAlt} />
          <div className="share-actions">
            <a className="button primary" data-testid="save-png" href={url} download={name}><ArrowDownToLine size={18} />{ui.share.save}</a>
            {nativeShare && <button className="button secondary" onClick={share}><Share2 size={18} />{ui.share.send}</button>}
          </div>
          <p className="fine center">{format === "story" ? "1080 × 1920" : "1080 × 1350"} · {ui.share.private}</p>
        </>
      ) : (
        <div className="share-loading" role="status"><LoaderCircle className="spin" size={26} /><p className="muted">{ui.share.loading}</p></div>
      )}
    </div>
  );
}

export default function App() {
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [journal, setJournal] = useState(loadJournal);
  const [screen, setScreen] = useState<Screen>(null);
  const [toast, setToast] = useState("");
  const [today, setToday] = useState(dayKey);
  const [artwork, setArtwork] = useState<Record<string, string>>({});
  const daily = journal.readings.find((r) => r.daily && r.date === today);
  const dailyCard = daily ? entryById.get(daily.cards[0]) : undefined;
  const streak = streakInfo(journal.readings);
  const [birth, setBirth] = useState(loadBirth);
  const luckyToday = dailyCard ? luckyFromCard(dailyCard) : undefined;
  const moon = moonPhase();
  const dayInfo = thaiDay();
  const lucky = birth ? astroProfile(birth)?.luckyColors ?? [] : [];

  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(dayKey()), 30000);
    const sync = () => setJournal(loadJournal());
    window.addEventListener("storage", sync);
    return () => { clearInterval(timer); window.removeEventListener("storage", sync); };
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
          if (cardById.has(id) && typeof path === "string" && path.startsWith("/cards/") && !path.includes(".."))
            safe[id] = `${import.meta.env.BASE_URL}${path.slice(1)}`;
        }
        setArtwork(safe);
      })
      .catch(() => {});
  }, []);

  function openDaily() {
    setScreen({ kind: "reading", daily: true, existing: journal.readings.find((r) => r.daily && r.date === dayKey()) });
  }
  function save(reading: Reading) {
    const fresh = loadJournal();
    const merged = [reading, ...fresh.readings, ...journal.readings]
      .filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i)
      .slice(0, 100);
    const success = saveJournal(merged);
    setJournal({ readings: merged, storageUnavailable: !success });
    if (!success) setToast(ui.toast.noSave);
  }
  function saveBirthDate(next?: Birth) {
    if (!saveBirth(next)) setToast(ui.toast.noSave);
    setBirth(next);
  }
  function erase() {
    if (saveJournal([])) {
      setJournal({ readings: [], storageUnavailable: false });
      setToast(ui.toast.erased);
    } else setToast(ui.toast.eraseFail);
  }
  const title =
    screen?.kind === "reading" ? "เปิดไพ่" : screen?.kind === "journal" ? ui.journal.title : screen?.kind === "settings" ? ui.settings.title : screen?.kind === "library" ? ui.nav.library : screen?.kind === "share" ? ui.share.title : ui.about.title;

  return (
    <MotionConfig reducedMotion="user">
      <ArtworkContext.Provider value={artwork}>
        <Leaves />
        <div className="shell">
          <a href="#main-content" className="skip-link">{ui.skip}</a>
          <header className="header">
            <a href="#" className="brand" aria-label={`${ui.brand} หน้าหลัก`}>
              <Moon size={20} strokeWidth={1.6} />
              <span>{ui.brand}</span>
            </a>
            <nav className="header-actions" aria-label="เมนูหลัก">
              <button className="icon-button" onClick={() => setScreen({ kind: "library" })} aria-label={ui.nav.library}><BookOpen size={20} /></button>
              <button className="icon-button" onClick={() => setScreen({ kind: "journal" })} aria-label={ui.nav.journal}><History size={20} /></button>
              <button className="icon-button" onClick={() => setScreen({ kind: "settings" })} aria-label={ui.nav.settings}><Settings size={20} /></button>
              <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? ui.nav.light : ui.nav.dark}>
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </nav>
          </header>

          <main id="main-content">
            <section className="hero">
              <HeroStage />
              <div className="hero-copy">
                <motion.div className="hero-title" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                  <p className="eyebrow">{greeting()} · {thaiDate(new Date(), true)}</p>
                  <h1>{ui.home.dailyTitle}</h1>
                  <p className="lead">{ui.home.dailySub}</p>
                </motion.div>

                <motion.div className="daily-card" aria-label={ui.home.dailyTitle} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.08 }}>
                  {dailyCard && <p className="quote small">{dailyCard.daily || dailyCard.advice}</p>}
                  {dailyCard && lucky.length > 0 && <p className="lucky" data-testid="lucky"><b>{ui.home.luckyColors}</b> · {lucky.join(" · ")}</p>}
                  <button className="button primary full" onClick={openDaily}>
                    {daily ? ui.home.dailyDone : ui.home.dailyCta}
                    <ArrowRight size={18} />
                  </button>
                </motion.div>

                <section className="topics" aria-labelledby="topics-heading">
                  <h2 id="topics-heading">{ui.home.topicsTitle}</h2>
                  <div className="chip-grid">
                    {chips.map((c, i) => {
                      const Icon = chipIcons[c.id];
                      return (
                        <motion.button
                          key={c.id}
                          className="chip"
                          onClick={() => setScreen({ kind: "reading", chip: c.id })}
                          initial={reduce ? false : { opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...spring, delay: 0.16 + i * 0.04 }}
                        >
                          <Icon size={24} strokeWidth={1.5} />
                          <span>{c.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </section>

            <section className="today" aria-labelledby="today-heading">
              <h2 id="today-heading">วันนี้ของเธอ</h2>
              <div className="today-grid">
                <div className="tile" data-testid="moon">
                  <svg className="glyph" viewBox="0 0 56 56" aria-hidden="true">
                    <circle cx="28" cy="28" r="22" fill="#2a2150" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#c9a24b" strokeWidth="1" />
                    <path d={moonPath(moon.p, 22, 28, 28)} fill="#e9c96a" />
                  </svg>
                  <div><small>พระจันทร์วันนี้</small><b>{moon.name}</b><span className="sub">สว่าง {Math.round(moon.lit * 100)}%</span></div>
                </div>
                <div className="tile" data-testid="day-colour">
                  <div className="glyph"><span className="swatch" style={{ background: dayInfo.hex }} /></div>
                  <div><small>{dayInfo.day}</small><b>{dayInfo.colour}ประจำวัน</b><span className="sub">สีที่ช่วยให้ใจนิ่งและมั่นใจ</span></div>
                </div>
                {luckyToday ? (
                  <div className="tile" data-testid="lucky-card">
                    <div className="glyph"><span className="num">{luckyToday.number}</span></div>
                    <div>
                      <small>เลขและสีนำโชค จากไพ่วันนี้</small>
                      <b>เลข {luckyToday.number} · {luckyToday.colour.name}</b>
                      <span className="sub">จาก {dailyCard?.nameTh}</span>
                    </div>
                  </div>
                ) : (
                  <button className="tile locked" onClick={openDaily} data-testid="lucky-card">
                    <div className="glyph"><Sparkles size={26} strokeWidth={1.4} /></div>
                    <div><small>เลขและสีนำโชค</small><b>เปิดไพ่ประจำวันเพื่อดู</b><span className="sub">คำนวณจากไพ่ที่ได้วันนี้</span></div>
                  </button>
                )}
              </div>
            </section>

            <div className="streak-row">
              <div className="streak" title={ui.home.streakHint}>
                <Flame size={16} strokeWidth={1.8} />
                <span>{ui.home.streak(streak.current)}</span>
              </div>
              {ui.home.streakNote(streak) && <p className="fine streak-note" data-testid="streak-note">{ui.home.streakNote(streak)}</p>}
            </div>
          </main>

          <footer className="footer">
            <p>{ui.home.disclaimer}</p>
            <button className="text-button" onClick={() => setScreen({ kind: "about" })}>{ui.nav.about}</button>
          </footer>

          {screen && (
            <Dialog
              wide={screen.kind === "library"}
              title={title}
              onClose={() => (screen.kind === "share" ? setScreen({ kind: "reading", existing: screen.reading }) : setScreen(null))}
            >
              {screen.kind === "reading" && (
                <ReadingFlow
                  key={screen.existing?.id || `${screen.chip}-${screen.daily}`}
                  daily={screen.daily}
                  initialChip={screen.chip}
                  existing={screen.existing}
                  onSave={save}
                  onShare={(reading) => setScreen({ kind: "share", reading })}
                  onClose={() => setScreen(null)}
                />
              )}
              {screen.kind === "journal" && (
                <Journal readings={journal.readings} onOpen={(r) => setScreen({ kind: "reading", existing: r })} onDelete={erase} storageUnavailable={journal.storageUnavailable} />
              )}
              {screen.kind === "settings" && <SettingsForm birth={birth} onSave={saveBirthDate} onClose={() => setScreen(null)} />}
              {screen.kind === "library" && <Library />}
              {screen.kind === "share" && (
                <ShareView reading={screen.reading} onBack={() => setScreen({ kind: "reading", existing: screen.reading })} notify={setToast} />
              )}
              {screen.kind === "about" && (
                <div className="about">
                  <h2>{ui.about.title}</h2>
                  <p className="muted lead">{ui.about.p1}</p>
                  <div className="about-values">
                    {ui.about.values.map(([h, p]) => (
                      <div key={h}><h3>{h}</h3><p className="muted">{p}</p></div>
                    ))}
                  </div>
                  <button className="button primary full" onClick={openDaily}>{ui.about.cta}</button>
                </div>
              )}
            </Dialog>
          )}
          {toast && (
            <div className="toast" role="status">
              {toast}
              <button onClick={() => setToast("")} aria-label={ui.toast.close}><X size={16} /></button>
            </div>
          )}
        </div>
      </ArtworkContext.Provider>
    </MotionConfig>
  );
}
