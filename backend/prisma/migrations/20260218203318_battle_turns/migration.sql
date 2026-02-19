/*
  Warnings:

  - Added the required column `currentTurnCharacterId` to the `Battle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Battle" ADD COLUMN     "currentTurnCharacterId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_currentTurnCharacterId_fkey" FOREIGN KEY ("currentTurnCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
