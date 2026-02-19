import { http } from "../lib/http";
import type { User } from "./types";

export function apiRanking(token: string) {
  return http<User[]>("/users/ranking", { token });
}