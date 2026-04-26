-- Create enum for report schedule frequency
CREATE TYPE "ReportFrequency" AS ENUM ('MONTHLY', 'WEEKLY');

-- Create report settings table
CREATE TABLE "report_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT,
    "frequency" "ReportFrequency" NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_settings_pkey" PRIMARY KEY ("id")
);

-- Ensure one settings row per user
CREATE UNIQUE INDEX "report_settings_userId_key" ON "report_settings"("userId");
CREATE INDEX "report_settings_userId_idx" ON "report_settings"("userId");

-- Foreign key
ALTER TABLE "report_settings" ADD CONSTRAINT "report_settings_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
