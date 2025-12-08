import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: "📈",
      title: "Real-Time Markets",
      description: "Trade on live prediction markets with real-time odds and instant execution"
    },
    {
      icon: "🏆",
      title: "Competitive Tournaments",
      description: "Compete in tournaments and climb the leaderboards to win big rewards"
    },
    {
      icon: "💰",
      title: "Secure Wallet",
      description: "Your funds are protected with bank-level security and instant withdrawals"
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description: "Track your performance with detailed statistics and insights"
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Traders" },
    { value: "$10M+", label: "Trading Volume" },
    { value: "1000+", label: "Markets" },
    { value: "99.9%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-purple-950/50" />

        {/* Animated orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000" />

        {/* Mouse follower */}
        <motion.div
          className="absolute w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"
          animate={{
            x: mousePosition.x - 128,
            y: mousePosition.y - 128,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Predict the Future.
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                  Win Big Rewards.
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
                Trade on the outcomes of real-world events. Join thousands of traders making predictions on politics, sports, crypto, and more.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/signup"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-lg shadow-2xl shadow-amber-500/50 transition-all hover:scale-105 hover:shadow-amber-500/70"
              >
                Start Trading Now
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-xl border-2 border-slate-700 hover:border-amber-500 text-white font-semibold text-lg transition-all hover:bg-slate-800/50"
              >
                Sign In
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Why Choose <span className="text-amber-400">Pryzm</span>?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              The most advanced prediction market platform with everything you need to succeed
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-8 backdrop-blur-xl hover:border-amber-500/50 transition-all"
              >
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/10 group-hover:to-amber-600/10 transition-all" />

                <div className="relative z-10">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              How It <span className="text-amber-400">Works</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Start making predictions in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create Account", desc: "Sign up in seconds and get your secure wallet" },
              { step: "2", title: "Choose Markets", desc: "Browse thousands of markets across multiple categories" },
              { step: "3", title: "Start Trading", desc: "Make predictions and watch your portfolio grow" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 font-bold text-2xl mb-6 shadow-xl shadow-amber-500/50">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-lg">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent -translate-x-1/2" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/50 p-12 backdrop-blur-xl shadow-2xl"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-purple-500/10" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />

            <div className="relative z-10 text-center">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Ready to Start <span className="text-amber-400">Winning</span>?
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Join thousands of traders making accurate predictions every day. No fees for the first month!
              </p>
              <Link
                to="/signup"
                className="inline-block px-10 py-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xl shadow-2xl shadow-amber-500/50 transition-all hover:scale-105 hover:shadow-amber-500/70"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-4">
                Pryzm
              </h3>
              <p className="text-slate-400">
                The future of prediction markets.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/markets" className="hover:text-amber-400 transition-colors">Markets</Link></li>
                <li><Link to="/tournaments" className="hover:text-amber-400 transition-colors">Tournaments</Link></li>
                <li><Link to="/news" className="hover:text-amber-400 transition-colors">News</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/about" className="hover:text-amber-400 transition-colors">About</Link></li>
                <li><Link to="/careers" className="hover:text-amber-400 transition-colors">Careers</Link></li>
                <li><Link to="/support" className="hover:text-amber-400 transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/terms" className="hover:text-amber-400 transition-colors">Terms</Link></li>
                <li><Link to="/privacy" className="hover:text-amber-400 transition-colors">Privacy</Link></li>
                <li><a href="mailto:support@pryzm.com" className="hover:text-amber-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/50 pt-8 text-center text-slate-400">
            <p>© 2025 Pryzm. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
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
      `}</style>
    </div>
  );
}
