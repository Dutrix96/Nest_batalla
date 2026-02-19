import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { createBattleSocket } from "../api/socket";

export function PvpSetupPage() {
  const nav = useNavigate();
  const { token } = useAuth();

  const sockRef = useRef<any>(null);

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<"idle" | "queue">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const sock = createBattleSocket(token);
    sockRef.current = sock;

    sock.on("connect", () => setConnected(true));
    sock.on("disconnect", () => {
      setConnected(false);
      setStatus("idle");
    });

    sock.on("pvp:queued", () => {
      setErr(null);
      setStatus("queue");
    });

    sock.on("pvp:canceled", () => {
      setErr(null);
      setStatus("idle");
    });

    sock.on("pvp:matched", (p: any) => {
      const battleId = Number(p?.battleId);
      if (!battleId) return;
      setErr(null);
      setStatus("idle");
      nav(`/app/lobby/${battleId}`);
    });

    sock.on("battle:error", (p: any) => {
      setErr(p?.message || "Socket error");
      setStatus("idle");
    });

    return () => {
      try {
        sock.disconnect();
      } catch {}
      sockRef.current = null;
    };
  }, [token]);

  function ponerseEnLinea() {
    if (!connected) return;
    setErr(null);
    sockRef.current?.emit("pvp:queue");
  }

  function cancelar() {
    if (!connected) return;
    setErr(null);
    sockRef.current?.emit("pvp:cancel");
  }

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
              Ponte en linea. Cuando otro jugador se ponga en linea, se crea la sala y entrais ambos. El personaje se elige
              dentro del lobby.
            </div>
          </div>
          <button
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
          <div className="mt-2 text-lg">
            {status === "idle" ? (
              <span className="text-zinc-200">Sin buscar</span>
            ) : (
              <span className="text-fuchsia-200">Buscando rival...</span>
            )}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Si se cae el socket o cierras la pestaña, sales de la cola automaticamente.
          </div>
        </div>

        {status === "idle" ? (
          <button
            className="mt-6 w-full rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-3 font-semibold disabled:opacity-50"
            onClick={ponerseEnLinea}
            disabled={!connected}
          >
            Ponerse en linea
          </button>
        ) : (
          <button
            className="mt-6 w-full rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 font-semibold disabled:opacity-50"
            onClick={cancelar}
            disabled={!connected}
          >
            Cancelar busqueda
          </button>
        )}
      </div>
    </div>
  );
}