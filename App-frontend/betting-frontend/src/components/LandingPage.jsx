import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "Real-Time Markets",
    description:
      "Trade on live prediction markets with real-time odds and instant execution.",
  },
  {
    title: "Portfolio Tracking",
    description:
      "Monitor all your positions and P/L across every market in one place.",
  },
  {
    title: "Secure Wallet",
    description:
      "Your funds are protected with bank-level security and same-day settlements.",
  },
  {
    title: "Advanced Analytics",
    description:
      "Track your performance with detailed trade history and market insights.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white">

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0e14] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">Pryzm</span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-400 hover:to-violet-500 transition-all shadow-md shadow-violet-900/30">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-28 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-6">
          Prediction Markets
        </p>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-tight mb-6 max-w-3xl">
          Trade on what <span className="text-amber-400">you know.</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Pryzm is a closed prediction market platform where your insight has real value.
          Turn your edge on world events into measurable outcomes — politics, sports, finance, and more.
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/signup"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#1a0a00] text-sm font-black hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-900/25"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-4">What is Pryzm?</p>
            <h2 className="text-3xl font-semibold text-white mb-5 leading-snug">
              A smarter way to put your predictions to the test.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pryzm is a prediction market platform where anyone can sign up and start trading. Members
              use virtual currency to trade on the outcomes of real-world events — from elections and sports to
              financial markets and breaking news.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unlike traditional forecasting tools, Pryzm uses market mechanics to surface the most accurate
              collective predictions. The better your read on the world, the better your portfolio performs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-5">
              <p className="text-xs font-medium text-violet-400 uppercase tracking-wider mb-2">Trade</p>
              <p className="text-sm text-slate-400 leading-relaxed">Buy and sell positions on hundreds of live markets in real time.</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">Compete</p>
              <p className="text-sm text-slate-400 leading-relaxed">Climb the leaderboard and prove your predictions are sharper than the crowd.</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">Track</p>
              <p className="text-sm text-slate-400 leading-relaxed">Monitor your portfolio, P/L, and performance across every position.</p>
            </div>
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-5">
              <p className="text-xs font-medium text-violet-400 uppercase tracking-wider mb-2">Learn</p>
              <p className="text-sm text-slate-400 leading-relaxed">Sharpen your forecasting intuition on markets that reflect the real world.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-2">Everything you need</h2>
            <p className="text-sm text-slate-500">Built for serious traders who value clarity and speed.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 border-t-2 border-t-violet-500/40"
              >
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-2">How it works</h2>
            <p className="text-sm text-slate-500">Get up and running in minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create an account", desc: "Sign up in seconds and get access to all markets on the platform." },
              { step: "02", title: "Browse markets", desc: "Explore open markets across politics, sports, finance, and more." },
              { step: "03", title: "Trade and track", desc: "Place your positions and monitor your portfolio in real time." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <span className="text-xs font-mono text-amber-400 mt-0.5 flex-shrink-0">{item.step}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent mb-2">Pryzm</p>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              The future of prediction markets. Trade on what you know.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm text-slate-500">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Product</p>
              <ul className="space-y-2">
                <li><Link to="/markets" className="hover:text-white transition-colors">Markets</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/portfolio" className="hover:text-white transition-colors">Portfolio</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Company</p>
              <ul className="space-y-2">
                <li><a href="mailto:pryzmcompany@gmail.com" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Legal</p>
              <ul className="space-y-2">
                <li><span className="cursor-default">Terms</span></li>
                <li><span className="cursor-default">Privacy</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-slate-700">© 2026 Pryzm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
