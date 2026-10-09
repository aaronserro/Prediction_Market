import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import { Coin } from "./ui.jsx";
import rankImages, { RANK_KEYS, formatRank } from "../lib/rankImages.js";

const FACTS = [
  { icon: <Coin size={12} />, text: "Virtual currency only, no real money" },
  { icon: <span className="w-1.5 h-1.5 bg-pr rotate-45 mx-[3px]" />, text: "Ranked from Bronze to Gold" },
  { icon: <span className="w-1.5 h-1.5 rounded-full bg-yes mx-[3px]" />, text: "Live markets on politics, sports, finance and more" },
];

/** Split layout shared by Login and Signup. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="hidden lg:flex w-1/2 flex-col justify-between bg-sf border-r border-bd p-10">
        <Link to="/" className="flex items-center gap-[9px] text-tx w-fit">
          <img src="/pryzm-icon.svg" alt="Pryzm" className="w-7 h-7" />
          <span className="text-[17px] font-[650] tracking-[-0.02em]">Pryzm</span>
        </Link>

        <div className="max-w-[460px]">
          <h2 className="m-0 mb-5 text-[44px] leading-[1.04] font-[650] tracking-[-0.045em]">
            <span className="block">Trade on what</span>
            <span className="block text-pr">you know.</span>
          </h2>
          <p className="m-0 mb-8 text-[16px] leading-[1.6] text-tx2">
            Pryzm is a prediction market where your insight has real value. Turn your edge on world events into measurable outcomes.
          </p>
          <ul className="m-0 p-0 list-none flex flex-col gap-3 text-[14px] text-tx2">
            {FACTS.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5">{f.icon}{f.text}</li>
            ))}
          </ul>
          <div className="mt-10 flex items-end gap-1.5 p-4 rounded-2xl bg-bg border border-bd">
            {RANK_KEYS.map((k, i) => (
              <img key={k} src={rankImages[k]} alt={formatRank(k)} title={formatRank(k)} className="block min-w-0 flex-[0_1_auto]" style={{ width: 28 + i * 3 }} />
            ))}
          </div>
        </div>

        <p className="m-0 text-[12.5px] text-mu">© 2026 Pryzm. Pryzm uses virtual currency only.</p>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 h-[60px]">
          <Link to="/" className="lg:invisible flex items-center gap-[9px] text-tx">
            <img src="/pryzm-icon.svg" alt="Pryzm" className="w-7 h-7" />
            <span className="text-[17px] font-[650] tracking-[-0.02em]">Pryzm</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-16 pt-6">
          <div className="w-full max-w-[380px]">
            <h1 className="m-0 text-[32px] font-[650] tracking-[-0.035em] leading-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 mb-8 text-[14.5px] text-mu">{subtitle}</p>}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
