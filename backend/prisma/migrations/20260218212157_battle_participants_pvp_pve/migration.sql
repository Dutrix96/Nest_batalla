/*
  Warnings:

  - You are about to drop the column `initiatorCharacterId` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `initiatorSpecialUsed` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `opponentCharacterId` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `opponentSpecialUsed` on the `Battle` table. All the data in the column will be lost.
  - You are about to drop the column `winnerCharacterId` on the `Battle` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_initiatorCharacterId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_opponentCharacterId_fkey";

-- DropForeignKey
ALTER TABLE "Battle" DROP CONSTRAINT "Battle_winnerCharacterId_fkey";

-- AlterTable
ALTER TABLE "Battle" DROP COLUMN "initiatorCharacterId",
DROP COLUMN "initiatorSpecialUsed",
DROP COLUMN "opponentCharacterId",
DROP COLUMN "opponentSpecialUsed",
DROP COLUMN "winnerCharacterId",
ADD COLUMN     "winnerSide" "BattleSide";

-- CreateTable
CREATE TABLE "BattleParticipant" (
    "id" SERIAL NOT NULL,
    "battleId" INTEGER NOT NULL,
    "side" "BattleSide" NOT NULL,
    "userId" INTEGER,
    "characterId" INTEGER NOT NULL,
    "hp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "specialUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BattleParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BattleParticipant_battleId_idx" ON "BattleParticipant"("battleId");

-- CreateIndex
CREATE INDEX "BattleParticipant_userId_idx" ON "BattleParticipant"("userId");

-- CreateIndex
CREATE INDEX "BattleParticipant_characterId_idx" ON "BattleParticipant"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "BattleParticipant_battleId_side_key" ON "BattleParticipant"("battleId", "side");

-- AddForeignKey
ALTER TABLE "BattleParticipant" ADD CONSTRAINT "BattleParticipant_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleParticipant" ADD CONSTRAINT "BattleParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleParticipant" ADD CONSTRAINT "BattleParticipant_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
