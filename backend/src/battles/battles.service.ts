import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BattleSide } from "@prisma/client";
import { CreateBattleDto, CreateBattleModeDto } from "./dto/create-battle.dto";

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

  async createBattle(userId: number, dto: CreateBattleDto) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { level: true },
    });
    if (!u) throw new NotFoundException("User no existe");

    const initiatorCh = await this.prisma.character.findUnique({
      where: { id: dto.initiatorCharacterId },
    });
    if (!initiatorCh) throw new NotFoundException("Character initiator no existe");

    if (initiatorCh.requiredLevel > u.level) {
      throw new BadRequestException("No tienes nivel para ese personaje");
    }

    const opponentCh = await this.prisma.character.findUnique({
      where: { id: dto.opponentCharacterId },
    });
    if (!opponentCh) throw new NotFoundException("Character opponent no existe");

    if (dto.mode === CreateBattleModeDto.PVP) {
      if (!dto.opponentUserId) throw new BadRequestException("Falta opponentUserId en PVP");

      if (dto.opponentUserId === userId) {
        throw new BadRequestException("No puedes retarte a ti mismo");
      }

      const oppUser = await this.prisma.user.findUnique({
        where: { id: dto.opponentUserId },
        select: { level: true },
      });
      if (!oppUser) throw new NotFoundException("Opponent no existe");

      if (opponentCh.requiredLevel > oppUser.level) {
        throw new BadRequestException("El rival no tiene nivel para ese personaje");
      }

      const battle = await this.prisma.battle.create({
        data: {
          mode: "PVP",
          status: "ACTIVE",
          initiatorUserId: userId,
          opponentUserId: dto.opponentUserId,
          currentTurnSide: "INITIATOR",
          winnerUserId: null,
          winnerSide: null,
          participants: {
            create: [
              {
                side: "INITIATOR",
                userId,
                characterId: initiatorCh.id,
                hp: initiatorCh.maxHp,
                maxHp: initiatorCh.maxHp,
                attack: initiatorCh.attack,
                specialUsed: false,
              },
              {
                side: "OPPONENT",
                userId: dto.opponentUserId,
                characterId: opponentCh.id,
                hp: opponentCh.maxHp,
                maxHp: opponentCh.maxHp,
                attack: opponentCh.attack,
                specialUsed: false,
              },
            ],
          },
        },
        select: { id: true },
      });

      return battle;
    }

    const battle = await this.prisma.battle.create({
      data: {
        mode: "PVE",
        status: "ACTIVE",
        initiatorUserId: userId,
        opponentUserId: null,
        currentTurnSide: "INITIATOR",
        winnerUserId: null,
        winnerSide: null,
        participants: {
          create: [
            {
              side: "INITIATOR",
              userId,
              characterId: initiatorCh.id,
              hp: initiatorCh.maxHp,
              maxHp: initiatorCh.maxHp,
              attack: initiatorCh.attack,
              specialUsed: false,
            },
            {
              side: "OPPONENT",
              userId: null,
              characterId: opponentCh.id,
              hp: opponentCh.maxHp,
              maxHp: opponentCh.maxHp,
              attack: opponentCh.attack,
              specialUsed: false,
            },
          ],
        },
      },
      select: { id: true },
    });

    return battle;
  }

  async listMyBattles(userId: number) {
    return this.prisma.battle.findMany({
      where: {
        OR: [{ initiatorUserId: userId }, { opponentUserId: userId }],
      },
      orderBy: { id: "desc" },
      take: 50,
      select: {
        id: true,
        mode: true,
        status: true,
        initiatorUserId: true,
        opponentUserId: true,
      },
    });
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

    if (battle.currentTurnSide !== mySide) {
      throw new BadRequestException("No es tu turno");
    }

    const attacker = battle.participants.find((p) => p.side === mySide);
    const defender = battle.participants.find((p) => p.side !== mySide);

    if (!attacker || !defender) throw new BadRequestException("Faltan participantes");

    const events: any[] = [];

    const dmg1 = this.calcDamage(attacker.attack, special, attacker.specialUsed);
    await this.applyHit(battleId, attacker.side as BattleSide, defender.side as BattleSide, dmg1.damage, dmg1.usedSpecial);

    events.push({
      battleId,
      attackerSide: attacker.side,
      defenderSide: defender.side,
      damage: dmg1.damage,
      special: dmg1.usedSpecial,
      ts: Date.now(),
    });

    const after1 = await this.prisma.battleParticipant.findUnique({
      where: { battleId_side: { battleId, side: defender.side as BattleSide } },
      select: { hp: true },
    });

    if (!after1) throw new BadRequestException("No pude leer hp");

    if (after1.hp <= 0) {
      await this.finishBattle(battleId, attacker.side as BattleSide, attacker.userId ?? null);
      return { events };
    }

    if (battle.mode === "PVP") {
      const next: BattleSide = attacker.side === "INITIATOR" ? "OPPONENT" : "INITIATOR";
      await this.prisma.battle.update({ where: { id: battleId }, data: { currentTurnSide: next } });
      return { events };
    }

    const aiSide: BattleSide = defender.side as BattleSide;
    const playerSide: BattleSide = attacker.side as BattleSide;

    await this.prisma.battle.update({ where: { id: battleId }, data: { currentTurnSide: aiSide } });

    const ai = await this.prisma.battleParticipant.findUnique({
      where: { battleId_side: { battleId, side: aiSide } },
      select: { attack: true, specialUsed: true, userId: true },
    });

    const player = await this.prisma.battleParticipant.findUnique({
      where: { battleId_side: { battleId, side: playerSide } },
      select: { hp: true, userId: true },
    });

    if (!ai || !player) throw new BadRequestException("No pude leer IA/player");

    const dmg2 = this.calcDamage(ai.attack, false, ai.specialUsed);
    await this.applyHit(battleId, aiSide, playerSide, dmg2.damage, false);

    events.push({
      battleId,
      attackerSide: aiSide,
      defenderSide: playerSide,
      damage: dmg2.damage,
      special: false,
      ts: Date.now(),
    });

    const after2 = await this.prisma.battleParticipant.findUnique({
      where: { battleId_side: { battleId, side: playerSide } },
      select: { hp: true },
    });

    if (!after2) throw new BadRequestException("No pude leer hp player");

    if (after2.hp <= 0) {
      await this.finishBattle(battleId, aiSide, null);
      return { events };
    }

    await this.prisma.battle.update({ where: { id: battleId }, data: { currentTurnSide: playerSide } });

    return { events };
  }

  private calcDamage(baseAtk: number, special: boolean, specialUsed: boolean) {
    if (!special) return { damage: baseAtk, usedSpecial: false };
    if (specialUsed) return { damage: baseAtk, usedSpecial: false };
    return { damage: baseAtk * 2, usedSpecial: true };
  }

  private async applyHit(
    battleId: number,
    attackerSide: BattleSide,
    defenderSide: BattleSide,
    damage: number,
    usedSpecial: boolean
  ) {
    await this.prisma.$transaction(async (tx) => {
      if (usedSpecial) {
        await tx.battleParticipant.update({
          where: { battleId_side: { battleId, side: attackerSide } },
          data: { specialUsed: true },
        });
      }

      const def = await tx.battleParticipant.findUnique({
        where: { battleId_side: { battleId, side: defenderSide } },
        select: { hp: true },
      });

      if (!def) throw new BadRequestException("Defender no existe");

      const newHp = Math.max(0, def.hp - damage);

      await tx.battleParticipant.update({
        where: { battleId_side: { battleId, side: defenderSide } },
        data: { hp: newHp },
      });
    });
  }

  private async finishBattle(battleId: number, winnerSide: any, winnerUserId: number | null) {
  await this.prisma.battle.update({
    where: { id: battleId },
    data: {
      status: "FINISHED",
      winnerSide,
      winnerUserId,
    },
  });

  const parts = await this.prisma.battleParticipant.findMany({
    where: { battleId },
    select: { side: true, userId: true },
  });

  const winner = parts.find((p) => p.side === winnerSide) ?? null;
  const loser = parts.find((p) => p.side !== winnerSide) ?? null;

  const winnerId = winner?.userId ?? null;
  const loserId = loser?.userId ?? null;

  await this.otorgarXpSiUsuarioExiste(winnerId, 20);
  await this.otorgarXpSiUsuarioExiste(loserId, 10);

  await this.sumarWinLose(winnerId, loserId);
}

  async getBattleState(userId: number, battleId: number) {
  const battle = await this.prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      participants: {
        include: {
          character: true,
        },
      },
    },
  });

  if (!battle) throw new NotFoundException("Battle no existe");

  const isInitiator = battle.initiatorUserId === userId;
  const isOpponent = battle.opponentUserId === userId;

  if (!isInitiator && !isOpponent) {
    throw new ForbiddenException("No eres participante");
  }

  const ini = battle.participants.find((p) => p.side === "INITIATOR") ?? null;
  const opp = battle.participants.find((p) => p.side === "OPPONENT") ?? null;

  return {
    id: battle.id,
    mode: battle.mode,
    status: battle.status,
    currentTurnSide: battle.currentTurnSide,
    winnerSide: battle.winnerSide,
    winnerUserId: battle.winnerUserId,

    initiator: ini
      ? {
          userId: ini.userId,
          specialUsed: ini.specialUsed,
          character: {
            id: ini.character.id,
            name: ini.character.name,
            hp: ini.hp,
            maxHp: ini.maxHp,
          },
        }
      : null,

    opponent: opp
      ? {
          userId: opp.userId,
          specialUsed: opp.specialUsed,
          character: {
            id: opp.character.id,
            name: opp.character.name,
            hp: opp.hp,
            maxHp: opp.maxHp,
          },
        }
      : null,
  };
}
  private aplicarXpYNivel(nivelActual: number, xpActual: number, xpGanada: number) {
  let nivel = nivelActual;
  let xp = xpActual + xpGanada;

  while (xp >= nivel * 100) {
    xp -= nivel * 100;
    nivel += 1;
  }

  return { nivel, xp };
}

private async otorgarXpSiUsuarioExiste(userId: number | null, xpGanada: number) {
  if (!userId) return;

  const u = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, level: true, xp: true },
  });
  if (!u) return;

  const res = this.aplicarXpYNivel(u.level ?? 1, u.xp ?? 0, xpGanada);

  await this.prisma.user.update({
    where: { id: userId },
    data: { level: res.nivel, xp: res.xp },
  });
}

private async sumarWinLose(winnerUserId: number | null, loserUserId: number | null) {
  if (winnerUserId) {
    await this.prisma.user.update({
      where: { id: winnerUserId },
      data: { wins: { increment: 1 } },
    });
  }

  if (loserUserId) {
    await this.prisma.user.update({
      where: { id: loserUserId },
      data: { losses: { increment: 1 } },
    });
  }
}
}