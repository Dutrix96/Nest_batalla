import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth_context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}