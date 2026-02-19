import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { apiCharacters } from "../api/characters_api";
import { apiCreateBattle } from "../api/battles_api";
import { apiRanking } from "../api/users_api";
import type { Character, User } from "../api/types";

function battleIdFromResponse(res: any): number | null {
  const id = res?.id ?? res?.battle?.id ?? res?.battleId ?? res?.data?.id;
  return typeof id === "number" ? id : null;
}

export function PvpSetupPage() {
  const nav = useNavigate();
  const { token, user } = useAuth();

  const [chars, setChars] = useState<Character[]>([]);
  const [ranking, setRanking] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [myCharId, setMyCharId] = useState<number | null>(null);
  const [oppUserId, setOppUserId] = useState<number | null>(null);
  const [oppCharId, setOppCharId] = useState<number | null>(null);

  const myOptions = useMemo(() => {
    const lvl = user?.level ?? 1;
    return chars.filter((c) => c.requiredLevel <= lvl);
  }, [chars, user?.level]);

  const oppUsers = useMemo(() => {
    const meId = user?.id ?? -1;
    return ranking.filter((u) => u.id !== meId);
  }, [ranking, user?.id]);

  const oppCharOptions = useMemo(() => {
    const opp = ranking.find((u) => u.id === oppUserId);
    const lvl = opp?.level ?? 1;
    return chars.filter((c) => c.requiredLevel <= lvl);
  }, [chars, ranking, oppUserId]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      setErr(null);

      try {
        const [cList, uList] = await Promise.all([apiCharacters(token), apiRanking(token)]);
        setChars(cList);
        setRanking(uList);

        // defaults
        const lvl = user?.level ?? 1;
        const firstMine = cList.find((c) => c.requiredLevel <= lvl) ?? null;
        setMyCharId(firstMine ? firstMine.id : null);

        const firstOpp = uList.find((u) => u.id !== (user?.id ?? -1)) ?? null;
        setOppUserId(firstOpp ? firstOpp.id : null);

        if (firstOpp) {
          const oppLvl = firstOpp.level;
          const firstOppChar = cList.find((c) => c.requiredLevel <= oppLvl) ?? null;
          setOppCharId(firstOppChar ? firstOppChar.id : null);
        } else {
          setOppCharId(null);
        }
      } catch (e: any) {
        setErr(e?.message || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    // si cambio rival, ajusto personaje rival a uno valido para su level
    const opp = ranking.find((u) => u.id === oppUserId);
    if (!opp) {
      setOppCharId(null);
      return;
    }
    const valid = chars.filter((c) => c.requiredLevel <= opp.level);
    if (!valid.length) {
      setOppCharId(null);
      return;
    }
    if (!oppCharId || !valid.some((c) => c.id === oppCharId)) {
      setOppCharId(valid[0].id);
    }
  }, [oppUserId, ranking, chars]);

  async function crear() {
    if (!token) return;
    if (!myCharId || !oppUserId || !oppCharId) return;

    setErr(null);
    try {
      const res = await apiCreateBattle(token, {
        mode: "PVP",
        initiatorCharacterId: myCharId,
        opponentUserId: oppUserId,
        opponentCharacterId: oppCharId,
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
            <div className="text-2xl font-semibold">PVP</div>
            <div className="text-sm text-zinc-400">Elige rival y personajes.</div>
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
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400">Rival</div>
            <select
              className="mt-2 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none"
              value={oppUserId ?? ""}
              onChange={(e) => setOppUserId(Number(e.target.value))}
              disabled={loading || oppUsers.length === 0}
            >
              {oppUsers.length === 0 ? (
                <option value="">No hay otros usuarios en ranking</option>
              ) : null}
              {oppUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} · lvl {u.level} · xp {u.xp} · {u.wins}/{u.losses}
                </option>
              ))}
            </select>

            <div className="mt-3 text-sm text-zinc-400">Personaje del rival</div>
            <select
              className="mt-2 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none"
              value={oppCharId ?? ""}
              onChange={(e) => setOppCharId(Number(e.target.value))}
              disabled={loading || !oppUserId || oppCharOptions.length === 0}
            >
              {oppCharOptions.length === 0 ? (
                <option value="">Sin personajes validos para su nivel</option>
              ) : null}
              {oppCharOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (lvl {c.requiredLevel}) · ATK {c.attack} · HP {c.maxHp}
                </option>
              ))}
            </select>

            <div className="mt-2 text-xs text-zinc-500">
              El rival solo puede usar personajes con requiredLevel menor o igual a su level.
            </div>
          </div>
        </div>

        <button
          className="mt-6 w-full rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white px-4 py-3 font-semibold disabled:opacity-50"
          onClick={crear}
          disabled={loading || !myCharId || !oppUserId || !oppCharId}
        >
          Crear batalla PVP
        </button>
      </div>
    </div>
  );
}