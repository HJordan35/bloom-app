import { createContext, type ReactNode, useContext, useState } from "react";
import { supabase } from "./supabase";
import type { Bro } from "./types";

const STORAGE_KEY = "bloom.bro";

type Auth = {
  bro: Bro | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<Auth | null>(null);

function loadBro(): Bro | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Bro) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bro, setBro] = useState<Bro | null>(loadBro);

  async function login(email: string, password: string) {
    const { data } = await supabase
      .rpc("login", { p_email: email.trim(), p_password: password })
      .maybeSingle<Bro>();
    if (!data) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setBro(data);
    return true;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setBro(null);
  }

  return <AuthContext value={{ bro, login, logout }}>{children}</AuthContext>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider");
  return auth;
}

/** The logged-in bro. Only call inside the auth-gated app. */
export function useCurrentBro() {
  return useAuth().bro as Bro;
}
