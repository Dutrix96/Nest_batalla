import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBattleDto, CreateBattleModeDto } from './dto/create-battle.dto';
import { AttackBattleDto } from './dto/attack-battle.dto';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('battles')
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Get()
  findAll(@Req() req: Request) {
    const userId = Number((req as any).user?.id);
    return this.battlesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = Number((req as any).user?.id);
    return this.battlesService.findOne(userId, Number(id));
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateBattleDto) {
    const userId = Number((req as any).user?.id);

    if (dto.mode === CreateBattleModeDto.PVE) {
      return this.battlesService.createPve(userId, dto.initiatorCharacterId, dto.opponentCharacterId);
    }

    if (!dto.opponentUserId) {
      return { message: 'opponentUserId es obligatorio en PVP' };
    }

    return this.battlesService.createPvp(
      userId,
      dto.initiatorCharacterId,
      dto.opponentUserId,
      dto.opponentCharacterId,
    );
  }

  @Post('attack')
  attack(@Req() req: Request, @Body() dto: AttackBattleDto) {
    const userId = Number((req as any).user?.id);
    return this.battlesService.attack(userId, dto.battleId, dto.special);
  }
}