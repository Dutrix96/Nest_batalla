import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-2xl font-semibold">404</div>
        <div className="mt-2 text-sm text-zinc-400">Ruta no encontrada.</div>
        <Link
          to="/"
          className="mt-4 inline-block rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}