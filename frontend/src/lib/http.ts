import { env } from "./env";
import { getToken } from "./storage";

type HttpOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: any;
};

export async function http<T>(path: string, opts?: HttpOptions): Promise<T> {
  const method = opts?.method ?? "GET";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = opts?.token ?? getToken() ?? undefined;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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