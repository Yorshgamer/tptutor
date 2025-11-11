import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { token, loading, refreshMe } = useAuth();
  const loc = useLocation();

  useEffect(() => {
    if (token) refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) return <div className="p-4">Cargando…</div>;
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}
