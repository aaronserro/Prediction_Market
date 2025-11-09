import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Betting App: Fixed Dashboard
 * Fixed: Announcements section visibility issue
 */

// --- SVG Icons -----------------------------------------------------------------
const ICONS = {
  megaphone: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  user: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  wallet: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16" />
    </svg>
  ),
  trophy: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.81 18.75 7 19.78 7 21" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.19 18.75 17 19.78 17 21" />
      <path d="M18 4H6v8c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4V4z" />
    </svg>
  ),
  blackjack: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 4h-4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
      <path d="M4 7v10M20 7v10" />
    </svg>
  ),
  roulette: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" />
      <path d="m19.07 4.93-1.41 1.41" />
      <path d="m17.66 17.66-1.41 1.41" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m6.34 6.34 1.41 1.41" />
      <path d="m12 2 1.41 2.41" />
      <path d="m22 12-2.41-1.41" />
      <path d="m12 22-1.41-2.41" />
      <path d="m2 12 2.41 1.41" />
    </svg>
  ),
  poker: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 16h.01" />
      <path d="M3 20h.01" />
      <path d="M7 16h.01" />
      <path d="M7 20h.01" />
      <path d="M11 16h.01" />
      <path d="M11 20h.01" />
      <path d="M15 16h.01" />
      <path d="M15 20h.01" />
      <path d="M19 16h.01" />
      <path d="M19 20h.01" />
      <path d="M5 8v8" />
      <path d="M9 8v8" />
      <path d="M13 8v8" />
      <path d="M17 8v8" />
      <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    </svg>
  ),
  sudoku: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  battleship: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 20h20" />
      <path d="M4 18V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12" />
      <path d="M12 8h.01" />
      <path d="M12 12h.01" />
      <path d="M12 16h.01" />
      <path d="M16 12h.01" />
      <path d="M8 12h.01" />
    </svg>
  ),
  twenty48: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 13h2" />
      <path d="M20 13h2" />
      <path d="M11 2v2" />
      <path d="M11 20v2" />
      <path d="M4.6 4.6l1.4 1.4" />
      <path d="M17.9 17.9l1.4 1.4" />
      <path d="M4.6 17.9l1.4-1.4" />
      <path d="M17.9 4.6l1.4 1.4" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 12h2v-2" />
      <path d="M13 17v-5h4" />
      <path d="M11 17v-2a2 2 0 0 1 2-2h2" />
    </svg>
  ),
  wordsearch: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <path d="M7 11h8" />
      <path d="M11 7v8" />
    </svg>
  ),
  chess: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 18L10 14.5" />
      <path d="M14 18l2-3.5" />
      <path d="M8.5 7h7" />
      <path d="M6 18h12" />
      <path d="M4 22h16" />
      <path d="M10 4.5a2.5 2.5 0 0 1 5 0V7H10V4.5z" />
      <path d="M6 18c0-2.6 1.8-5 4-6" />
      <path d="M18 18c0-2.6-1.8-5-4-6" />
    </svg>
  ),
};

const GAME_ICONS = {
  blackjack: ICONS.blackjack,
  roulette: ICONS.roulette,
  poker: ICONS.poker,
  sudoku: ICONS.sudoku,
  battleship: ICONS.battleship,
  twenty48: ICONS.twenty48,
  wordsearch: ICONS.wordsearch,
  chess: ICONS.chess,
};

// --- Mock Data -----------------------------------------------------------------

const defaultAnnouncements = [
  {
    id: 1,
    title: "Welcome to Fantasy Labs!",
    body: "Weekly tournaments open — claim your free entry before Friday 11:59 PM!",
    href: "/events/weeklies",
  },
  {
    id: 2,
    title: "System Status",
    body: "All systems operational. Minor maintenance window on Sept 20, 02:00–03:00 ET.",
    href: "/status",
  },
  {
    id: 3,
    title: "New Game",
    body: "Try our brand‑new Word Search Arena with streak multipliers and daily ladders!",
    href: "/games/word-search",
  },
];

const games = [
  {
    key: "blackjack",
    name: "Blackjack",
    path: "/games/blackjack",
    description: "Beat the dealer. Smart hints on.",
  },
  {
    key: "roulette",
    name: "Roulette",
    path: "/games/roulette",
    description: "Inside/outside bets with history.",
  },
  {
    key: "poker",
    name: "Poker",
    path: "/games/poker",
    description: "Texas Hold'em vs CPU (beta).",
  },
  {
    key: "sudoku",
    name: "Sudoku",
    path: "/games/sudoku",
    description: "Generator, solver, and validator.",
  },
  {
    key: "battleship",
    name: "Battleship",
    path: "/games/battleship",
    description: "Three AI levels, fog of war.",
  },
  {
    key: "twenty48",
    name: "2048",
    path: "/games/2048",
    description: "Smooth swipes, combo tracker.",
  },
  {
    key: "wordsearch",
    name: "Word Search",
    path: "/games/word-search",
    description: "Daily boards, ranked mode.",
  },
  {
    key: "chess",
    name: "Chess",
    path: "/games/chess",
    description: "PvP only — spectate coming soon.",
  },
];

