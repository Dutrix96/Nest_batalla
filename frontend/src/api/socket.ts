import { io, Socket } from "socket.io-client";
import { env } from "../lib/env";
import { getToken } from "../lib/storage";

type ServerToClientEvents = {
  "battle:state": (state: any) => void;
  "battle:lobby_state": (state: any) => void;
  "battle:attack": (ev: any) => void;
  "battle:finished": (payload: any) => void;
  "battle:error": (payload: { message: string }) => void;

  "pvp:queued": (payload: { ok: boolean }) => void;
  "pvp:canceled": (payload: { ok: boolean }) => void;
  "pvp:matched": (payload: { battleId: number }) => void;
};

type ClientToServerEvents = {
  "battle:join": (payload: { battleId: number }) => void;
  "pvp:queue": () => void;
  "pvp:cancel": () => void;
};

export type BattleSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createBattleSocket(token?: string): BattleSocket {
  const t = token ?? getToken() ?? "";
  return io(env.apiBaseUrl, {
    transports: ["websocket"],
    auth: { token: t },
  });
}