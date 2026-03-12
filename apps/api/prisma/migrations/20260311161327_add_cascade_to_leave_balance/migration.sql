/*
  Warnings:

  - You are about to drop the column `date` on the `WfhRequest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rsofficeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leavePolicyId` to the `LeaveBalance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `WfhRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `WfhRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LeaveBalance" ADD COLUMN     "leavePolicyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rsofficeId" TEXT;

-- AlterTable
ALTER TABLE "WfhRequest" DROP COLUMN "date",
ADD COLUMN     "endDate" TEXT NOT NULL,
ADD COLUMN     "startDate" TEXT NOT NULL,
ADD COLUMN     "totalDays" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "User_rsofficeId_key" ON "User"("rsofficeId");

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leavePolicyId_fkey" FOREIGN KEY ("leavePolicyId") REFERENCES "leave_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
