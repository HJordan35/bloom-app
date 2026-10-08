import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { Bro } from "../api/bros/bros.types";
import { queryClient } from "../api/queryClient";
import { disablePush } from "./push";
import { supabase } from "./supabase";

type Auth = {
  bro: Bro | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

async function fetchBroForUser(authId: string) {
  const { data } = await supabase
    .from("bros")
    .select("id, first_name, last_name, email")
    .eq("auth_id", authId)
    .maybeSingle<Bro>();
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bro, setBro] = useState<Bro | null>(null);
  const [ready, setReady] = useState(false);

  // Restores the session on load and follows sign-in / sign-out
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      // Supabase advises against awaiting its own calls inside this callback
      setTimeout(async () => {
        setBro(session ? await fetchBroForUser(session.user.id) : null);
        setReady(true);
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return false;
    // An auth user without a bros row can't use the app
    if (!(await fetchBroForUser(data.user.id))) {
      await supabase.auth.signOut();
      return false;
    }
    return true;
  }

  async function logout() {
    // Forget this device's notifications while still signed in (RLS needs the session)
    await disablePush();
    // Local: logging out here leaves the bro's other devices signed in
    await supabase.auth.signOut({ scope: "local" });
    // The next bro to sign in on this device starts with an empty cache
    queryClient.clear();
  }

  // Render nothing until the stored session is checked, so login doesn't flash
  if (!ready) return null;
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
