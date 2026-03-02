-- CreateTable
CREATE TABLE "leave_policies" (
    "id" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "defaultQuota" INTEGER NOT NULL,
    "carryForwardLimit" INTEGER NOT NULL DEFAULT 0,
    "accrualRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxConsecutiveDays" INTEGER NOT NULL DEFAULT 1,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_leaveType_key" ON "leave_policies"("leaveType");
