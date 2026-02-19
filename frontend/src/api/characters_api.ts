import { http } from "../lib/http";
import type { Character } from "./types";

export function apiCharacters(token: string) {
  return http<Character[]>("/characters", {
    method: "GET",
    token,
  });
}