/*
  Warnings:

  - You are about to drop the column `department` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "department" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "department";
