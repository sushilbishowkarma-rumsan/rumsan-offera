/*
  Warnings:

  - Changed the type of `leaveType` on the `LeaveRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "LeaveRequest" DROP COLUMN "leaveType",
ADD COLUMN     "leaveType" TEXT NOT NULL;
