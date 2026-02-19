import { IsInt, Min } from "class-validator";

export class CreatePvpLobbyDto {
  @IsInt()
  @Min(1)
  opponentUserId: number;
}