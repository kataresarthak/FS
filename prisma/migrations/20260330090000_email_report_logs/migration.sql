-- Create enums for email log tracking
CREATE TYPE "EmailLogType" AS ENUM ('MONTHLY_REPORT', 'BUDGET_ALERT', 'OTHER');
CREATE TYPE "EmailLogStatus" AS ENUM ('SENT', 'FAILED');

-- Create email logs table
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" "EmailLogType" NOT NULL DEFAULT 'OTHER',
    "status" "EmailLogStatus" NOT NULL DEFAULT 'SENT',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- Foreign key
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
