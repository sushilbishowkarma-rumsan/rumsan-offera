-- CreateTable
CREATE TABLE "WfhRequest" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT,
    "approverComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfhRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WfhRequest" ADD CONSTRAINT "WfhRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WfhRequest" ADD CONSTRAINT "WfhRequest_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
