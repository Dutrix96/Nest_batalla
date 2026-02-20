import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export type AuthPair = { email: string; password: string; token: string };

export async function bootstrapE2E(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  const prisma = app.get(PrismaService);

  return { app, prisma };
}

export async function cleanDb(prisma: PrismaService) {
  await prisma.battleParticipant.deleteMany();
  await prisma.battle.deleteMany();
  await prisma.character.deleteMany();
  await prisma.user.deleteMany();
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function registerAndLogin(
  app: INestApplication,
  dto?: Partial<{ email: string; password: string }>,
): Promise<AuthPair> {
  const email = (dto?.email ?? `user_${Date.now()}@test.com`).toLowerCase();
  const password = dto?.password ?? '123456';

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password })
    .expect(201);

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const token = res.body?.token;
  if (!token) throw new Error('No token en respuesta de /auth/login');

  return { email, password, token };
}

// Crea admin directo en BD (tu /auth/register siempre crea USER)
export async function ensureAdminAndLogin(app: INestApplication, prisma: PrismaService) {
  const email = `admin_${Date.now()}@test.com`;
  const password = '123456';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, passwordHash, role: 'ADMIN' },
  });

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const token = res.body?.token;
  if (!token) throw new Error('No token en login admin');

  return { email, password, token };
}

export async function seedCharacter(prisma: PrismaService, data?: Partial<{
  name: string;
  maxHp: number;
  attack: number;
  requiredLevel: number;
}>) {
  const name = data?.name ?? `Char_${Date.now()}`;
  const maxHp = data?.maxHp ?? 20;
  const attack = data?.attack ?? 5;
  const requiredLevel = data?.requiredLevel ?? 1;

  return prisma.character.create({
    data: {
      name,
      maxHp,
      hp: maxHp,
      attack,
      requiredLevel,
    },
  });
}