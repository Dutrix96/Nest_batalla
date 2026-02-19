import React, { createContext, useContext, useMemo, useState } from "react";
import type { User } from "../api/types";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  clear: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

const LS_TOKEN = "bf_token";
const LS_USER = "bf_user";
const storage = window.sessionStorage;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => storage.getItem(LS_TOKEN));
  const [user, setUser] = useState<User | null>(() => {
    const raw = storage.getItem(LS_USER);
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      setSession: (t, u) => {
        setToken(t);
        setUser(u);
        storage.setItem(LS_TOKEN, t);
        storage.setItem(LS_USER, JSON.stringify(u));
      },
      clear: () => {
        setToken(null);
        setUser(null);
        storage.removeItem(LS_TOKEN);
        storage.removeItem(LS_USER);
      },
    }),
    [token, user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("AuthProvider faltante");
  return ctx;
}