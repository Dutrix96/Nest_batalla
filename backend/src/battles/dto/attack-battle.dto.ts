import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class AttackBattleDto {
  @IsInt()
  @Min(1)
  battleId: number;

  @IsOptional()
  @IsBoolean()
  special?: boolean;
}