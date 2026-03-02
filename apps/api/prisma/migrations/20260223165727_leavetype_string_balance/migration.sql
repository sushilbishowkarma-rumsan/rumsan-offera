/*
  Warnings:

  - Changed the type of `leaveType` on the `LeaveBalance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "LeaveBalance" DROP COLUMN "leaveType",
ADD COLUMN     "leaveType" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveType_key" ON "LeaveBalance"("employeeId", "leaveType");
