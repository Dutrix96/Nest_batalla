import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BattlesService } from "./battles.service";
import { BattlesGateway } from "./battles.gateway";
import { PvpQueueService } from "./pvp-queue.service";
import { CreateBattleDto } from "./dto/create-battle.dto";
import { CreatePvpLobbyDto } from "./dto/create-pvp-lobby.dto";
import { SelectCharacterDto } from "./dto/select-character.dto";
import { AttackBattleDto } from "./dto/attack-battle.dto";

@Controller("battles")
export class BattlesController {
  constructor(
    private readonly battlesService: BattlesService,
    private readonly gateway: BattlesGateway,
    private readonly pvpQueue: PvpQueueService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateBattleDto) {
    const battle = await this.battlesService.createBattle(req.user.id, dto);

    const state: any = await this.battlesService.getBattleState(req.user.id, battle.id);
    this.gateway.emitBattleState(battle.id, state);

    return battle;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async myBattles(@Req() req: any) {
    return this.battlesService.listMyBattles(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("pvp-lobby")
  createPvpLobby(@Req() req: any, @Body() dto: CreatePvpLobbyDto) {
    return this.battlesService.createPvpLobby(req.user.id, dto.opponentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("pvp-queue")
  async queue(@Req() req: any) {
    const res = await this.pvpQueue.queue(req.user.id);

    if (res.status === "MATCHED") {
      this.gateway.emitToUser(res.users[0], "pvp:matched", { battleId: res.battleId });
      this.gateway.emitToUser(res.users[1], "pvp:matched", { battleId: res.battleId });
    }

    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Delete("pvp-queue")
  async cancel(@Req() req: any) {
    return this.pvpQueue.cancel(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("select-character")
  async selectCharacter(@Req() req: any, @Body() dto: SelectCharacterDto) {
    await this.battlesService.selectCharacter(req.user.id, dto.battleId, dto.characterId);

    const state: any = await this.battlesService.getBattleState(req.user.id, dto.battleId);

    if (state.status === "LOBBY") {
      const ini = state.participants?.find((p: any) => p.side === "INITIATOR") ?? null;
      const opp = state.participants?.find((p: any) => p.side === "OPPONENT") ?? null;

      this.gateway.emitLobbyState(dto.battleId, {
        id: state.id,
        mode: state.mode,
        status: state.status,
        initiatorUserId: state.initiatorUserId,
        opponentUserId: state.opponentUserId,
        initiatorPicked: !!ini,
        opponentPicked: !!opp,
        initiatorCharacter: ini?.character ? { id: ini.character.id, name: ini.character.name } : null,
        opponentCharacter: opp?.character ? { id: opp.character.id, name: opp.character.name } : null,
      });
    } else {
      this.gateway.emitBattleState(dto.battleId, state);
    }

    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("attack")
  async attack(@Req() req: any, @Body() dto: AttackBattleDto) {
    const result = await this.battlesService.attack(req.user.id, dto.battleId, !!dto.special);

    for (const ev of result.events) {
      this.gateway.emitBattleAttack(dto.battleId, ev);
    }

    const state: any = await this.battlesService.getBattleState(req.user.id, dto.battleId);
    this.gateway.emitBattleState(dto.battleId, state);

    if (state.status === "FINISHED") {
      this.gateway.emitBattleFinished(dto.battleId, {
        battleId: dto.battleId,
        winnerSide: state.winnerSide ?? null,
        winnerUserId: state.winnerUserId ?? null,
      });
    }

    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  getBattle(@Req() req: any, @Param("id") id: string) {
    return this.battlesService.getBattleState(req.user.id, Number(id));
  }
}