const userStats = {
  username: "PlayerOne",
  balance: 1234.56,
  rank: "Gold II",
};

// --- Reusable Components -------------------------------------------------------

function StatCard({ icon: Icon, title, value, unit }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-black/30 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-sm font-medium uppercase tracking-wider text-zinc-400">
            {title}
          </div>
          <div className="text-2xl font-semibold text-white">
            {unit}
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-amber-400 sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-300/80 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
    </div>
  );
}

function AnnouncementCard({ item, isClone = false }) {
  return (
    <motion.a
      key={isClone ? `clone-${item.id}` : item.id}
      href={item.href}
      className="group relative min-w-[24rem] max-w-[36rem] overflow-hidden rounded-xl border border-zinc-800/80 bg-black/30 p-4 backdrop-blur-md transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 sm:min-w-[28rem] lg:min-w-[34rem]"
    >
      <div className="flex items-center gap-2.5">
        <ICONS.megaphone className="h-4 w-4 text-amber-400" />
        <div className="text-[0.7rem] font-medium uppercase tracking-wider text-amber-400">
          Announcement
        </div>
      </div>
      <div className="mt-2 text-base font-medium text-white line-clamp-1">
        {item.title}
      </div>
      <div className="text-sm text-zinc-300/90 line-clamp-2">{item.body}</div>
    </motion.a>
  );
}

function GameCard({ game, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative flex cursor-pointer flex-col items-start overflow-hidden rounded-2xl border border-zinc-800/70 bg-black/30 p-5 text-left shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 transition-all duration-300 group-hover:scale-105 group-hover:text-indigo-300">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white">{game.name}</h3>
      <p className="mt-1 text-sm text-zinc-300/90">{game.description}</p>

      <div className="mt-4 w-full flex-1 text-xs font-medium tracking-wide uppercase text-indigo-400 transition-all duration-300 group-hover:text-indigo-300">
        Play now →
      </div>
    </motion.div>
  );
}

// --- Page Sections -------------------------------------------------------------

function HeaderDashboard() {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(userStats.balance);

  return (
    <section>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/50">
          <ICONS.user className="h-6 w-6 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Welcome back,{" "}
            <span className="text-amber-400">{userStats.username}</span>
          </h1>
          <p className="text-sm text-zinc-400 sm:text-base">
            Ready to play? Here's your status.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        <StatCard
          icon={ICONS.wallet}
          title="Balance"
          value={formattedBalance.replace("$", "")}
          unit="$"
        />
        <StatCard icon={ICONS.trophy} title="Rank" value={userStats.rank} />
      </div>
    </section>
  );
}

function AnnouncementsSection({ items = defaultAnnouncements }) {
  const marquee = useMemo(() => [...items, ...items], [items]);

  return (
    <section className="relative">
      <div className="pb-5 sm:pb-6">
        <SectionHeader
          title="Announcements"
          subtitle="News, status, and new drops"
        />
      </div>

      {/* Container with controlled overflow */}
      <div className="relative overflow-hidden">
        {/* Gradient fade-out masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0f0f14] via-[#0f0f14] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0f0f14] via-[#0f0f14] to-transparent" />

        {/* Marquee Track */}
        <div className="group py-1">
          <div className="flex animate-[marquee_30s_linear_infinite] gap-6 will-change-transform group-hover:[animation-play-state:paused]">
            {marquee.map((a, idx) => (
              <AnnouncementCard
                key={`${a.id}-${idx}`}
                item={a}
                isClone={idx >= items.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GamesSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-black/20 via-black/30 to-black/50 shadow-2xl backdrop-blur-xl">
      <div className="p-5 sm:p-6">
        <SectionHeader title="Game Lobby" subtitle="Pick a mode to start playing" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
          {games.map((g) => {
            const Icon = GAME_ICONS[g.key] || ICONS.poker;
            return <GameCard key={g.key} game={g} icon={Icon} />;
          })}
        </div>
      </div>
    </section>
  );
}

// --- Main Page Component -------------------------------------------------------

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col bg-[#0f0f14] text-zinc-100">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(99, 102, 241, 0.2), transparent 80%), radial-gradient(1000px 500px at 90% -20%, rgba(217, 70, 239, 0.15), transparent 80%), #0f0f14",
        }}
      />

      <main className="flex-1 w-full pt-[60px]">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:space-y-12">
          <HeaderDashboard />
          <AnnouncementsSection />
          <GamesSection />
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
          font-family: 'Inter', sans-serif;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}