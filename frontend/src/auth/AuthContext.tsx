// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; name: string; email: string; role: string } | null;

type AuthState = {
  user: User;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: NonNullable<User>) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
    setLoading(false);
  }, []);

  const login = (t: string, u: NonNullable<User>) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("invalid");
      const payload = await res.json();
      const u = payload?.data;
      if (u) {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch {
      logout();
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthCtx.Provider value={{ user, token, loading, isAuthenticated, login, logout, refreshMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
