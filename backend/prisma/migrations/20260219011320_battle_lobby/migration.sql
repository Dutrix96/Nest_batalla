-- AlterEnum
ALTER TYPE "BattleStatus" ADD VALUE 'LOBBY';

-- AlterTable
ALTER TABLE "Battle" ALTER COLUMN "status" SET DEFAULT 'LOBBY';
