-- CreateTable
CREATE TABLE "LeaveBalanceHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "used" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveBalanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalanceHistory_employeeId_leaveType_month_year_key" ON "LeaveBalanceHistory"("employeeId", "leaveType", "month", "year");

-- AddForeignKey
ALTER TABLE "LeaveBalanceHistory" ADD CONSTRAINT "LeaveBalanceHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
