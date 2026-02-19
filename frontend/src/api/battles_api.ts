import { http } from "../lib/http";

export function apiBattle(token: string, battleId: number) {
  return http<any>(`/battles/${battleId}`, {
    method: "GET",
    token,
  });
}

export function apiAttack(token: string, battleId: number, special: boolean) {
  return http<any>("/battles/attack", {
    method: "POST",
    token,
    body: {
      battleId,
      special: !!special,
    },
  });
}

export function apiSelectCharacter(token: string, battleId: number, characterId: number) {
  return http<any>("/battles/select-character", {
    method: "POST",
    token,
    body: {
      battleId,
      characterId,
    },
  });
}

export function apiPvpQueue(token: string) {
  return http<any>("/battles/pvp-queue", {
    method: "POST",
    token,
  });
}

export function apiPvpCancel(token: string) {
  return http<any>("/battles/pvp-queue", {
    method: "DELETE",
    token,
  });
}