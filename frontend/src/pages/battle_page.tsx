import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { apiBattle, apiAttack } from "../api/battles_api";
import { createBattleSocket } from "../api/socket";
import type { BattleAttackEvent, BattleState } from "../api/types";
import { HpBar } from "../components/battle/hp_bar";
import { BattleLog } from "../components/battle/battle_log";

function numId(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export function BattlePage() {
  const nav = useNavigate();
  const { id } = useParams();
  const battleId = numId(id);

  const { token, user } = useAuth();

  const [state, setState] = useState<BattleState | null>(null);
  const [log, setLog] = useState<BattleAttackEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<ReturnType<typeof createBattleSocket> | null>(null);

  const mySide = useMemo<"INITIATOR" | "OPPONENT" | null>(() => {
    if (!user || !state) return null;
    if (state.initiator?.userId === user.id) return "INITIATOR";
    if (state.opponent?.userId === user.id) return "OPPONENT";
    // PVE: opponent.userId suele ser null, asi que eres initiator si coincide
    return null;
  }, [user, state]);

  const myTurn = useMemo(() => {
    if (!state || !mySide) return false;
    return state.status === "ACTIVE" && state.currentTurnSide === mySide;
  }, [state, mySide]);

  const mySpecialUsed = useMemo(() => {
    if (!state || !mySide) return true;
    if (mySide === "INITIATOR") return !!state.initiator?.specialUsed;
    return !!state.opponent?.specialUsed;
  }, [state, mySide]);

  useEffect(() => {
    (async () => {
      if (!token || !battleId) return;
      setErr(null);

      try {
        const res = await apiBattle(token, battleId);
        const s = (res?.battle ?? res) as BattleState;
        setState(s);
      } catch (e: any) {
        setErr(e?.message || "No pude cargar la batalla");
      }
    })();
  }, [token, battleId]);

  useEffect(() => {
    if (!token || !battleId) return;

    const sock = createBattleSocket(token);
    socketRef.current = sock;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);

    sock.on("battle:state", (s) => {
      setState(s);
    });

    sock.on("battle:attack", (ev) => {
      setLog((prev) => [ev, ...prev].slice(0, 40));
    });

    sock.on("battle:finished", (p) => {
      // opcional: puedes mostrar toast, aqui con banner simple
      setErr(`Batalla terminada. WinnerSide: ${p.winnerSide ?? "?"}`);
    });

    sock.on("battle:error", (p) => {
      setErr(p.message || "Error socket");
    });

    // join
    sock.emit("battle:join", { battleId });

    return () => {
      try {
        sock.off("connect", onConnect);
        sock.off("disconnect", onDisconnect);
        sock.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [token, battleId]);

  async function atacar(special: boolean) {
    if (!token || !battleId) return;
    if (!myTurn) return;

    setErr(null);

    // intento realtime
    const sock = socketRef.current;
    if (sock && sock.connected) {
      sock.emit("battle:attack", { battleId, special: !!special });
      return;
    }

    // fallback REST
    try {
      await apiAttack(token, battleId, !!special);
      // luego refresco estado
      const res = await apiBattle(token, battleId);
      const s = (res?.battle ?? res) as BattleState;
      setState(s);
    } catch (e: any) {
      setErr(e?.message || "No se pudo atacar");
    }
  }

  if (!battleId) {
    return (
      <div className="min-h-full flex items-center justify-center text-zinc-300">
        Id de batalla invalido.
      </div>
    );
  }

  const initiator = state?.initiator?.character;
  const opponent = state?.opponent?.character;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">
              Batalla #{battleId}{" "}
              <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                {connected ? "socket ok" : "socket off"}
              </span>
            </div>
            <div className="text-sm text-zinc-400">
              {state?.mode ?? "?"} · Estado: {state?.status ?? "?"} · Turno: {state?.currentTurnSide ?? "?"}
            </div>
          </div>

          <button
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
            onClick={() => nav("/app")}
          >
            Salir a dashboard
          </button>
        </div>

        {err ? (
          <div className="mb-4 rounded-xl border border-yellow-900/40 bg-yellow-950/30 px-3 py-2 text-sm text-yellow-200">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HpBar
                label={`INITIATOR · ${initiator?.name ?? "?"}`}
                hp={initiator?.hp ?? 0}
                maxHp={initiator?.maxHp ?? 1}
              />
              <HpBar
                label={`OPPONENT · ${opponent?.name ?? "?"}`}
                hp={opponent?.hp ?? 0}
                maxHp={opponent?.maxHp ?? 1}
              />
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-zinc-400">Acciones</div>
                  <div className="text-lg font-semibold">
                    {mySide ? `Tu lado: ${mySide}` : "No eres participante (o falta userId en battle)"}
                  </div>
                </div>
                <div className="text-xs text-zinc-500">
                  {state?.status === "ACTIVE"
                    ? myTurn
                      ? "Tu turno"
                      : "Esperando"
                    : "Finalizada"}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  className="rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-3 font-semibold disabled:opacity-50"
                  onClick={() => atacar(false)}
                  disabled={!myTurn || !mySide || state?.status !== "ACTIVE"}
                >
                  Atacar
                </button>

                <button
                  className="rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white px-4 py-3 font-semibold disabled:opacity-50"
                  onClick={() => atacar(true)}
                  disabled={!myTurn || !mySide || state?.status !== "ACTIVE" || mySpecialUsed}
                  title={mySpecialUsed ? "Ya usaste el especial" : "Especial"}
                >
                  {mySpecialUsed ? "Especial usado" : "Especial"}
                </button>
              </div>

              <div className="mt-3 text-xs text-zinc-500">
                El especial se bloquea si tu backend marca specialUsed=true para tu lado.
              </div>
            </div>
          </div>

          <div>
            <BattleLog items={log} />
          </div>
        </div>
      </div>
    </div>
  );
}