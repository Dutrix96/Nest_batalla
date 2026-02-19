import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BattleSide } from "@prisma/client";

@Injectable()
export class BattlesService {
  constructor(private prisma: PrismaService) {}

  async createPvpLobby(initiatorUserId: number, opponentUserId: number) {
    if (initiatorUserId === opponentUserId) {
      throw new BadRequestException("No puedes retarte a ti mismo");
    }

    const opp = await this.prisma.user.findUnique({ where: { id: opponentUserId } });
    if (!opp) throw new NotFoundException("Opponent no existe");

    const battle = await this.prisma.battle.create({
      data: {
        mode: "PVP",
        status: "LOBBY",
        initiatorUserId,
        opponentUserId,
        currentTurnSide: "INITIATOR",
        winnerUserId: null,
        winnerSide: null,
      },
      select: { id: true },
    });

    return battle;
  }

  async selectCharacter(userId: number, battleId: number, characterId: number) {
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      select: {
        id: true,
        mode: true,
        status: true,
        initiatorUserId: true,
        opponentUserId: true,
      },
    });

    if (!battle) throw new NotFoundException("Battle no existe");
    if (battle.mode !== "PVP") throw new BadRequestException("Solo PVP usa lobby");
    if (battle.status !== "LOBBY") throw new BadRequestException("La battle ya no esta en lobby");

    const isInitiator = battle.initiatorUserId === userId;
    const isOpponent = battle.opponentUserId === userId;

    if (!isInitiator && !isOpponent) throw new ForbiddenException("No eres participante");

    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { level: true },
    });
    if (!u) throw new NotFoundException("User no existe");

    const ch = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!ch) throw new NotFoundException("Character no existe");

    if (ch.requiredLevel > u.level) {
      throw new BadRequestException("No tienes nivel para ese personaje");
    }

    const side: BattleSide = isInitiator ? "INITIATOR" : "OPPONENT";

    await this.prisma.battleParticipant.upsert({
      where: { battleId_side: { battleId, side } },
      update: {
        userId,
        characterId: ch.id,
        hp: ch.maxHp,
        maxHp: ch.maxHp,
        attack: ch.attack,
        specialUsed: false,
      },
      create: {
        battleId,
        side,
        userId,
        characterId: ch.id,
        hp: ch.maxHp,
        maxHp: ch.maxHp,
        attack: ch.attack,
        specialUsed: false,
      },
    });

    const parts = await this.prisma.battleParticipant.findMany({
      where: { battleId },
      select: { side: true },
    });

    const hasInitiator = parts.some((p) => p.side === "INITIATOR");
    const hasOpponent = parts.some((p) => p.side === "OPPONENT");

    if (hasInitiator && hasOpponent) {
      await this.prisma.battle.update({
        where: { id: battleId },
        data: {
          status: "ACTIVE",
          currentTurnSide: "INITIATOR",
          winnerUserId: null,
          winnerSide: null,
        },
      });
    }

    return { ok: true };
  }

  async getBattleState(userId: number, battleId: number) {
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: {
          include: {
            character: true,
            user: true,
          },
        },
      },
    });

    if (!battle) throw new NotFoundException("Battle no existe");

    const isInitiator = battle.initiatorUserId === userId;
    const isOpponent = battle.opponentUserId === userId;

    if (!isInitiator && !isOpponent) throw new ForbiddenException("No eres participante");

    return battle;
  }

    async attack(userId: number, battleId: number, special: boolean) {
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      include: { participants: true },
    });

    if (!battle) throw new NotFoundException("Battle no existe");
    if (battle.status !== "ACTIVE") throw new BadRequestException("La battle no esta activa");

    const isInitiator = battle.initiatorUserId === userId;
    const isOpponent = battle.opponentUserId === userId;

    if (!isInitiator && !isOpponent) throw new ForbiddenException("No eres participante");

    const mySide: BattleSide = isInitiator ? "INITIATOR" : "OPPONENT";
    if (battle.currentTurnSide !== mySide) throw new BadRequestException("No es tu turno");

    const attacker = battle.participants.find((p) => p.side === mySide);
    const defender = battle.participants.find((p) => p.side !== mySide);

    if (!attacker || !defender) throw new BadRequestException("Faltan participantes");

    let damage = attacker.attack;

    if (special) {
      if (attacker.specialUsed) throw new BadRequestException("Especial ya usado");
      damage = attacker.attack * 2;
    }

    const newHp = Math.max(0, defender.hp - damage);

    await this.prisma.$transaction(async (tx) => {
      if (special) {
        await tx.battleParticipant.update({
          where: { battleId_side: { battleId, side: attacker.side } },
          data: { specialUsed: true },
        });
      }

      await tx.battleParticipant.update({
        where: { battleId_side: { battleId, side: defender.side } },
        data: { hp: newHp },
      });

      if (newHp <= 0) {
        await tx.battle.update({
          where: { id: battleId },
          data: {
            status: "FINISHED",
            winnerSide: attacker.side,
            winnerUserId: attacker.userId ?? null,
          },
        });
      } else {
        const nextTurn: BattleSide = attacker.side === "INITIATOR" ? "OPPONENT" : "INITIATOR";
        await tx.battle.update({
          where: { id: battleId },
          data: { currentTurnSide: nextTurn },
        });
      }
    });

    const event = {
      battleId,
      attackerSide: attacker.side,
      defenderSide: defender.side,
      damage,
      defenderHp: newHp,
      special: !!special,
      ts: Date.now(),
    };

    return { event };
  }
}