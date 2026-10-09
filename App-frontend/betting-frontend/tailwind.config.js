/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#FFD700",
        night: "#0b0b0f",
        ink: "#111111",
        // Pryzm design tokens (defined as CSS variables in src/index.css)
        bg: "var(--bg)",
        sf: "var(--sf)",
        sf2: "var(--sf2)",
        bd: "var(--bd)",
        bd2: "var(--bd2)",
        tx: "var(--tx)",
        tx2: "var(--tx2)",
        mu: "var(--mu)",
        pr: "var(--pr)",
        prh: "var(--prh)",
        prs: "var(--prs)",
        prt: "var(--prt)",
        am: "var(--am)",
        ams: "var(--ams)",
        amt: "var(--amt)",
        yes: "var(--yes)",
        yess: "var(--yess)",
        no: "var(--no)",
        nos: "var(--nos)",
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["'Geist Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.4)",
        sh: "var(--sh)",
        lift: "0 1px 2px rgba(20,16,40,.04), 0 12px 40px -12px rgba(60,30,140,.18)",
        trade: "0 1px 2px rgba(20,16,40,.04), 0 12px 32px -16px rgba(60,30,140,.2)",
        seg: "0 1px 2px rgba(0,0,0,.1)",
      },
      maxWidth: {
        page: "1240px",
      },
    },
  },
  plugins: [],
}
