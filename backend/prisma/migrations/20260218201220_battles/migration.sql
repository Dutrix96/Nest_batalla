/*
  Warnings:

  - The `status` column on the `Battle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `attackerCharacterId` to the `Battle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetCharacterId` to the `Battle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('ACTIVE', 'FINISHED');

-- AlterTable
ALTER TABLE "Battle" ADD COLUMN     "attackerCharacterId" INTEGER NOT NULL,
ADD COLUMN     "targetCharacterId" INTEGER NOT NULL,
ADD COLUMN     "winnerCharacterId" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "BattleStatus" NOT NULL DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_attackerCharacterId_fkey" FOREIGN KEY ("attackerCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_targetCharacterId_fkey" FOREIGN KEY ("targetCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_winnerCharacterId_fkey" FOREIGN KEY ("winnerCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
