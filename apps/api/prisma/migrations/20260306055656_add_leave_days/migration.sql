-- CreateTable
CREATE TABLE "LeaveDay" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dayType" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,

    CONSTRAINT "LeaveDay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeaveDay" ADD CONSTRAINT "LeaveDay_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
