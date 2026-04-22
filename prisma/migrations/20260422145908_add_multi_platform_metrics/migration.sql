-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Platform" ADD VALUE 'instagram';
ALTER TYPE "Platform" ADD VALUE 'tiktok';

-- CreateTable
CREATE TABLE "PlatformMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "reachOrganic" INTEGER NOT NULL,
    "reachPaid" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "retentionRate" DOUBLE PRECISION NOT NULL,
    "followers" INTEGER NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ageSplitJson" JSONB NOT NULL,
    "geographyJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformMetric_userId_platform_snapshotDate_idx" ON "PlatformMetric"("userId", "platform", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformMetric_userId_platform_snapshotDate_key" ON "PlatformMetric"("userId", "platform", "snapshotDate");

-- CreateIndex
CREATE INDEX "AudienceSnapshot_userId_snapshotDate_idx" ON "AudienceSnapshot"("userId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "PlatformMetric" ADD CONSTRAINT "PlatformMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceSnapshot" ADD CONSTRAINT "AudienceSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
