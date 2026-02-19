import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { apiCharacters } from "../api/characters_api";
import { apiCreateBattle } from "../api/battles_api";
import type { Character } from "../api/types";

function battleIdFromResponse(res: any): number | null {
  const id = res?.id ?? res?.battle?.id ?? res?.battleId ?? res?.data?.id;
  return typeof id === "number" ? id : null;
}

export function PveSetupPage() {
  const nav = useNavigate();
  const { token, user } = useAuth();

  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [myCharId, setMyCharId] = useState<number | null>(null);
  const [aiCharId, setAiCharId] = useState<number | null>(null);

  const myOptions = useMemo(() => {
    const lvl = user?.level ?? 1;
    return chars.filter((c) => c.requiredLevel <= lvl);
  }, [chars, user?.level]);

  const aiOptions = useMemo(() => chars, [chars]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      setErr(null);

      try {
        const list = await apiCharacters(token);
        setChars(list);

        // defaults
        const lvl = user?.level ?? 1;
        const firstMine = list.find((c) => c.requiredLevel <= lvl) ?? null;
        const firstAi = list[0] ?? null;
        setMyCharId(firstMine ? firstMine.id : null);
        setAiCharId(firstAi ? firstAi.id : null);
      } catch (e: any) {
        setErr(e?.message || "Error cargando personajes");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function crear() {
    if (!token) return;
    if (!myCharId || !aiCharId) return;

    setErr(null);
    try {
      const res = await apiCreateBattle(token, {
        mode: "PVE",
        initiatorCharacterId: myCharId,
        opponentCharacterId: aiCharId,
      });

      const id = battleIdFromResponse(res);
      if (!id) throw new Error("No pude leer el id de batalla del backend");

      nav(`/app/battle/${id}`);
    } catch (e: any) {
      setErr(e?.message || "No se pudo crear la batalla");
    }
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">Combate vs IA</div>
            <div className="text-sm text-zinc-400">Elige tu personaje y el rival.</div>
          </div>
          <button
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
            onClick={() => nav("/app")}
          >
            Volver
          </button>
        </div>

        {err ? (
          <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400">Tu personaje</div>
            <select
              className="mt-2 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none"
              value={myCharId ?? ""}
              onChange={(e) => setMyCharId(Number(e.target.value))}
              disabled={loading || myOptions.length === 0}
            >
              {myOptions.length === 0 ? (
                <option value="">No tienes personajes para tu nivel</option>
              ) : null}
              {myOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (lvl {c.requiredLevel}) · ATK {c.attack} · HP {c.maxHp}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-zinc-500">
              Solo salen personajes con requiredLevel mor o igual a tu level.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400">Rival (IA)</div>
            <select
              className="mt-2 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none"
              value={aiCharId ?? ""}
              onChange={(e) => setAiCharId(Number(e.target.value))}
              disabled={loading || aiOptions.length === 0}
            >
              {aiOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (lvl {c.requiredLevel}) · ATK {c.attack} · HP {c.maxHp}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-zinc-500">
              En PVE, el opponentUserId es null en backend (IA).
            </div>
          </div>
        </div>

        <button
          className="mt-6 w-full rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-3 font-semibold disabled:opacity-50"
          onClick={crear}
          disabled={loading || !myCharId || !aiCharId}
        >
          Empezar batalla
        </button>
      </div>
    </div>
  );
}