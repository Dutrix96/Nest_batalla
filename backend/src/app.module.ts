import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod'; //el uso de este paquete lo he metido ya que gpt asegura que es una buena practica de cara al env
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CharactersModule } from './characters/characters.module';
import { BattlesModule } from './battles/battles.module';
import { UsersModule } from './users/users.module';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(20),
  JWT_EXPIRES_IN: z.string().min(1),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
    PrismaModule,
    AuthModule,
    CharactersModule,
    BattlesModule,
    UsersModule,
  ],
})
export class AppModule {}