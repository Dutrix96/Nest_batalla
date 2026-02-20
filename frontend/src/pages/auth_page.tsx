import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiRegister } from "../api/auth_api";
import { useAuth } from "../auth/auth_context";

export function AuthPage() {
  const nav = useNavigate();
  const { setSession, token, user } = useAuth();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const role = (user?.role ?? "").toUpperCase();
    if (role === "ADMIN") nav("/app/admin", { replace: true });
    else nav("/app", { replace: true });
  }, [token, user?.role]);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res =
        tab === "login" ? await apiLogin(email, password) : await apiRegister(email, password);

      setSession(res.token, res.user);

      const role = (res.user.role ?? "").toUpperCase();
      if (role === "ADMIN") nav("/app/admin", { replace: true });
      else nav("/app", { replace: true });
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="mb-6">
          <div className="text-2xl font-semibold">Batalla Friki</div>
          <div className="text-sm text-zinc-400">Login y registro en la pagina principal</div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            className={`rounded-xl px-3 py-2 text-sm ${
              tab === "login" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 text-zinc-200"
            }`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            className={`rounded-xl px-3 py-2 text-sm ${
              tab === "register" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 text-zinc-200"
            }`}
            onClick={() => setTab("register")}
          >
            Registro
          </button>
        </div>

        <label className="block text-xs text-zinc-400 mb-1">Email</label>
        <input
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 mb-3 outline-none focus:border-zinc-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />

        <label className="block text-xs text-zinc-400 mb-1">Password</label>
        <input
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 mb-4 outline-none focus:border-zinc-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="min 6"
          type="password"
        />

        {error ? (
          <div className="mb-3 rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button
          className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 font-medium disabled:opacity-50"
          onClick={submit}
          disabled={loading || !email || password.length < 6}
        >
          {loading ? "Cargando..." : tab === "login" ? "Entrar" : "Crear cuenta"}
        </button>

        <div className="mt-4 text-xs text-zinc-500">
          Tip: tu backend devuelve user + token, asi que el front arranca rapido.
        </div>
      </div>
    </div>
  );
}