import { motion } from "motion/react";

/** Thin gold line-art hand that glides across the fan to teach scrubbing. */
export default function Hand() {
  return (
    <motion.svg
      className="hand-hint"
      viewBox="0 0 80 120"
      width="88"
      height="132"
      fill="none"
      aria-hidden="true"
      initial={{ opacity: 0, x: -110, y: -70 }}
      animate={{
        opacity: [0, 1, 1, 1, 1, 1, 1, 0],
        x: [-110, -110, -60, 0, 60, 110, 110, 110],
        y: [-70, 22, 6, 0, 6, 22, 22, -70],
      }}
      transition={{ duration: 3.6, times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 0.92, 1], ease: "linear" }}
    >
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B8913A" />
          <stop offset=".5" stopColor="#F0DB9C" />
          <stop offset="1" stopColor="#B8913A" />
        </linearGradient>
        <linearGradient id="hf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9CF8A" stopOpacity="0" />
          <stop offset="1" stopColor="#E9CF8A" stopOpacity=".28" />
        </linearGradient>
      </defs>
      <g stroke="url(#hg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 0V38" />
        <path d="M24 38C14 38 8 46 9 54C10 61 17 64 23 61L33 55" />
        <path d="M33 55V100C33 106 36.5 111 40 111C43.5 111 47 106 47 100V48" />
        <path d="M47 48H60C64 48 67 51 67 55C67 59 64 62 60 62H47" />
        <path d="M47 62H58C62 62 65 65 65 69C65 73 62 76 58 76H47" />
        <path d="M47 76H54C57 76 59 78 59 81C59 84 57 86 54 86H47" opacity=".8" />
        <path d="M60 0V48" />
      </g>
    </motion.svg>
  );
}
