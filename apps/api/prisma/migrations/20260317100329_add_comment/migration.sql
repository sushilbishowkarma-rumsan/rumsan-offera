/*
  Warnings:

  - You are about to drop the column `carryForwardLimit` on the `leave_policies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "leave_policies" DROP COLUMN "carryForwardLimit",
ADD COLUMN     "comments" TEXT NOT NULL DEFAULT '';
