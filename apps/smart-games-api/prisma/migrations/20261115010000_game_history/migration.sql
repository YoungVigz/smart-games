-- CreateEnum
CREATE TYPE "GameOutcome" AS ENUM ('WIN', 'LOSS', 'DRAW', 'SURRENDER');

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "gameKey" TEXT NOT NULL,
    "modeKey" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outcome" "GameOutcome" NOT NULL,
    "errors" INTEGER NOT NULL,
    "timeElapsed" INTEGER NOT NULL,
    "xpGained" INTEGER,
    "rewardVersion" TEXT,

    CONSTRAINT "GameParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameSession_gameKey_modeKey_finishedAt_idx" ON "GameSession"("gameKey", "modeKey", "finishedAt");

-- CreateIndex
CREATE INDEX "GameParticipant_userId_sessionId_idx" ON "GameParticipant"("userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipant_sessionId_userId_key" ON "GameParticipant"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve legacy solo history. createdAt was recorded at completion, so the
-- start time is an estimate from active playing time (pauses are unknown).
INSERT INTO "GameSession" ("id", "gameKey", "modeKey", "difficulty", "reason", "startedAt", "finishedAt", "durationSeconds")
SELECT "id", 'sudoku', 'solo', lower("difficulty"::text),
  CASE WHEN "status" = 'COMPLETED' THEN 'LEGACY_SOLVED' ELSE 'LEGACY_SURRENDERED' END,
  "createdAt" - make_interval(secs => "timeElapsed"), "createdAt", "timeElapsed"
FROM "SudokuGame" WHERE "status" IN ('COMPLETED', 'SURRENDERED');

INSERT INTO "GameParticipant" ("id", "sessionId", "userId", "outcome", "errors", "timeElapsed", "xpGained", "rewardVersion")
SELECT 'legacy:' || "id", "id", "userId",
  CASE WHEN "status" = 'COMPLETED' THEN 'WIN'::"GameOutcome" ELSE 'SURRENDER'::"GameOutcome" END,
  "errors", "timeElapsed", NULL, NULL
FROM "SudokuGame" WHERE "status" IN ('COMPLETED', 'SURRENDERED');
