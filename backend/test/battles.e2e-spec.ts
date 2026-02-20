import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import {
    bootstrapE2E,
    cleanDb,
    registerAndLogin,
    seedCharacter,
    authHeader,
} from './helpers/e2e-helpers';

describe('Battles (e2e)', () => {
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

    it('PVE: POST /battles crea batalla ACTIVE y permite /battles/attack', async () => {
        const user = await registerAndLogin(app, { email: 'pve@test.com' });

        const ini = await seedCharacter(prisma, { name: 'Hero', maxHp: 20, attack: 6, requiredLevel: 1 });
        const opp = await seedCharacter(prisma, { name: 'Mob', maxHp: 12, attack: 3, requiredLevel: 1 });

        const created = await request(app.getHttpServer())
            .post('/battles')
            .set(authHeader(user.token))
            .send({
                mode: 'PVE',
                initiatorCharacterId: ini.id,
                opponentCharacterId: opp.id,
            })
            .expect(201);

        expect(created.body).toHaveProperty('id');
        const battleId = created.body.id;

        await request(app.getHttpServer())
            .post('/battles/attack')
            .set(authHeader(user.token))
            .send({ battleId })
            .expect(201);

        const state = await request(app.getHttpServer())
            .get(`/battles/${battleId}`)
            .set(authHeader(user.token))
            .expect(200);

        expect(state.body).toHaveProperty('status');
        expect(state.body).toHaveProperty('initiator');
        expect(state.body).toHaveProperty('opponent');
        expect(state.body.initiator).toHaveProperty('character');
        expect(state.body.opponent).toHaveProperty('character');
    });

    it('PVP lobby: POST /battles/pvp-lobby + select-character x2 -> pasa a ACTIVE', async () => {
        const u1 = await registerAndLogin(app, { email: 'u1@test.com' });
        const u2 = await registerAndLogin(app, { email: 'u2@test.com' });

        const dbU2 = await prisma.user.findUnique({ where: { email: u2.email } });
        if (!dbU2) throw new Error('No existe u2 en DB');

        const c1 = await seedCharacter(prisma, { name: 'C1', maxHp: 20, attack: 5, requiredLevel: 1 });
        const c2 = await seedCharacter(prisma, { name: 'C2', maxHp: 20, attack: 5, requiredLevel: 1 });

        const lobby = await request(app.getHttpServer())
            .post('/battles/pvp-lobby')
            .set(authHeader(u1.token))
            .send({ opponentUserId: dbU2.id })
            .expect(201);

        const battleId = lobby.body.id;

        await request(app.getHttpServer())
            .post('/battles/select-character')
            .set(authHeader(u1.token))
            .send({ battleId, characterId: c1.id })
            .expect(201);

        await request(app.getHttpServer())
            .post('/battles/select-character')
            .set(authHeader(u2.token))
            .send({ battleId, characterId: c2.id })
            .expect(201);

        const state = await request(app.getHttpServer())
            .get(`/battles/${battleId}`)
            .set(authHeader(u1.token))
            .expect(200);

        expect(state.body).toHaveProperty('status', 'ACTIVE');
    });

    it('PVP: /battles/attack respeta turnos (si atacas fuera de turno -> 400)', async () => {
        const u1 = await registerAndLogin(app, { email: 't1@test.com' });
        const u2 = await registerAndLogin(app, { email: 't2@test.com' });

        const dbU2 = await prisma.user.findUnique({ where: { email: u2.email } });
        if (!dbU2) throw new Error('No existe u2 en DB');

        const c1 = await seedCharacter(prisma, { name: 'T1', maxHp: 20, attack: 5, requiredLevel: 1 });
        const c2 = await seedCharacter(prisma, { name: 'T2', maxHp: 20, attack: 5, requiredLevel: 1 });

        const lobby = await request(app.getHttpServer())
            .post('/battles/pvp-lobby')
            .set(authHeader(u1.token))
            .send({ opponentUserId: dbU2.id })
            .expect(201);

        const battleId = lobby.body.id;

        await request(app.getHttpServer())
            .post('/battles/select-character')
            .set(authHeader(u1.token))
            .send({ battleId, characterId: c1.id })
            .expect(201);

        await request(app.getHttpServer())
            .post('/battles/select-character')
            .set(authHeader(u2.token))
            .send({ battleId, characterId: c2.id })
            .expect(201);

        await request(app.getHttpServer())
            .post('/battles/attack')
            .set(authHeader(u1.token))
            .send({ battleId })
            .expect(201);

        await request(app.getHttpServer())
            .post('/battles/attack')
            .set(authHeader(u1.token))
            .send({ battleId })
            .expect(400);

        await request(app.getHttpServer())
            .post('/battles/attack')
            .set(authHeader(u2.token))
            .send({ battleId })
            .expect(201);
    });
});