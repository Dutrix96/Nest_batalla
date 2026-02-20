import { http } from "../lib/http";
import type { AuthResponse, User } from "./types";

export function apiRegister(email: string, password: string) {
  return http<AuthResponse>("/auth/register", { method: "POST", body: { email, password } });
}

export function apiLogin(email: string, password: string) {
  return http<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });
}

export function apiMe(token?: string) {
  return http<User>("/auth/me", { method: "GET", token });
}