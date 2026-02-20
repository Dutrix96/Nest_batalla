import { Module } from "@nestjs/common";
import { BattlesController } from "./battles.controller";
import { BattlesGateway } from "./battles.gateway";
import { BattlesService } from "./battles.service";
import { PvpQueueService } from "./pvp-queue.service";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>("JWT_SECRET"),
      }),
    }),
  ],
  controllers: [BattlesController],
  providers: [BattlesService, BattlesGateway, PvpQueueService],
})
export class BattlesModule {}