import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time Markets",
    description: "Trade on live prediction markets with real-time odds and instant execution.",
  },
  {
    icon: "📊",
    title: "Portfolio Tracking",
    description: "Monitor all your positions and P&L across every market in one unified view.",
  },
  {
    icon: "🔒",
    title: "Secure Wallet",
    description: "Your funds are protected with bank-level security and same-day settlements.",
  },
  {
    icon: "🧠",
    title: "Advanced Analytics",
    description: "Track your performance with detailed trade history and market insights.",
  },
];

const STATS = [
  { value: "12K+", label: "Active Traders" },
  { value: "340+", label: "Live Markets" },
  { value: "98.4%", label: "Uptime" },
  { value: "$2.1M", label: "Volume Traded" },
];

const TICKERS = [
  { label: "US Election 2026", value: "+3.2%", up: true },
  { label: "Fed Rate Cut Sep", value: "-1.8%", up: false },
  { label: "BTC > $100K", value: "+5.1%", up: true },
  { label: "NBA Finals Winner", value: "+0.4%", up: true },
  { label: "UK General Election", value: "-2.3%", up: false },
  { label: "Tesla Q3 Earnings", value: "+1.9%", up: true },
  { label: "Oil > $90/bbl", value: "-0.7%", up: false },
  { label: "AI Regulation Bill", value: "+4.6%", up: true },
  { label: "US Election 2026", value: "+3.2%", up: true },
  { label: "Fed Rate Cut Sep", value: "-1.8%", up: false },
  { label: "BTC > $100K", value: "+5.1%", up: true },
  { label: "NBA Finals Winner", value: "+0.4%", up: true },
];

