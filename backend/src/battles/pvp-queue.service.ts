import { Injectable } from "@nestjs/common";
import { BattlesService } from "./battles.service";

type Waiting = {
  userId: number;
  queuedAt: number;
};

@Injectable()
export class PvpQueueService {
  private waiting: Waiting | null = null;

  constructor(private readonly battlesService: BattlesService) {}

  async queue(userId: number) {
    if (!this.waiting) {
      this.waiting = { userId, queuedAt: Date.now() };
      return { status: "QUEUED" as const };
    }

    if (this.waiting.userId === userId) {
      return { status: "QUEUED" as const };
    }

    const p1 = this.waiting.userId;
    const p2 = userId;
    this.waiting = null;

    const battle = await this.battlesService.createPvpLobby(p1, p2);

    return {
      status: "MATCHED" as const,
      battleId: battle.id,
      users: [p1, p2] as const,
    };
  }

  cancel(userId: number) {
    if (this.waiting?.userId === userId) this.waiting = null;
    return { status: "CANCELED" as const };
  }
}