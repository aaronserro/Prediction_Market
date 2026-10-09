import { useTheme } from "../lib/theme.jsx";

export default function ThemeToggle() {
  const { toggle, theme } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-[9px] border border-bd bg-sf text-tx2 flex items-center justify-center cursor-pointer p-0 hover:bg-sf2 flex-none"
    >
      <span
        className="block w-3.5 h-3.5 rounded-full border-[1.6px] border-current"
        style={{ background: "linear-gradient(90deg, currentColor 50%, transparent 50%)" }}
      />
    </button>
  );
}
