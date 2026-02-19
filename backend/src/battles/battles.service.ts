import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BattleMode, BattleSide, BattleStatus } from '@prisma/client';

@Injectable()
export class BattlesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBattleOrThrow(battleId: number) {
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        initiatorUser: true,
        opponentUser: true,
        participants: { include: { character: true, user: true } },
      },
    });

    if (!battle) throw new NotFoundException('Batalla no encontrada');
    return battle;
  }

  private getParticipant(battle: any, side: BattleSide) {
    const p = battle.participants.find((x: any) => x.side === side);
    if (!p) throw new BadRequestException('Participante no encontrado');
    return p;
  }

  private assertCanView(battle: any, userId: number) {
    if (battle.mode === BattleMode.PVE) {
      if (battle.initiatorUserId !== userId) throw new ForbiddenException('No tienes acceso a esta batalla');
      return;
    }

    const ok = battle.initiatorUserId === userId || battle.opponentUserId === userId;
    if (!ok) throw new ForbiddenException('No tienes acceso a esta batalla');
  }

  private assertCanAct(battle: any, userId: number) {
    this.assertCanView(battle, userId);

    if (battle.status !== BattleStatus.ACTIVE) {
      throw new BadRequestException('La batalla ya ha finalizado');
    }

    if (battle.mode === BattleMode.PVE) {
      if (battle.initiatorUserId !== userId) throw new ForbiddenException('Solo el usuario puede actuar en PVE');
      if (battle.currentTurnSide !== BattleSide.INITIATOR) throw new BadRequestException('No es tu turno');
      return;
    }

    if (battle.currentTurnSide === BattleSide.INITIATOR && battle.initiatorUserId !== userId) {
      throw new BadRequestException('No es tu turno');
    }
    if (battle.currentTurnSide === BattleSide.OPPONENT && battle.opponentUserId !== userId) {
      throw new BadRequestException('No es tu turno');
    }
  }

  private async applyWin(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const xpTotal = user.xp + 10;
    const levelUps = Math.floor(xpTotal / 100);
    const newLevel = user.level + levelUps;
    const newXp = xpTotal % 100;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        wins: { increment: 1 },
        level: newLevel,
        xp: newXp,
      },
    });
  }

  private async applyLoss(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { losses: { increment: 1 } },
    });
  }

  async findAll(userId: number) {
    return this.prisma.battle.findMany({
      where: {
        OR: [{ initiatorUserId: userId }, { opponentUserId: userId }],
      },
      orderBy: { id: 'desc' },
      include: {
        initiatorUser: true,
        opponentUser: true,
        participants: { include: { character: true, user: true } },
      },
    });
  }

  async findOne(userId: number, battleId: number) {
    const battle = await this.getBattleOrThrow(battleId);
    this.assertCanView(battle, userId);
    return battle;
  }

  async createPve(userId: number, initiatorCharacterId: number, opponentCharacterId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const myChar = await this.prisma.character.findUnique({ where: { id: initiatorCharacterId } });
    if (!myChar) throw new NotFoundException('Personaje no encontrado');

    const enemyChar = await this.prisma.character.findUnique({ where: { id: opponentCharacterId } });
    if (!enemyChar) throw new NotFoundException('Personaje enemigo no encontrado');

    if (myChar.requiredLevel > user.level) {
      throw new BadRequestException('Tu nivel es insuficiente para usar ese personaje');
    }

    return this.prisma.battle.create({
      data: {
        mode: BattleMode.PVE,
        status: BattleStatus.ACTIVE,
        initiatorUserId: userId,
        opponentUserId: null,
        currentTurnSide: BattleSide.INITIATOR,
        participants: {
          create: [
            {
              side: BattleSide.INITIATOR,
              userId,
              characterId: myChar.id,
              hp: myChar.maxHp,
              maxHp: myChar.maxHp,
              attack: myChar.attack,
            },
            {
              side: BattleSide.OPPONENT,
              userId: null,
              characterId: enemyChar.id,
              hp: enemyChar.maxHp,
              maxHp: enemyChar.maxHp,
              attack: enemyChar.attack,
            },
          ],
        },
      },
      include: {
        initiatorUser: true,
        opponentUser: true,
        participants: { include: { character: true, user: true } },
      },
    });
  }

  async createPvp(
    userId: number,
    initiatorCharacterId: number,
    opponentUserId: number,
    opponentCharacterId: number,
  ) {
    if (userId === opponentUserId) throw new BadRequestException('No puedes luchar contra ti mismo');

    const [user, opponent] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: opponentUserId } }),
    ]);

    if (!user || !opponent) throw new NotFoundException('Usuario no encontrado');

    const [myChar, opChar] = await Promise.all([
      this.prisma.character.findUnique({ where: { id: initiatorCharacterId } }),
      this.prisma.character.findUnique({ where: { id: opponentCharacterId } }),
    ]);

    if (!myChar || !opChar) throw new NotFoundException('Personaje no encontrado');

    if (myChar.requiredLevel > user.level) {
      throw new BadRequestException('Tu nivel es insuficiente para usar ese personaje');
    }
    if (opChar.requiredLevel > opponent.level) {
      throw new BadRequestException('El nivel del rival es insuficiente para ese personaje');
    }

    return this.prisma.battle.create({
      data: {
        mode: BattleMode.PVP,
        status: BattleStatus.ACTIVE,
        initiatorUserId: userId,
        opponentUserId,
        currentTurnSide: BattleSide.INITIATOR,
        participants: {
          create: [
            {
              side: BattleSide.INITIATOR,
              userId,
              characterId: myChar.id,
              hp: myChar.maxHp,
              maxHp: myChar.maxHp,
              attack: myChar.attack,
            },
            {
              side: BattleSide.OPPONENT,
              userId: opponentUserId,
              characterId: opChar.id,
              hp: opChar.maxHp,
              maxHp: opChar.maxHp,
              attack: opChar.attack,
            },
          ],
        },
      },
      include: {
        initiatorUser: true,
        opponentUser: true,
        participants: { include: { character: true, user: true } },
      },
    });
  }

  async attack(userId: number, battleId: number, special: boolean) {
    const battle = await this.getBattleOrThrow(battleId);
    this.assertCanAct(battle, userId);

    const attackerSide = battle.currentTurnSide;
    const targetSide = attackerSide === BattleSide.INITIATOR ? BattleSide.OPPONENT : BattleSide.INITIATOR;

    const attacker = this.getParticipant(battle, attackerSide);
    const target = this.getParticipant(battle, targetSide);

    if (special && attacker.specialUsed) {
      throw new BadRequestException('La habilidad especial ya fue usada');
    }

    const damage = special ? attacker.attack * 2 : attacker.attack;
    const newHp = Math.max(0, target.hp - damage);

    const [updatedTarget] = await this.prisma.$transaction([
      this.prisma.battleParticipant.update({
        where: { id: target.id },
        data: { hp: newHp },
        include: { character: true, user: true },
      }),
      this.prisma.battleParticipant.update({
        where: { id: attacker.id },
        data: { specialUsed: special ? true : attacker.specialUsed },
      }),
    ]);

    const attackEvent = {
      battleId,
      attackerSide,
      attackerCharacterId: attacker.characterId,
      targetSide,
      targetCharacterId: target.characterId,
      damage,
      targetHp: newHp,
      special,
    };

    if (newHp === 0) {
      const finished = await this.finishBattle(battleId, attackerSide);
      return { battle: finished, attackEvent, machineAttackEvent: null };
    }

    const updatedBattle = await this.prisma.battle.update({
      where: { id: battleId },
      data: { currentTurnSide: targetSide },
      include: {
        initiatorUser: true,
        opponentUser: true,
        participants: { include: { character: true, user: true } },
      },
    });

    // PVE: turno maquina automatico
    if (updatedBattle.mode === BattleMode.PVE && updatedBattle.currentTurnSide === BattleSide.OPPONENT) {
      const machine = await this.machineTurn(updatedBattle.id);
      return {
        battle: machine.battle,
        attackEvent,
        machineAttackEvent: machine.attackEvent,
      };
    }

    return { battle: updatedBattle, attackEvent, machineAttackEvent: null };
  }

  private async finishBattle(battleId: number, winnerSide: BattleSide) {
    const battle = await this.getBattleOrThrow(battleId);

    const winnerUserId =
      battle.mode === BattleMode.PVE
        ? (winnerSide === BattleSide.INITIATOR ? battle.initiatorUserId : null)
        : (winnerSide === BattleSide.INITIATOR ? battle.initiatorUserId : battle.opponentUserId);

    const finished = await this.prisma.battle.update({
      where: { id: battleId },
      data: {
        status: BattleStatus.FINISHED,
        winnerSide,
        winnerUserId: winnerUserId ?? null,
      },
      include: {
        initiatorUser: true,
        opponentUser: true,
        participants: { include: { character: true, user: true } },
      },
    });

    if (finished.mode === BattleMode.PVE) {
      if (winnerUserId) await this.applyWin(finished.initiatorUserId);
      else await this.applyLoss(finished.initiatorUserId);
      return finished;
    }

    if (!winnerUserId) return finished;

    const loserUserId = winnerUserId === finished.initiatorUserId ? finished.opponentUserId : finished.initiatorUserId;
    if (loserUserId) {
      await this.applyWin(winnerUserId);
      await this.applyLoss(loserUserId);
    }

    return finished;
  }

  private async machineTurn(battleId: number) {
    const battle = await this.getBattleOrThrow(battleId);
    if (battle.status !== BattleStatus.ACTIVE) return { battle, attackEvent: null };

    const attacker = this.getParticipant(battle, BattleSide.OPPONENT);
    const target = this.getParticipant(battle, BattleSide.INITIATOR);

    const willUseSpecial =
      !attacker.specialUsed && attacker.hp > 0 && attacker.hp <= Math.floor(attacker.maxHp * 0.3);

    const damage = willUseSpecial ? attacker.attack * 2 : attacker.attack;
    const newHp = Math.max(0, target.hp - damage);

    await this.prisma.$transaction([
      this.prisma.battleParticipant.update({
        where: { id: target.id },
        data: { hp: newHp },
      }),
      this.prisma.battleParticipant.update({
        where: { id: attacker.id },
        data: { specialUsed: willUseSpecial ? true : attacker.specialUsed },
      }),
      this.prisma.battle.update({
        where: { id: battleId },
        data: { currentTurnSide: BattleSide.INITIATOR },
      }),
    ]);

    const attackEvent = {
      battleId,
      attackerSide: BattleSide.OPPONENT,
      attackerCharacterId: attacker.characterId,
      targetSide: BattleSide.INITIATOR,
      targetCharacterId: target.characterId,
      damage,
      targetHp: newHp,
      special: willUseSpecial,
    };

    if (newHp === 0) {
      const finished = await this.finishBattle(battleId, BattleSide.OPPONENT);
      return { battle: finished, attackEvent };
    }

    const updatedBattle = await this.getBattleOrThrow(battleId);
    return { battle: updatedBattle, attackEvent };
  }
}