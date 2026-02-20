import { http } from "../lib/http";

type CreateBattlePayload = {
  mode: "PVE" | "PVP";
  initiatorCharacterId: number;
  opponentCharacterId: number;
  opponentUserId?: number | null;
};

export function apiCreateBattle(token: string | undefined, payload: CreateBattlePayload) {
  return http<any>("/battles", {
    method: "POST",
    token,
    body: payload,
  });
}

export function apiBattle(token: string | undefined, battleId: number) {
  return http<any>(`/battles/${battleId}`, {
    method: "GET",
    token,
  });
}

export function apiAttack(token: string | undefined, battleId: number, special: boolean) {
  return http<any>("/battles/attack", {
    method: "POST",
    token,
    body: { battleId, special: !!special },
  });
}

export function apiSelectCharacter(
  token: string | undefined,
  battleId: number,
  characterId: number
) {
  return http<any>("/battles/select-character", {
    method: "POST",
    token,
    body: { battleId, characterId },
  });
}

export function apiMyBattles(token: string | undefined) {
  return http<any>("/battles", {
    method: "GET",
    token,
  });
}

export function apiPvpQueue(token: string | undefined) {
  return http<any>("/battles/pvp-queue", {
    method: "POST",
    token,
  });
}

export function apiPvpCancel(token: string | undefined) {
  return http<any>("/battles/pvp-queue", {
    method: "DELETE",
    token,
  });
}