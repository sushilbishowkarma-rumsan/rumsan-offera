-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "managerCuid" TEXT,
ADD COLUMN     "orgUnit" TEXT,
ADD COLUMN     "phoneHome" TEXT,
ADD COLUMN     "phoneRecovery" TEXT,
ADD COLUMN     "phoneWork" TEXT;
