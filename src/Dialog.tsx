import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Moon, X } from "lucide-react";
import { ui } from "./ui/copy";
import type { ReactNode } from "react";

export default function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const scroll = document.body.style.overflow;
    const root = document.getElementById("root");
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const items = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input,textarea,select,[tabindex="0"]',
          ) || [],
        ).filter((el) => el.getClientRects().length > 0);
        const first = items[0],
          last = items[items.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      if (root) root.inert = false;
      document.body.style.overflow = scroll;
      document.removeEventListener("keydown", handle);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <motion.div
      className="dialog-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className={`dialog ${wide ? "dialog-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <div className="dialog-top">
          <span className="mini-brand">
            <Moon size={16} strokeWidth={1.6} /> {ui.brand}
          </span>
          <button className="icon-button" onClick={onClose} aria-label={ui.close}>
            <X size={20} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
