import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class AttackDto {
  @IsInt()
  @Min(1)
  battleId: number;

  @IsOptional()
  @IsBoolean()
  special?: boolean;
}