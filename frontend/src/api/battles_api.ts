import { http } from "../lib/http";

export function apiCreateBattle(
  token: string,
  body:
    | { mode: "PVE"; initiatorCharacterId: number; opponentCharacterId: number }
    | { mode: "PVP"; initiatorCharacterId: number; opponentUserId: number; opponentCharacterId: number }
) {
  return http<any>("/battles", { method: "POST", token, body });
}

export function apiBattle(token: string, id: number) {
  return http<any>(`/battles/${id}`, { token });
}

export function apiMyBattles(token: string) {
  return http<any>("/battles", { token });
}

export function apiAttack(token: string, battleId: number, special: boolean) {
  return http<any>("/battles/attack", { method: "POST", token, body: { battleId, special } });
}