import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTheme } from "../lib/theme.jsx";
import { fmtDate } from "../lib/format.js";
import { Page, PageHeader, Segmented, Toggle, btnDanger, btnSecondary, card, inputCls } from "../components/ui.jsx";

function Section({ title, children, danger = false }) {
  return (
    <section
      className={`${card} overflow-hidden`}
      style={danger ? { borderColor: "color-mix(in srgb, var(--no) 35%, transparent)" } : undefined}
    >
      <div className="px-6 py-[18px] border-b border-bd">
        <h2 className={`m-0 text-[17px] font-[620] tracking-[-0.02em] ${danger ? "text-no" : ""}`}>{title}</h2>
      </div>
      <div className="px-6">{children}</div>
    </section>
  );
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-bd last:border-b-0">
      <div className="min-w-0">
        <div className="text-[14.5px] font-[550]">{label}</div>
        {description && <div className="text-[13px] text-mu mt-0.5">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, on, onChange }) {
  return (
    <Row label={label} description={description}>
      <Toggle on={on} onChange={onChange} label={label} />
    </Row>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div>
      <div className="text-[13px] text-tx2 font-medium mb-[7px]">{label}</div>
      <div className="h-[46px] px-3.5 rounded-[11px] bg-sf2 border border-bd flex items-center text-[14.5px] truncate">{value}</div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Preference toggles are local-only until a settings endpoint exists.
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [marketAlerts, setMarketAlerts] = useState(true);
  const [tournamentUpdates, setTournamentUpdates] = useState(true);
  const [winLossNotifications, setWinLossNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [autoRenewBets, setAutoRenewBets] = useState(false);
  const [betConfirmation, setBetConfirmation] = useState(true);

  return (
    <Page className="flex flex-col gap-5 !max-w-[880px]">
      <PageHeader title="Settings" subtitle="Manage your account preferences and security settings" />

      <Section title="Profile">
        <div className="py-5 grid gap-4 sm:grid-cols-2">
          <ReadOnly label="Username" value={user?.username || "Guest"} />
          <ReadOnly label="Email" value={user?.email || "Not provided"} />
          <ReadOnly label="Member since" value={user?.createdAt ? fmtDate(user.createdAt) : "—"} />
        </div>
      </Section>

      <Section title="Appearance">
        <Row label="Theme" description="Light is the default. Your choice is saved on this device.">
          <Segmented
            options={["Light", "Dark"]}
            value={theme === "dark" ? "Dark" : "Light"}
            onChange={(v) => setTheme(v.toLowerCase())}
          />
        </Row>
      </Section>

      <Section title="Notifications">
        <ToggleRow label="Email notifications" description="Receive updates and alerts via email" on={emailNotifications} onChange={setEmailNotifications} />
        <ToggleRow label="Push notifications" description="Get real-time browser notifications" on={pushNotifications} onChange={setPushNotifications} />
        <ToggleRow label="Market alerts" description="Notifications about market changes and closures" on={marketAlerts} onChange={setMarketAlerts} />
        <ToggleRow label="Tournament updates" description="Get notified about tournament events" on={tournamentUpdates} onChange={setTournamentUpdates} />
        <ToggleRow label="Win/loss notifications" description="Receive alerts when your positions are settled" on={winLossNotifications} onChange={setWinLossNotifications} />
      </Section>

      <Section title="Security & privacy">
        <ToggleRow label="Two-factor authentication" description="Add an extra layer of security to your account" on={twoFactorAuth} onChange={setTwoFactorAuth} />
        <ToggleRow label="Public profile" description="Allow others to view your trading history" on={publicProfile} onChange={setPublicProfile} />
        <ToggleRow label="Show statistics" description="Display your win rate and stats on your profile" on={showStats} onChange={setShowStats} />
        <Row label="Password" description="Change the password you use to sign in">
          <button className={btnSecondary}>Change password</button>
        </Row>
      </Section>

      <Section title="Trading preferences">
        <ToggleRow label="Auto-renew positions" description="Automatically place similar trades in recurring markets" on={autoRenewBets} onChange={setAutoRenewBets} />
        <ToggleRow label="Trade confirmation" description="Require confirmation before placing trades" on={betConfirmation} onChange={setBetConfirmation} />
        <div className="py-4">
          <label htmlFor="daily-limit" className="block text-[13px] text-tx2 font-medium mb-[7px]">Daily trading limit</label>
          <select id="daily-limit" className={`${inputCls} cursor-pointer sm:max-w-xs`}>
            <option>No limit</option>
            <option>5,000 PZC / day</option>
            <option>10,000 PZC / day</option>
            <option>25,000 PZC / day</option>
            <option>50,000 PZC / day</option>
          </select>
        </div>
      </Section>

      <Section title="Danger zone" danger>
        <Row label="Deactivate account" description="Temporarily disable your account">
          <button className={btnSecondary}>Deactivate</button>
        </Row>
        <Row label="Delete account" description="Permanently delete your account and all data">
          <button className={btnDanger}>Delete</button>
        </Row>
      </Section>
    </Page>
  );
}
