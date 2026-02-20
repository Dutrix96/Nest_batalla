import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiMe } from "../api/auth_api";
import type { User } from "../api/types";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const u = await apiMe();
        if (!alive) return;
        setMe(u);
      } catch {
        if (!alive) return;
        setMe(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>cargando...</div>;

  // si no hay token valido, ProtectedRoute ya deberia echarte, pero por si acaso:
  if (!me) return <Navigate to="/" replace />;

  if (me.role !== "ADMIN") return <Navigate to="/app" replace />;

  return <>{children}</>;
}