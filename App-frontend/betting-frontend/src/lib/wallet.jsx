import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { getJSON } from "./markets.js";

const WalletCtx = createContext(null);

export const userIdOf = (user) => user?.userId ?? user?.id ?? null;

/** Shares the signed-in user's wallet (balance in PZC == balanceCents) across the app. */
export function WalletProvider({ children }) {
  const { user } = useAuth();
  const userId = userIdOf(user);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setWallet(null); return null; }
    setLoading(true);
    try {
      const w = await getJSON(`/api/v1/users/${userId}/wallet`);
      setWallet(w);
      return w;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const balance = wallet ? Number(wallet.balanceCents) || 0 : null;

  return (
    <WalletCtx.Provider value={{ wallet, balance, loading, refresh }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
