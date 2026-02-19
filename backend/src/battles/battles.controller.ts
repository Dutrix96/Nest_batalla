import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BattlesService } from "./battles.service";
import { CreatePvpLobbyDto } from "./dto/create-pvp-lobby.dto";
import { SelectCharacterDto } from "./dto/select-character.dto";
import { AttackDto } from "./dto/attack-battle.dto";
import { PvpQueueService } from "./pvp-queue.service";
import { BattlesGateway } from "./battles.gateway";

@Controller("battles")
export class BattlesController {
  constructor(
    private readonly battlesService: BattlesService,
    private readonly pvpQueue: PvpQueueService,
    private readonly gateway: BattlesGateway
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("pvp-lobby")
  createPvpLobby(@Req() req: any, @Body() dto: CreatePvpLobbyDto) {
    return this.battlesService.createPvpLobby(req.user.id, dto.opponentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("pvp-queue")
  async queuePvp(@Req() req: any) {
    const res = await this.pvpQueue.queue(req.user.id);

    if (res.status === "MATCHED") {
      this.gateway.emitToUser(res.users[0], "pvp:matched", { battleId: res.battleId });
      this.gateway.emitToUser(res.users[1], "pvp:matched", { battleId: res.battleId });
    }

    return res;
  }

  @UseGuards(JwtAuthGuard)
  @Delete("pvp-queue")
  cancelQueue(@Req() req: any) {
    return this.pvpQueue.cancel(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("select-character")
  async selectCharacter(@Req() req: any, @Body() dto: SelectCharacterDto) {
    const r = await this.battlesService.selectCharacter(req.user.id, dto.battleId, dto.characterId);

    const state: any = await this.battlesService.getBattleState(req.user.id, dto.battleId);
    if (state.status === "LOBBY") {
      this.gateway.emitToBattle(dto.battleId, "battle:lobby_state", (this.gateway as any).mapLobby(state));
    } else {
      this.gateway.emitToBattle(dto.battleId, "battle:state", state);
    }

    return r;
  }

  @UseGuards(JwtAuthGuard)
  @Post("attack")
  async attack(@Req() req: any, @Body() dto: AttackDto) {
    const res = await this.battlesService.attack(req.user.id, dto.battleId, !!dto.special);

    this.gateway.emitToBattle(dto.battleId, "battle:attack", res.event);

    const state: any = await this.battlesService.getBattleState(req.user.id, dto.battleId);
    this.gateway.emitToBattle(dto.battleId, "battle:state", state);

    if (state.status === "FINISHED") {
      this.gateway.emitToBattle(dto.battleId, "battle:finished", {
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