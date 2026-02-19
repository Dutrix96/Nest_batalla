import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum CreateBattleModeDto {
  PVP = 'PVP',
  PVE = 'PVE',
}

export class CreateBattleDto {
  @IsEnum(CreateBattleModeDto)
  mode: CreateBattleModeDto;

  @IsInt()
  @Min(1)
  initiatorCharacterId: number;

  @IsInt()
  @Min(1)
  opponentCharacterId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  opponentUserId?: number;
}