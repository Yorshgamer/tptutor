// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, loginUser, registerUser } from '../api/auth';

// Helper para leer expiración del JWT sin libs
function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  } catch {
    return true;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('idle'); // idle | loading | authenticated | unauthenticated
  const [user, setUser] = useState(null);

  // Cargar sesión al inicio
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isExpired(token)) {
      localStorage.removeItem('token');
      setStatus('unauthenticated');
      return;
    }
    setStatus('loading');
    fetchMe()
      .then((u) => {
        setUser(u);
        setStatus('authenticated');
      })
      .catch(() => {
        localStorage.removeItem('token');
        setStatus('unauthenticated');
      });
  }, []);

  async function login({ email, password }) {
    setStatus('loading');
    const { token, user: u } = await loginUser({ email, password });
    localStorage.setItem('token', token);
    setUser(u);
    setStatus('authenticated');
  }

  async function register({ name, email, password }) {
    setStatus('loading');
    const { token, user: u } = await registerUser({ name, email, password });
    localStorage.setItem('token', token);
    setUser(u);
    setStatus('authenticated');
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setStatus('unauthenticated');
  }

  const value = useMemo(
    () => ({ status, user, login, register, logout, isLogged: status === 'authenticated' }),
    [status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}