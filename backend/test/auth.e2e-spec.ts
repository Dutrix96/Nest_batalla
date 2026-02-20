import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { bootstrapE2E, cleanDb, registerAndLogin, authHeader } from './helpers/e2e-helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const boot = await bootstrapE2E();
    app = boot.app;
    prisma = boot.prisma;
  });

  beforeEach(async () => {
    await cleanDb(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register -> 201 y devuelve user+token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'pepe@test.com', password: '123456' })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', 'pepe@test.com');
    expect(res.body).toHaveProperty('token');
  });

  it('POST /auth/login -> 200 y devuelve token', async () => {
    const auth = await registerAndLogin(app, { email: 'ana@test.com' });
    expect(auth.token).toBeTruthy();
  });

  it('GET /auth/me -> 200 con token', async () => {
    const auth = await registerAndLogin(app, { email: 'me@test.com' });

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set(authHeader(auth.token))
      .expect(200);

    expect(res.body).toHaveProperty('email', 'me@test.com');
    expect(res.body).toHaveProperty('level');
  });

  it('GET /auth/me -> 401 sin token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});