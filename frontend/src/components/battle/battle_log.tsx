import type { BattleAttackEvent } from "../../api/types";

export function BattleLog(props: { items: BattleAttackEvent[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-2 text-sm text-zinc-400">Registro</div>

      <div className="max-h-72 overflow-auto space-y-2 pr-1">
        {props.items.length === 0 ? (
          <div className="text-sm text-zinc-500">Sin acciones aun.</div>
        ) : null}

        {props.items.map((ev, idx) => (
          <div
            key={`${ev.battleId}-${idx}-${ev.damage}-${ev.targetHp}`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm"
          >
            <div className="text-zinc-200">
              <span className="font-semibold">{ev.attackerSide}</span> golpea a{" "}
              <span className="font-semibold">{ev.targetSide}</span>{" "}
              {ev.special ? (
                <span className="ml-2 rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs text-fuchsia-200">
                  ESPECIAL
                </span>
              ) : null}
            </div>
            <div className="text-zinc-400">
              Dano: <span className="text-zinc-200">{ev.damage}</span> · HP objetivo:{" "}
              <span className="text-zinc-200">{ev.targetHp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}