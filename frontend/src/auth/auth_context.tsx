import React, { createContext, useContext, useMemo, useState } from "react";
import type { User } from "../api/types";
import { getToken, getUserRaw, setToken, setUserRaw, clearAllAuth } from "../lib/storage";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  clear: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUserState] = useState<User | null>(() => {
    const raw = getUserRaw();
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      setSession: (t, u) => {
        setTokenState(t);
        setUserState(u);
        setToken(t);
        setUserRaw(JSON.stringify(u));
      },
      clear: () => {
        setTokenState(null);
        setUserState(null);
        clearAllAuth();
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