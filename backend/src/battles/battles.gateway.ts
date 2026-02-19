import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { BattlesService } from "./battles.service";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class BattlesGateway {
  @WebSocketServer()
  server: Server;

  private socketsByUser = new Map<number, Set<string>>();

  constructor(
    private battlesService: BattlesService,
    private jwt: JwtService
  ) {}

  handleConnection(client: Socket) {
    try {
      const authToken = (client.handshake.auth?.token as string | undefined) ?? "";
      const headerAuth = (client.handshake.headers?.authorization as string | undefined) ?? "";

      const token =
        authToken ||
        (headerAuth.startsWith("Bearer ") ? headerAuth.slice("Bearer ".length) : "");

      if (!token) {
        client.disconnect();
        return;
      }

      const payload: any = this.jwt.verify(token);
      const userId = Number(payload?.sub ?? payload?.id ?? payload?.userId);

      if (!Number.isFinite(userId) || userId <= 0) {
        client.disconnect();
        return;
      }

      (client as any).data.userId = userId;

      const set = this.socketsByUser.get(userId) ?? new Set<string>();
      set.add(client.id);
      this.socketsByUser.set(userId, set);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserId(client);
    if (!userId) return;

    const set = this.socketsByUser.get(userId);
    if (!set) return;

    set.delete(client.id);
    if (set.size === 0) this.socketsByUser.delete(userId);
  }

  private room(battleId: number) {
    return `battle:${battleId}`;
  }

  private getUserId(client: Socket): number | null {
    const id = (client as any).data?.userId ?? null;
    return typeof id === "number" ? id : null;
  }

  emitToUser(userId: number, event: string, payload: any) {
    const set = this.socketsByUser.get(userId);
    if (!set) return;

    for (const socketId of set.values()) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  emitToBattle(battleId: number, event: string, payload: any) {
    this.server.to(this.room(battleId)).emit(event, payload);
  }

  @SubscribeMessage("battle:join")
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { battleId: number }
  ) {
    const battleId = Number(body?.battleId);
    if (!battleId) return;

    client.join(this.room(battleId));

    const userId = this.getUserId(client);
    if (!userId) {
      client.emit("battle:error", { message: "No auth" });
      return;
    }

    const state: any = await this.battlesService.getBattleState(userId, battleId);

    if (state.status === "LOBBY") {
      this.emitToBattle(battleId, "battle:lobby_state", this.mapLobby(state));
    } else {
      this.emitToBattle(battleId, "battle:state", state);
    }
  }

  private mapLobby(battle: any) {
    const ini = battle.participants?.find((p: any) => p.side === "INITIATOR") ?? null;
    const opp = battle.participants?.find((p: any) => p.side === "OPPONENT") ?? null;

    return {
      id: battle.id,
      mode: battle.mode,
      status: battle.status,
      initiatorUserId: battle.initiatorUserId,
      opponentUserId: battle.opponentUserId,
      initiatorPicked: !!ini,
      opponentPicked: !!opp,
      initiatorCharacter: ini?.character ? { id: ini.character.id, name: ini.character.name } : null,
      opponentCharacter: opp?.character ? { id: opp.character.id, name: opp.character.name } : null,
    };
  }
}