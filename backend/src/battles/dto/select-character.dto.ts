import { IsInt, Min } from "class-validator";

export class SelectCharacterDto {
  @IsInt()
  @Min(1)
  battleId: number;

  @IsInt()
  @Min(1)
  characterId: number;
}