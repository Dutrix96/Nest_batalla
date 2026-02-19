import { IsBoolean, IsInt, Min } from 'class-validator';

export class AttackBattleDto {
  @IsInt()
  @Min(1)
  battleId: number;

  @IsBoolean()
  special: boolean;
}