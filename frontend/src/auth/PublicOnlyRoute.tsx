import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="p-4">Cargando…</div>;
  if (token) return <Navigate to="/tutor" replace />;
  return <>{children}</>;
}
