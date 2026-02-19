import { io, Socket } from "socket.io-client";
import { env } from "../lib/env";
import type { BattleAttackEvent, BattleState } from "./types";

type ServerToClientEvents = {
  "battle:state": (state: BattleState) => void;
  "battle:attack": (ev: BattleAttackEvent) => void;
  "battle:finished": (payload: { battleId: number; winnerUserId: number | null; winnerSide: string | null }) => void;
  "battle:error": (payload: { message: string }) => void;
};

type ClientToServerEvents = {
  "battle:join": (payload: { battleId: number }) => void;
  "battle:attack": (payload: { battleId: number; special?: boolean }) => void;
};

export type BattleSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createBattleSocket(token: string): BattleSocket {
  return io(env.apiBaseUrl, {
    transports: ["websocket"],
    auth: { token },
  });
}
