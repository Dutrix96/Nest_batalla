import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { apiCharacters } from "../api/characters_api";
import { apiSelectCharacter } from "../api/battles_api";
import { createBattleSocket } from "../api/socket";
import type { Character } from "../api/types";

type LobbyState = {
  id: number;
  mode: "PVP" | "PVE";
  status: "LOBBY" | "ACTIVE" | "FINISHED";
  initiatorUserId: number;
  opponentUserId: number | null;
  initiatorPicked: boolean;
  opponentPicked: boolean;
  initiatorCharacter: { id: number; name: string } | null;
  opponentCharacter: { id: number; name: string } | null;
};

function numId(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export function LobbyPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const battleId = numId(id);

  const { token, user } = useAuth();
  const sockRef = useRef<any>(null);

  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [chars, setChars] = useState<Character[]>([]);
  const [myPick, setMyPick] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const myOptions = useMemo(() => {
    const lvl = user?.level ?? 1;
    return chars.filter((c) => c.requiredLevel <= lvl);
  }, [chars, user?.level]);

  useEffect(() => {
    (async () => {
      if (!token) return;

      const list = await apiCharacters(token);
      setChars(list);

      const lvl = user?.level ?? 1;
      const first = list.find((c) => c.requiredLevel <= lvl) ?? null;
      setMyPick(first ? first.id : null);
    })().catch((e) => setErr(e?.message || "Error cargando personajes"));
  }, [token]);

  useEffect(() => {
    if (!token || !battleId) return;

    const sock = createBattleSocket(token);
    sockRef.current = sock;

    sock.on("connect", () => setConnected(true));
    sock.on("disconnect", () => setConnected(false));

    sock.on("battle:lobby_state", (s: LobbyState) => {
      setLobby(s);
      if (s.status === "ACTIVE") nav(`/app/battle/${battleId}`);
    });

    sock.on("battle:state", (s: any) => {
      if (s?.status === "ACTIVE") nav(`/app/battle/${battleId}`);
    });

    sock.on("battle:error", (p: any) => setErr(p?.message || "Socket error"));

    sock.emit("battle:join", { battleId });

    return () => {
      try {
        sock.disconnect();
      } catch {}
      sockRef.current = null;
    };
  }, [token, battleId]);

  async function confirmar() {
    if (!token || !battleId || !myPick) return;
    setErr(null);

    try {
      // input por endpoint
      await apiSelectCharacter(token, battleId, myPick);
      // no hace falta refrescar: el backend debe emitir battle:lobby_state / battle:state por ws
    } catch (e: any) {
      setErr(e?.message || "No se pudo confirmar personaje");
    }
  }

  if (!battleId) return <div className="min-h-full flex items-center justify-center">Battle id invalido</div>;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">
              Lobby #{battleId}{" "}
              <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                {connected ? "socket ok" : "socket off"}
              </span>
            </div>
            <div className="text-sm text-zinc-400">
              Entra el rival y elegid personaje. Cuando ambos confirmen, empieza la batalla.
            </div>
          </div>
          <button className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm" onClick={() => nav("/app")}>
            Salir
          </button>
        </div>

        {err ? (
          <div className="mb-4 rounded-xl border border-yellow-900/40 bg-yellow-950/30 px-3 py-2 text-sm text-yellow-200">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400">Tu personaje</div>
            <select
              className="mt-2 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none"
              value={myPick ?? ""}
              onChange={(e) => setMyPick(Number(e.target.value))}
              disabled={!myOptions.length}
            >
              {myOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (lvl {c.requiredLevel}) · ATK {c.attack} · HP {c.maxHp}
                </option>
              ))}
            </select>

            <button
              className="mt-4 w-full rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-3 font-semibold disabled:opacity-50"
              onClick={confirmar}
              disabled={!myPick}
            >
              Confirmar personaje
            </button>

            <div className="mt-3 text-xs text-zinc-500">
              Nota: el estado se actualiza por ws (battle:lobby_state) cuando el backend procesa el endpoint.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400">Estado lobby</div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Initiator</span>
                <span className="text-zinc-200">
                  {lobby?.initiatorPicked ? `Listo (${lobby.initiatorCharacter?.name ?? "?"})` : "No listo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Opponent</span>
                <span className="text-zinc-200">
                  {lobby?.opponentPicked ? `Listo (${lobby.opponentCharacter?.name ?? "?"})` : "Esperando..."}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              Cuando ambos esten listos, el backend pasa la battle a ACTIVE y os manda a /battle/{battleId}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}