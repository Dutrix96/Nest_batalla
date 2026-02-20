import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { apiRanking } from "../api/users_api";
import { apiMe } from "../api/auth_api";
import type { User } from "../api/types";

export function DashboardPage() {
  const nav = useNavigate();
  const { token, user, clear, setSession } = useAuth();

  const [ranking, setRanking] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState<string | null>(null);

  const xpPct = useMemo(() => {
    const xp = user?.xp ?? 0;
    return Math.max(0, Math.min(100, Math.round((xp / 100) * 100)));
  }, [user]);

  useEffect(() => {
    if (!token) return;

    const currentRole = (user?.role ?? "").toUpperCase();
    if (currentRole === "ADMIN") {
      nav("/app/admin", { replace: true });
      return;
    }

    (async () => {
      setLoading(true);
      setWarn(null);

      try {
        const me = await apiMe(token);
        setSession(token, me);

        const meRole = (me.role ?? "").toUpperCase();
        if (meRole === "ADMIN") {
          nav("/app/admin", { replace: true });
          return;
        }
      } catch {
        // si falla /auth/me, te quedas con lo que habia
      }

      try {
        const list = await apiRanking();
        setRanking(list);
      } catch {
        setWarn("No hay endpoint de ranking para USER. Anade GET /users/ranking y quedara perfecto.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user?.role]);

  if (!user) return null;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-2xl font-semibold">Dashboard</div>
            <div className="text-sm text-zinc-400">Bienvenido, {user.email}</div>
          </div>

          <button
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
            onClick={() => {
              clear();
              nav("/", { replace: true });
            }}
          >
            Salir
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400">Tu progreso</div>

            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold">Nivel {user.level}</div>
                <div className="text-sm text-zinc-400">XP: {user.xp}/100</div>
              </div>
              <div className="text-sm text-zinc-400">
                {user.wins}W / {user.losses}L
              </div>
            </div>

            <div className="mt-4 h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${xpPct}%` }} />
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              Ganas +20 XP por victoria/ +10 XP por derrota.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-400">Acciones</div>
                <div className="text-xl font-semibold">A luchar</div>
              </div>
              <div className="text-xs text-zinc-500">PVE o PVP con socket.io</div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-indigo-500/20 to-zinc-900 px-4 py-4 text-left hover:border-zinc-600"
                onClick={() => nav("/app/pve")}
              >
                <div className="text-lg font-semibold">Combate vs IA</div>
                <div className="text-sm text-zinc-400">El turno de la maquina es automatico.</div>
              </button>

              <button
                className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-fuchsia-500/20 to-zinc-900 px-4 py-4 text-left hover:border-zinc-600"
                onClick={() => nav("/app/pvp")}
              >
                <div className="text-lg font-semibold">PVP</div>
                <div className="text-sm text-zinc-400">Entras a una batalla y pegas por turnos.</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-zinc-400">Ranking</div>
              <div className="text-xl font-semibold">Usuarios por experiencia</div>
            </div>
            {loading ? <div className="text-xs text-zinc-500">Cargando...</div> : null}
          </div>

          {warn ? (
            <div className="mb-3 rounded-xl border border-yellow-900/40 bg-yellow-950/30 px-3 py-2 text-sm text-yellow-200">
              {warn}
            </div>
          ) : null}

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-950 text-zinc-300">                
                <tr className="border-b border-zinc-800">
                <th className="py-2 px-3 text-left font-semibold text-zinc-300">id</th>
                <th className="py-2 px-3 text-left font-semibold text-zinc-300">email</th>
                <th className="py-2 px-3 text-left font-semibold text-zinc-300">lvl</th>
                <th className="py-2 px-3 text-left font-semibold text-zinc-300">xp</th>
                <th className="py-2 px-3 text-left font-semibold text-zinc-300">wins/losses</th>
              </tr>
              </thead>
              <tbody>
                {ranking.map((u, i) => (
                  <tr key={u.id} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                    <td className="py-2 pr-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3">{u.email}</td>
                    <td className="py-2 px-3">{u.level}</td>
                    <td className="py-2 px-3">{u.xp}</td>
                    <td className="py-2 px-3">
                      {u.wins}/{u.losses}
                    </td>
                  </tr>
                ))}

                {!ranking.length ? (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={5}>
                      Sin datos de ranking.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}