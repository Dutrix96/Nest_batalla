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

describe('Characters (e2e)', () => {
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

    it('GET /characters requiere JWT (guard global del controller)', async () => {
        await request(app.getHttpServer()).get('/characters').expect(401);
    });

    it('POST /characters (ADMIN) crea character con maxHp/hp/attack', async () => {
        const admin = await ensureAdminAndLogin(app, prisma);

        const res = await request(app.getHttpServer())
            .post('/characters')
            .set(authHeader(admin.token))
            .send({ name: 'Gimli', maxHp: 30, attack: 7, requiredLevel: 1 })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name', 'Gimli');
        expect(res.body).toHaveProperty('maxHp', 30);
        expect(res.body).toHaveProperty('hp', 30);
        expect(res.body).toHaveProperty('attack', 7);
    });

    it('POST /characters/attack baja hp', async () => {
        const admin = await ensureAdminAndLogin(app, prisma);

        const a = await request(app.getHttpServer())
            .post('/characters')
            .set(authHeader(admin.token))
            .send({ name: 'Atacante', maxHp: 20, attack: 6, requiredLevel: 1 })
            .expect(201);

        const t = await request(app.getHttpServer())
            .post('/characters')
            .set(authHeader(admin.token))
            .send({ name: 'Objetivo', maxHp: 10, attack: 1, requiredLevel: 1 })
            .expect(201);

        const res = await request(app.getHttpServer())
            .post('/characters/attack')
            .set(authHeader(admin.token))
            .send({ attackerId: a.body.id, targetId: t.body.id })
            .expect((r) => {
                if (![200, 201].includes(r.status)) {
                    throw new Error(`Status inesperado: ${r.status}`);
                }
            });
        expect(res.body).toHaveProperty('damage', 6);
        expect(res.body.target).toHaveProperty('hp', 4);
    });

    it('POST /characters/reset (ADMIN) resetea hp=maxHp', async () => {
        const admin = await ensureAdminAndLogin(app, prisma);

        const c = await request(app.getHttpServer())
            .post('/characters')
            .set(authHeader(admin.token))
            .send({ name: 'ResetMe', maxHp: 10, attack: 2, requiredLevel: 1 })
            .expect(201);

        await request(app.getHttpServer())
            .post('/characters/attack')
            .set(authHeader(admin.token))
            .send({ attackerId: c.body.id, targetId: c.body.id + 9999 })
            .expect(404);
        await prisma.character.update({ where: { id: c.body.id }, data: { hp: 1 } });

        const res = await request(app.getHttpServer())
            .post('/characters/reset')
            .set(authHeader(admin.token))
            .expect(201);

        expect(res.body).toHaveProperty('message');
        const after = await prisma.character.findUnique({ where: { id: c.body.id } });
        expect(after?.hp).toBe(after?.maxHp);
    });

    it('POST /characters (USER) -> 403', async () => {
        const user = await registerAndLogin(app, { email: 'user@test.com' });

        await request(app.getHttpServer())
            .post('/characters')
            .set(authHeader(user.token))
            .send({ name: 'Nope', maxHp: 10, attack: 2, requiredLevel: 1 })
            .expect(403);
    });
});