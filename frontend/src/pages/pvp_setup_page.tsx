import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { createBattleSocket } from "../api/socket";
import { apiPvpQueue, apiPvpCancel } from "../api/battles_api";

type UiStatus = "IDLE" | "QUEUED" | "MATCHED";

export function PvpSetupPage() {
  const nav = useNavigate();
  const { token } = useAuth();

  const sockRef = useRef<ReturnType<typeof createBattleSocket> | null>(null);

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<UiStatus>("IDLE");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const sock = createBattleSocket(token);
    sockRef.current = sock;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);

    // solo notificacion: cuando haya match, navegar al lobby
    sock.on("pvp:matched", (p) => {
      setStatus("MATCHED");
      nav(`/app/lobby/${p.battleId}`);
    });

    sock.on("battle:error", (p: any) => {
      setErr(p?.message || "Socket error");
    });

    return () => {
      try {
        sock.off("connect", onConnect);
        sock.off("disconnect", onDisconnect);
        sock.disconnect();
      } catch {}
      sockRef.current = null;
    };
  }, [token, nav]);

  // seguridad: si sales de la pagina estando en cola, cancelamos
  useEffect(() => {
    return () => {
      if (!token) return;
      if (status !== "QUEUED") return;

      apiPvpCancel(token).catch(() => {});
    };
  }, [token, status]);

  async function ponerseEnLinea() {
    if (!token) {
      setErr("No hay token. Inicia sesion.");
      return;
    }
    if (!connected) {
      setErr("Socket off. Espera a conectar.");
      return;
    }

    setErr(null);

    try {
      const res: any = await apiPvpQueue(token);

      // si el backend responde matched, navega directo
      if (res?.status === "MATCHED" && res?.battleId) {
        setStatus("MATCHED");
        nav(`/app/lobby/${res.battleId}`);
        return;
      }

      // si no, quedas en cola y esperas pvp:matched por ws
      setStatus("QUEUED");
    } catch (e: any) {
      setErr(e?.message || "No se pudo poner en linea");
    }
  }

  async function cancelar() {
    if (!token) return;

    setErr(null);

    try {
      await apiPvpCancel(token);
      setStatus("IDLE");
    } catch (e: any) {
      setErr(e?.message || "No se pudo cancelar");
    }
  }

  const canQueue = !!token && connected && status !== "QUEUED" && status !== "MATCHED";
  const canCancel = !!token && status === "QUEUED";

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">
              PVP{" "}
              <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                {connected ? "socket ok" : "socket off"}
              </span>
            </div>
            <div className="text-sm text-zinc-400">
              Ponte en linea. Cuando otro jugador se ponga en linea, se crea la sala y entrais ambos. El personaje se elige dentro del lobby.
            </div>
          </div>

          <button
            type="button"
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
            onClick={() => nav("/app")}
          >
            Volver
          </button>
        </div>

        {err ? (
          <div className="mb-4 rounded-xl border border-yellow-900/40 bg-yellow-950/30 px-3 py-2 text-sm text-yellow-200">
            {err}
          </div>
        ) : null}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="text-sm text-zinc-400">Estado</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-200">
            {status === "IDLE" ? "Sin buscar" : status === "QUEUED" ? "Buscando rival..." : "Emparejado"}
          </div>
          <div className="mt-2 text-sm text-zinc-500">
            Si se cae el socket o cierras la pestana, sales de la cola automaticamente.
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            className="w-full rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white px-4 py-4 font-semibold disabled:opacity-50"
            onClick={ponerseEnLinea}
            disabled={!canQueue}
          >
            Ponerse en linea
          </button>

          <button
            type="button"
            className="w-full rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-4 font-semibold disabled:opacity-50"
            onClick={cancelar}
            disabled={!canCancel}
          >
            Cancelar busqueda
          </button>
        </div>
      </div>
    </div>
  );
}