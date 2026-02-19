
export function HpBar(props: { label: string; hp: number; maxHp: number }) {
  const hp = Math.max(0, props.hp);
  const maxHp = Math.max(1, props.maxHp);
  const pct = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-zinc-400">{props.label}</div>
          <div className="truncate text-lg font-semibold">
            {hp} / {maxHp} HP
          </div>
        </div>
        <div className="text-xs text-zinc-500">{pct}%</div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}