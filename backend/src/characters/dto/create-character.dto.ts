import { IsInt, IsString, Min } from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  maxHp: number;

  @IsInt()
  @Min(0)
  attack: number;

  @IsInt()
  @Min(1)
  requiredLevel: number;
}