function TickerBar() {
  return (
    <div style={{
      overflow: "hidden",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.015)",
      padding: "10px 0",
    }}>
      <div style={{
        display: "flex",
        gap: "2.5rem",
        animation: "ticker 40s linear infinite",
        width: "max-content",
      }}>
        {TICKERS.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>{t.label}</span>
            <span style={{
              fontSize: "11px",
              fontWeight: 600,
              fontFamily: "'DM Mono', monospace",
              color: t.up ? "#4ade80" : "#f87171",
              background: t.up ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
              padding: "1px 6px",
              borderRadius: "4px",
            }}>{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080b10", color: "white", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        .hero-tag { animation: fadeUp 0.6s ease both; }
        .hero-h1 { animation: fadeUp 0.6s ease 0.1s both; }
        .hero-sub { animation: fadeUp 0.6s ease 0.2s both; }
        .hero-cta { animation: fadeUp 0.6s ease 0.3s both; }
        .hero-stats { animation: fadeUp 0.6s ease 0.4s both; }

        .cta-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 13px 28px; border-radius: 12px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: #1a0800; font-size: 14px; font-weight: 700;
          text-decoration: none; letter-spacing: -0.01em;
          transition: all 0.2s ease; box-shadow: 0 0 40px rgba(249,115,22,0.3);
        }
        .cta-primary:hover { transform: translateY(-1px); box-shadow: 0 0 60px rgba(249,115,22,0.4); filter: brightness(1.05); }

        .cta-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 13px 24px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7); font-size: 14px;
          text-decoration: none; background: rgba(255,255,255,0.04);
          transition: all 0.2s ease;
        }
        .cta-secondary:hover { border-color: rgba(255,255,255,0.25); color: white; background: rgba(255,255,255,0.08); }

        .feature-card {
          border-radius: 16px; padding: 28px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          transition: all 0.25s ease;
        }
        .feature-card:hover {
          border-color: rgba(139,92,246,0.35);
          background: rgba(139,92,246,0.06);
          transform: translateY(-2px);
        }

        .nav-link {
          font-size: 14px; color: rgba(255,255,255,0.5);
          text-decoration: none; transition: color 0.15s;
        }
        .nav-link:hover { color: white; }

        .step-card {
          padding: 28px; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          position: relative; overflow: hidden;
        }
        .step-card::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at top left, rgba(139,92,246,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .stat-card {
          padding: 20px 24px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025); text-align: center;
        }

        .glow-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
          animation: pulse-glow 6s ease-in-out infinite;
        }

        .category-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 100px;
          font-size: 12px; font-weight: 500; cursor: default;
          border: 1px solid;
        }

        footer a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.15s; }
        footer a:hover { color: white; }
      `}</style>

      {/* Hero */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 60px", overflow: "hidden" }}>
        {/* Glow orbs */}
        <div className="glow-orb" style={{ width: "600px", height: "600px", background: "rgba(139,92,246,0.18)", top: "-100px", left: "50%", transform: "translateX(-50%)" }} />
        <div className="glow-orb" style={{ width: "400px", height: "400px", background: "rgba(245,158,11,0.1)", bottom: "0px", right: "-100px", animationDelay: "3s" }} />

        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", textAlign: "center", maxWidth: "800px" }}>
          <div className="hero-tag" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "100px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", marginBottom: "32px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", display: "inline-block" }} />
            <span style={{ fontSize: "12px", color: "#c4b5fd", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Prediction Markets · Live Now</span>
          </div>

          <h1 className="hero-h1" style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(48px, 7vw, 82px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "white",
            marginBottom: "24px",
          }}>
            Trade on what<br />
            <span style={{ fontStyle: "italic", color: "#fcd34d" }}>you know.</span>
          </h1>

          <p className="hero-sub" style={{ fontSize: "18px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 40px", fontWeight: 300 }}>
            Pryzm is a prediction market platform where your insight has real value. Turn your edge on world events into measurable outcomes.
          </p>

          <div className="hero-cta" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/signup" className="cta-primary">
              Start Trading Free
              <span style={{ fontSize: "16px" }}>→</span>
            </Link>
            <Link to="/login" className="cta-secondary">
              Sign in to your account
            </Link>
          </div>

          {/* Market categories */}
          <div className="hero-stats" style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "48px" }}>
            {["🗳️ Politics", "⚽ Sports", "📈 Finance", "🌍 World Events", "🎬 Entertainment"].map(cat => (
              <span key={cat} className="category-pill" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Ticker */}
      <TickerBar />

      {/* Stats */}
      <section style={{ padding: "80px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: "36px", fontWeight: 400, color: "white", marginBottom: "4px" }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>What is Pryzm?</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 300, lineHeight: 1.2, color: "white", marginBottom: "24px", letterSpacing: "-0.01em" }}>
              A smarter way to put your predictions to the test.
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, marginBottom: "16px", fontWeight: 300 }}>
              Pryzm is a prediction market platform where anyone can sign up and start trading. Members use virtual currency to trade on the outcomes of real-world events — from elections and sports to financial markets and breaking news.
            </p>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, fontWeight: 300 }}>
              Unlike traditional forecasting tools, Pryzm uses market mechanics to surface the most accurate collective predictions. The better your read on the world, the better your portfolio performs.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { label: "Trade", color: "#8b5cf6", bg: "rgba(139,92,246,0.07)", border: "rgba(139,92,246,0.2)", desc: "Buy and sell positions on hundreds of live markets in real time." },
              { label: "Compete", color: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)", desc: "Compete and win with superior predictions." },
              { label: "Track", color: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)", desc: "Monitor your portfolio, P&L, and performance across every position." },
              { label: "Learn", color: "#8b5cf6", bg: "rgba(139,92,246,0.07)", border: "rgba(139,92,246,0.2)", desc: "Sharpen your forecasting intuition on markets that reflect the real world." },
            ].map(item => (
              <div key={item.label} style={{ padding: "22px", borderRadius: "14px", border: `1px solid ${item.border}`, background: item.bg }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: item.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>{item.label}</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: 1.65, fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "100px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "56px", maxWidth: "480px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Platform</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 300, color: "white", lineHeight: 1.2, letterSpacing: "-0.01em", marginBottom: "12px" }}>Everything you need to trade smarter</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>Built for serious traders who value clarity and speed.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", marginBottom: "18px" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "white", marginBottom: "10px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, fontWeight: 300 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: "100px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "56px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Process</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 300, color: "white", letterSpacing: "-0.01em", marginBottom: "12px" }}>Get up and running in minutes</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {[
              { step: "01", title: "Create an account", desc: "Sign up in seconds and get access to all markets on the platform. No credit card required." },
              { step: "02", title: "Browse markets", desc: "Explore open markets across politics, sports, finance, and more. Filter by category or trending." },
              { step: "03", title: "Trade and track", desc: "Place your positions and monitor your portfolio in real time. Watch your insight pay off." },
            ].map((item, i) => (
              <div key={item.step} className="step-card">
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#f59e0b", fontWeight: 500, letterSpacing: "0.05em", marginBottom: "20px" }}>{item.step}</div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "white", marginBottom: "12px", letterSpacing: "-0.01em" }}>{item.title}</h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, fontWeight: 300 }}>{item.desc}</p>
                {i < 2 && (
                  <div style={{ position: "absolute", top: "28px", right: "-10px", width: "20px", height: "1px", background: "rgba(255,255,255,0.08)", zIndex: 1 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{
            borderRadius: "24px",
            padding: "clamp(32px, 6vw, 64px)",
            background: "radial-gradient(circle at 30% 20%, rgba(167,139,250,0.22), transparent 50%), linear-gradient(145deg, rgba(32,18,59,0.86), rgba(19,12,37,0.95))",
            border: "1px solid rgba(167,139,250,0.35)",
            textAlign: "center", position: "relative", overflow: "hidden",
            boxShadow: "0 24px 60px rgba(76,29,149,0.28)",
          }}>
            <div style={{ position: "absolute", width: "420px", height: "420px", borderRadius: "50%", background: "rgba(139,92,246,0.26)", filter: "blur(70px)", top: "-180px", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: "1px", borderRadius: "23px", border: "1px solid rgba(221,214,254,0.1)", pointerEvents: "none" }} />
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px", position: "relative" }}>Ready to start?</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 300, color: "white", marginBottom: "20px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Your edge is worth something.<br />
              <span style={{ fontStyle: "italic", color: "#d8b4fe" }}>Start proving it.</span>
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.62)", marginBottom: "36px", fontWeight: 300, position: "relative" }}>Join thousands of traders making their predictions count.</p>
            <Link
              to="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                textDecoration: "none",
                padding: "15px 36px",
                color: "#f5f3ff",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                border: "1px solid rgba(221,214,254,0.4)",
                boxShadow: "0 12px 34px rgba(109,40,217,0.45)",
                position: "relative",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 16px 38px rgba(109,40,217,0.6)";
                e.currentTarget.style.filter = "brightness(1.04)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 12px 34px rgba(109,40,217,0.45)";
                e.currentTarget.style.filter = "brightness(1)";
              }}
            >
              Create Free Account →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 24px 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "48px", flexWrap: "wrap", marginBottom: "48px" }}>
            <div style={{ maxWidth: "240px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }} />
                <span style={{ fontSize: "15px", fontWeight: 700, background: "linear-gradient(to right, #ddd6fe, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pryzm</span>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", lineHeight: 1.7, fontWeight: 300 }}>The future of prediction markets. Trade on what you know.</p>
            </div>
            <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}>
              {[
                { heading: "Product", links: [{ label: "Markets", to: "/markets" }, { label: "Dashboard", to: "/dashboard" }, { label: "Portfolio", to: "/portfolio" }] },
                { heading: "Company", links: [{ label: "Contact", href: "mailto:pryzmcompany@gmail.com" }] },
                { heading: "Legal", links: [{ label: "Terms" }, { label: "Privacy" }] },
              ].map(col => (
                <div key={col.heading}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>{col.heading}</p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {col.links.map(l => (
                      <li key={l.label} style={{ fontSize: "14px" }}>
                        {l.to ? <Link to={l.to} style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>{l.label}</Link>
                          : l.href ? <a href={l.href} style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>{l.label}</a>
                          : <span style={{ color: "rgba(255,255,255,0.2)", cursor: "default" }}>{l.label}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px" }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.15)" }}>© 2026 Pryzm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}