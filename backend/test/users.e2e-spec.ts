import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import {
    bootstrapE2E,
    cleanDb,
    registerAndLogin,
    ensureAdminAndLogin,
    authHeader,
} from './helpers/e2e-helpers';

describe('Users (e2e)', () => {
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

    it('GET /users/ranking -> 200 y array', async () => {
        await registerAndLogin(app, { email: 'u1@test.com' });
        await registerAndLogin(app, { email: 'u2@test.com' });

        const res = await request(app.getHttpServer()).get('/users/ranking').expect(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /users (admin) -> crea usuario', async () => {
        const admin = await ensureAdminAndLogin(app, prisma);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: admin.email, password: admin.password })
            .expect(200);

        const token = login.body.access_token;

        const res = await request(app.getHttpServer())
            .post('/users')
            .set(authHeader(token))
            .send({ username: 'nuevo', email: 'nuevo@test.com', password: '123456', role: 'USER' })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email', 'nuevo@test.com');
    });

    it('POST /users (no admin) -> 403', async () => {
        const auth = await registerAndLogin(app);

        await request(app.getHttpServer())
            .post('/users')
            .set(authHeader(auth.token))
            .send({ username: 'x', email: 'x@test.com', password: '123456', role: 'USER' })
            .expect(403);
    });
});