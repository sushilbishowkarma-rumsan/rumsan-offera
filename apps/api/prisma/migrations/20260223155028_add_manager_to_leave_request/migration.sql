-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "approverComment" TEXT,
ADD COLUMN     "managerId" TEXT;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
