import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '../auth/AuthContext.jsx';
import { Link } from 'react-router-dom';

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
 p     viewBox="0 0 24 24"
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

// Removed hardcoded userStats - now fetched from API

// --- Reusable Components -------------------------------------------------------

function StatCard({ icon: Icon, title, value, unit, color = "amber", trend }) {
  const colorClasses = {
    amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30 shadow-amber-500/20",
    green: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 shadow-emerald-500/20",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 shadow-purple-500/20",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 shadow-blue-500/20"
  };

  const iconColorClasses = {
    amber: "from-amber-400 to-amber-600",
    green: "from-emerald-400 to-emerald-600",
    purple: "from-purple-400 to-purple-600",
    blue: "from-blue-400 to-blue-600"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-6 shadow-2xl ${colorClasses[color]}`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className={`absolute inset-0 bg-gradient-to-r ${iconColorClasses[color]} blur-3xl`} />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconColorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-slate-900" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>

        <div className="text-sm font-medium uppercase tracking-wider text-slate-400 mb-2">
          {title}
        </div>
        <div className="text-3xl font-bold text-white flex items-baseline gap-1">
          {unit}<span className="tabular-nums">{value}</span>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${iconColorClasses[color]} opacity-10 rounded-full blur-2xl`} />
    </motion.div>
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
      whileHover={{ y: -2 }}
      className="group relative min-w-[24rem] max-w-[36rem] overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-5 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/20 sm:min-w-[28rem] lg:min-w-[34rem]"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <ICONS.megaphone className="h-5 w-5 text-slate-900" />
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Announcement
            </div>
            <div className="text-xs text-slate-500">Just now</div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-amber-300 transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
          {item.body}
        </p>

        <div className="flex items-center gap-2 text-sm font-semibold text-amber-400 group-hover:gap-3 transition-all">
          Read More
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </motion.a>
  );
}

function GameCard({ game, icon: Icon }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group relative flex cursor-pointer flex-col items-start overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-6 text-left shadow-2xl backdrop-blur-xl hover:border-indigo-500/50 hover:shadow-indigo-500/20"
    >
      {/* Animated background gradient */}
      <motion.div
        animate={{ opacity: isHovered ? 0.3 : 0 }}
        className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
      />

      {/* Icon with glow effect */}
      <div className="relative z-10">
        <motion.div
          animate={{ rotate: isHovered ? [0, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
            <Icon className="w-8 h-8 text-white" />
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 w-full mt-5">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
          {game.name}
        </h3>
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {game.description}
        </p>

        <motion.div
          animate={{ x: isHovered ? 5 : 0 }}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-400 group-hover:text-indigo-300"
        >
          Play Now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.div>
      </div>

      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

// --- Page Sections -------------------------------------------------------------

function HeaderDashboard({ username, balance, rank, loading }) {
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(balance);

  return (
    <section className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 p-8 backdrop-blur-xl shadow-2xl"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-bold text-slate-900">
                {loading ? "..." : username.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg border-4 border-slate-900 shadow-lg">
              <div className="w-full h-full bg-emerald-400 rounded animate-ping" />
            </div>
          </motion.div>

          {/* Welcome Text */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  {loading ? "..." : username}
                </span>
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="inline-block ml-2"
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-slate-400 text-lg">
                Ready to make your predictions? Let's dive in!
              </p>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3"
          >
            <Link
              to="/wallet"
              className="px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 font-medium transition-all flex items-center gap-2"
            >
              <span>💰</span>
              <span className="hidden sm:inline">Add Funds</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <StatCard
          icon={ICONS.wallet}
          title="Balance"
          value={loading ? "..." : formattedBalance.replace("$", "")}
          unit="$"
          color="amber"
          trend={5.2}
        />
        <StatCard
          icon={ICONS.trophy}
          title="Rank"
          value={loading ? "..." : rank}
          color="purple"
        />
        <StatCard
          icon={ICONS.user}
          title="Active Bets"
          value={loading ? "..." : "12"}
          color="blue"
          trend={8.5}
        />
        <StatCard
          icon={() => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          title="Win Rate"
          value={loading ? "..." : "68"}
          unit="%"
          color="green"
          trend={3.1}
        />
      </motion.div>
    </section>
  );
}

function AnnouncementsSection({ items = defaultAnnouncements }) {
  const marquee = useMemo(() => [...items, ...items], [items]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.45, duration: 0.6 }}
      className="relative"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            📢 Latest Updates
          </h2>
          <p className="mt-2 text-slate-400 text-lg">
            Stay informed with the latest news
          </p>
        </div>
      </div>

      {/* Container with controlled overflow */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Gradient fade-out masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0f0f14] via-[#0f0f14] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0f0f14] via-[#0f0f14] to-transparent" />

        {/* Marquee Track */}
        <div className="group py-2">
          <div className="flex animate-[marquee_40s_linear_infinite] gap-6 will-change-transform group-hover:[animation-play-state:paused]">
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
    </motion.section>
  );
}

function GamesSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="relative"
    >
      <div className="mb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              🎮 Game Lobby
            </h2>
            <p className="mt-2 text-slate-400 text-lg">
              Choose your game and start winning
            </p>
          </div>
          <Link
            to="/games"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((g, idx) => {
          const Icon = GAME_ICONS[g.key] || ICONS.poker;
          return (
            <motion.div
              key={g.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.05 }}
            >
              <GameCard game={g} icon={Icon} />
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

// --- Main Page Component -------------------------------------------------------

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWallet() {
      console.log('[Dashboard] user object:', user);
      console.log('[Dashboard] authLoading:', authLoading);

      if (authLoading) {
        console.log('[Dashboard] Still loading auth, waiting...');
        return;
      }

      if (!user) {
        console.log('[Dashboard] No user, setting loading to false');
        setLoading(false);
        return;
      }

      // Try to get user ID from different possible fields
      const userId = user.id || user.userId || user.username;
      console.log('[Dashboard] Using userId:', userId);

      if (!userId) {
        console.error('[Dashboard] No user ID found in user object');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const url = `${API_BASE}/api/v1/users/${userId}/wallet`;
        console.log('[Dashboard] Fetching wallet from:', url);

        const res = await fetch(url, {
          credentials: "include",
        });

        console.log('[Dashboard] Wallet response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('[Dashboard] Wallet data:', data);
          setWallet(data);
        } else {
          const text = await res.text();
          console.error('[Dashboard] Failed to fetch wallet:', res.status, text);
        }
      } catch (err) {
        console.error('[Dashboard] Error fetching wallet:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWallet();
  }, [user, authLoading]);

  const balance = wallet?.balanceCents ? wallet.balanceCents / 100 : 0;
  const username = user?.username || "User";
  const rank = "Gold II"; // TODO: fetch from backend if available

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-purple-950/50" />

        {/* Animated orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <main className="flex-1 w-full pt-24 pb-12">
        <div className="mx-auto w-full max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <HeaderDashboard username={username} balance={balance} rank={rank} loading={loading} />
          <AnnouncementsSection />
          <GamesSection />
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl py-8"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © 2025 Pryzm. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">
                Privacy
              </Link>
              <Link to="/support" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </motion.footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        body {
          font-family: 'Inter', sans-serif;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #0f172a;
        }

        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}