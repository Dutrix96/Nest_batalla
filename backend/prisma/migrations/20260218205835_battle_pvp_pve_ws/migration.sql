/*
  Warnings:

  - You are about to drop the column `attackerCharacterId` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `currentTurnCharacterId` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `targetCharacterId` on the `Battle` table. All the data in the column will be lost.
  - Added the required column `initiatorCharacterId` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initiatorUserId` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `opponentCharacterId` to the `Battle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BattleMode" AS ENUM ('PVP', 'PVE');

-- CreateEnum
CREATE TYPE "BattleSide" AS ENUM ('INITIATOR', 'OPPONENT');

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_attackerCharacterId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_currentTurnCharacterId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_targetCharacterId_fkey";

-- AlterTable
ALTER TABLE "Battle" DROP COLUMN "attackerCharacterId",
DROP COLUMN "currentTurnCharacterId",
DROP COLUMN "targetCharacterId",
ADD COLUMN     "currentTurnSide" "BattleSide" NOT NULL DEFAULT 'INITIATOR',
ADD COLUMN     "initiatorCharacterId" INTEGER NOT NULL,
ADD COLUMN     "initiatorSpecialUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "initiatorUserId" INTEGER NOT NULL,
ADD COLUMN     "mode" "BattleMode" NOT NULL,
ADD COLUMN     "opponentCharacterId" INTEGER NOT NULL,
ADD COLUMN     "opponentSpecialUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "opponentUserId" INTEGER,
ADD COLUMN     "winnerUserId" INTEGER;

-- CreateIndex
CREATE INDEX "Battle_status_idx" ON "Battle"("status");

-- CreateIndex
CREATE INDEX "Battle_initiatorUserId_idx" ON "Battle"("initiatorUserId");

-- CreateIndex
CREATE INDEX "Battle_opponentUserId_idx" ON "Battle"("opponentUserId");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_initiatorUserId_fkey" FOREIGN KEY ("initiatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_opponentUserId_fkey" FOREIGN KEY ("opponentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_initiatorCharacterId_fkey" FOREIGN KEY ("initiatorCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_opponentCharacterId_fkey" FOREIGN KEY ("opponentCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
