import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { prisma } from "../src/prisma/prisma-client";
import { Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

type SeedChar = { name: string; maxHp: number; hp: number; attack: number; requiredLevel: number };
type SeedUser = { email: string; password: string; level: number; xp: number; wins: number; losses: number };

async function upsertAdmin() {
  const adminEmail = "admin@admin.com";
  const adminPassword = "admin1234";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      level: 1,
      xp: 0,
      wins: 0,
      losses: 0,
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      level: 1,
      xp: 0,
      wins: 0,
      losses: 0,
    },
  });

  console.log("Admin listo:", adminEmail);
}

async function upsertUsers() {
  const users: SeedUser[] = [
    { email: "pipo@clown.com", password: "user1234", level: 1, xp: 0, wins: 0, losses: 1 },
    { email: "maria@arena.com", password: "user1234", level: 2, xp: 40, wins: 3, losses: 2 },
    { email: "alba@arena.com", password: "user1234", level: 3, xp: 10, wins: 6, losses: 4 },
    { email: "alfredo@arena.com", password: "user1234", level: 4, xp: 85, wins: 11, losses: 7 },
    { email: "dutrix@arena.com", password: "user1234", level: 5, xp: 20, wins: 16, losses: 9 },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        role: Role.USER,
        level: u.level,
        xp: u.xp,
        wins: u.wins,
        losses: u.losses,
      },
      create: {
        email: u.email,
        passwordHash,
        role: Role.USER,
        level: u.level,
        xp: u.xp,
        wins: u.wins,
        losses: u.losses,
      },
    });
  }

  console.log("Users listos:", users.length);
}

async function upsertCharacters() {
  const characters: SeedChar[] = [
    // Nivel 1 (2)
    { name: "Gandalf el Gris", maxHp: 120, attack: 25, requiredLevel: 1 },
    { name: "Spider-Man", maxHp: 110, attack: 22, requiredLevel: 1 },

    // Nivel 2 (2)
    { name: "Legolas", maxHp: 125, attack: 27, requiredLevel: 2 },
    { name: "Geralt de Rivia", maxHp: 130, attack: 28, requiredLevel: 2 },

    // Nivel 3 (2)
    { name: "Darth Vader", maxHp: 160, attack: 30, requiredLevel: 3 },
    { name: "Aragorn", maxHp: 150, attack: 29, requiredLevel: 3 },

    // Nivel 4 (2)
    { name: "Elmo", maxHp: 175, attack: 33, requiredLevel: 4 },
    { name: "Alf", maxHp: 170, attack: 34, requiredLevel: 4 },

    // Nivel 5 (2)
    { name: "Sauron", maxHp: 180, attack: 35, requiredLevel: 5 },
    { name: "Thanos", maxHp: 190, attack: 36, requiredLevel: 5 },

    // Secreto Nivel 7 (1)
    { name: "La Chaty", maxHp: 250, attack: 55, requiredLevel: 7 },
  ].map((c) => ({ ...c, hp: c.maxHp }));

  for (const c of characters) {
    const exists = await prisma.character.findFirst({ where: { name: c.name } });

    if (exists) {
      await prisma.character.update({
        where: { id: exists.id },
        data: {
          maxHp: c.maxHp,
          hp: c.hp,
          attack: c.attack,
          requiredLevel: c.requiredLevel,
        },
      });
    } else {
      await prisma.character.create({ data: c });
    }
  }


  console.log("Personajes listos:", characters.length);
}

async function main() {
  await upsertAdmin();
  await upsertUsers();
  await upsertCharacters();

  console.log("Seed done: admin + 5 users + 11 characters");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });