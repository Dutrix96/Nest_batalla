import { env } from "./env";

type HttpOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  body?: any;
};

export async function http<T>(path: string, opts?: HttpOptions): Promise<T> {
  const method = opts?.method ?? "GET";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (opts?.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  // algunos endpoints pueden devolver 204
  if (res.status === 204) return undefined as unknown as T;

  return (await res.json()) as T;
}
