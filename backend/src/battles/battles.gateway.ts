import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BattlesService } from './battles.service';
import { WsJwtGuard } from '../auth/ws-jwt.guard';

@WebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'] } })
@UseGuards(WsJwtGuard)
export class BattlesGateway {
  @WebSocketServer()
  io: Server;

  constructor(private readonly battlesService: BattlesService) {}

  @SubscribeMessage('battle:join')
  async join(@MessageBody() body: { battleId: number }, @ConnectedSocket() client: Socket) {
    return this.safe(client, async () => {
      const battleId = Number(body?.battleId);
      if (!battleId) throw new Error('battleId invalido');

      const userId = Number((client as any).data?.user?.id);
      const battle = await this.battlesService.findOne(userId, battleId);

      client.join(this.room(battleId));
      client.emit('battle:state', this.toState(battle));

      return { ok: true };
    });
  }

  @SubscribeMessage('battle:leave')
  async leave(@MessageBody() body: { battleId: number }, @ConnectedSocket() client: Socket) {
    return this.safe(client, async () => {
      const battleId = Number(body?.battleId);
      if (!battleId) throw new Error('battleId invalido');

      client.leave(this.room(battleId));
      return { ok: true };
    });
  }

  @SubscribeMessage('battle:state')
  async state(@MessageBody() body: { battleId: number }, @ConnectedSocket() client: Socket) {
    return this.safe(client, async () => {
      const battleId = Number(body?.battleId);
      if (!battleId) throw new Error('battleId invalido');

      const userId = Number((client as any).data?.user?.id);
      const battle = await this.battlesService.findOne(userId, battleId);

      client.emit('battle:state', this.toState(battle));
      return { ok: true };
    });
  }

  @SubscribeMessage('battle:attack')
  async attack(@MessageBody() body: { battleId: number; special?: boolean }, @ConnectedSocket() client: Socket) {
    return this.safe(client, async () => {
      const battleId = Number(body?.battleId);
      if (!battleId) throw new Error('battleId invalido');

      const userId = Number((client as any).data?.user?.id);
      const special = Boolean(body?.special);

      const result = await this.battlesService.attack(userId, battleId, special);

      const room = this.room(battleId);

      this.io.to(room).emit('battle:attack', result.attackEvent);
      if (result.machineAttackEvent) this.io.to(room).emit('battle:attack', result.machineAttackEvent);

      this.io.to(room).emit('battle:state', this.toState(result.battle));

      if (result.battle.status === 'FINISHED') {
        this.io.to(room).emit('battle:finished', {
          battleId: result.battle.id,
          winnerUserId: result.battle.winnerUserId,
          winnerSide: result.battle.winnerSide,
        });
      }

      return { ok: true };
    });
  }

  private room(battleId: number) {
    return `battle:${battleId}`;
  }

  private toState(battle: any) {
    const initiator = battle.participants.find((p: any) => p.side === 'INITIATOR');
    const opponent = battle.participants.find((p: any) => p.side === 'OPPONENT');

    return {
      id: battle.id,
      mode: battle.mode,
      status: battle.status,
      currentTurnSide: battle.currentTurnSide,
      winnerUserId: battle.winnerUserId,
      winnerSide: battle.winnerSide,
      initiator: initiator
        ? {
            userId: initiator.userId,
            character: {
              id: initiator.characterId,
              name: initiator.character?.name,
              hp: initiator.hp,
              maxHp: initiator.maxHp,
              attack: initiator.attack,
            },
            specialUsed: initiator.specialUsed,
          }
        : null,
      opponent: opponent
        ? {
            userId: opponent.userId,
            character: {
              id: opponent.characterId,
              name: opponent.character?.name,
              hp: opponent.hp,
              maxHp: opponent.maxHp,
              attack: opponent.attack,
            },
            specialUsed: opponent.specialUsed,
          }
        : null,
    };
  }

  private async safe(client: Socket, fn: () => Promise<any>) {
    try {
      return await fn();
    } catch (e: any) {
      const message = e?.message || 'Error inesperado';
      client.emit('battle:error', { message });
      return { ok: false, message };
    }
  }
}