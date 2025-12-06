import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { motion } from "framer-motion";

export default function Settings() {
  const { user } = useAuth();

  // State for different settings
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

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-700/50 last:border-b-0">
      <div className="flex-1 pr-4">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-slate-400 mt-1">{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full p-1 transition-all duration-300 ${
          enabled ? "bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/50" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/20 to-transparent rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 pt-24 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            ⚙️ Settings
          </h1>
          <p className="mt-2 text-slate-400">
            Manage your account preferences and security settings
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Profile Information</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-white">
                    {user?.username || "Guest"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-white">
                    {user?.email || "Not provided"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Member Since</label>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Notification Settings */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
                <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Notifications</h2>
            </div>

            <div className="space-y-2">
              <ToggleSwitch
                enabled={emailNotifications}
                onChange={setEmailNotifications}
                label="Email Notifications"
                description="Receive updates and alerts via email"
              />
              <ToggleSwitch
                enabled={pushNotifications}
                onChange={setPushNotifications}
                label="Push Notifications"
                description="Get real-time browser notifications"
              />
              <ToggleSwitch
                enabled={marketAlerts}
                onChange={setMarketAlerts}
                label="Market Alerts"
                description="Notifications about market changes and closures"
              />
              <ToggleSwitch
                enabled={tournamentUpdates}
                onChange={setTournamentUpdates}
                label="Tournament Updates"
                description="Get notified about tournament events"
              />
              <ToggleSwitch
                enabled={winLossNotifications}
                onChange={setWinLossNotifications}
                label="Win/Loss Notifications"
                description="Receive alerts when your bets are settled"
              />
            </div>
          </motion.section>

          {/* Security Settings */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Security & Privacy</h2>
            </div>

            <div className="space-y-2">
              <ToggleSwitch
                enabled={twoFactorAuth}
                onChange={setTwoFactorAuth}
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
              />
              <ToggleSwitch
                enabled={publicProfile}
                onChange={setPublicProfile}
                label="Public Profile"
                description="Allow others to view your betting history"
              />
              <ToggleSwitch
                enabled={showStats}
                onChange={setShowStats}
                label="Show Statistics"
                description="Display your win rate and stats on your profile"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50">
                🔑 Change Password
              </button>
            </div>
          </motion.section>

          {/* Betting Preferences */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Betting Preferences</h2>
            </div>

            <div className="space-y-2">
              <ToggleSwitch
                enabled={autoRenewBets}
                onChange={setAutoRenewBets}
                label="Auto-Renew Bets"
                description="Automatically place similar bets in recurring markets"
              />
              <ToggleSwitch
                enabled={betConfirmation}
                onChange={setBetConfirmation}
                label="Bet Confirmation"
                description="Require confirmation before placing bets"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Daily Betting Limit</label>
                <select className="w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none">
                  <option>No Limit</option>
                  <option>$50 / day</option>
                  <option>$100 / day</option>
                  <option>$250 / day</option>
                  <option>$500 / day</option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* Danger Zone */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 to-red-900/20 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Danger Zone</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <div>
                  <div className="text-sm font-semibold text-white">Deactivate Account</div>
                  <div className="text-xs text-slate-400 mt-1">Temporarily disable your account</div>
                </div>
                <button className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors">
                  Deactivate
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-900/20 border border-red-500/30">
                <div>
                  <div className="text-sm font-semibold text-red-300">Delete Account</div>
                  <div className="text-xs text-red-400 mt-1">Permanently delete your account and all data</div>
                </div>
                <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative mt-20 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm py-8"
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2025 Pryzm. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}
