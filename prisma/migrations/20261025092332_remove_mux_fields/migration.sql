/*
  Warnings:

  - You are about to drop the column `muxAssetId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `muxPlaybackId` on the `Lesson` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Lesson_muxAssetId_idx";

-- DropIndex
DROP INDEX "Lesson_muxPlaybackId_idx";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "muxAssetId",
DROP COLUMN "muxPlaybackId";
