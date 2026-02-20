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
        const u1 = await registerAndLogin(app, { email: 'u1@test.com' });
        await registerAndLogin(app, { email: 'u2@test.com' });

        const res = await request(app.getHttpServer())
            .get('/users/ranking')
            .set(authHeader(u1.token))
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /users (admin) -> crea usuario', async () => {
        const admin = await ensureAdminAndLogin(app, prisma);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: admin.email, password: admin.password })
            .expect((r) => {
                if (![200, 201].includes(r.status)) {
                    throw new Error(`Login status inesperado: ${r.status}`);
                }
            });

        const token = login.body.token;
        if (!token) throw new Error('No token en login admin');


        const res = await request(app.getHttpServer())
            .post('/users')
            .set(authHeader(token))
            .send({  email: 'nuevo@test.com', passwordHash: '123456', role: 'USER' })
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