import { http } from "../lib/http";
import type { Character } from "./types";

export type CreateCharacterDto = {
  name: string;
  maxHp: number;
  attack: number;
  requiredLevel: number;
};

export type UpdateCharacterDto = Partial<CreateCharacterDto>;

export function apiCharacters() {
  return http<Character[]>("/characters", { method: "GET" });
}

export function apiCharacter(id: number) {
  return http<Character>(`/characters/${id}`, { method: "GET" });
}

export function apiCharactersCreate(dto: CreateCharacterDto) {
  return http<Character>("/characters", { method: "POST", body: dto });
}

export function apiCharactersUpdate(id: number, dto: UpdateCharacterDto) {
  return http<Character>(`/characters/${id}`, { method: "PATCH", body: dto });
}

export function apiCharactersDelete(id: number) {
  return http<Character>(`/characters/${id}`, { method: "DELETE" });
}

export function apiCharactersReset() {
  return http<{ message: string }>("/characters/reset", { method: "POST" });
}