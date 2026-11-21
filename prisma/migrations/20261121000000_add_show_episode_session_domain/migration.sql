-- CreateEnum
CREATE TYPE "EpisodeState" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Show" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "state" "EpisodeState" NOT NULL DEFAULT 'SCHEDULED',
    "publicJoinUrl" TEXT,
    "showId" UUID,
    "youtubeBroadcastId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowProducer" (
    "showId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowProducer_pkey" PRIMARY KEY ("showId","userId")
);

-- CreateTable
CREATE TABLE "EpisodeProducer" (
    "episodeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpisodeProducer_pkey" PRIMARY KEY ("episodeId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Show_slug_key" ON "Show"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_slug_key" ON "Episode"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_youtubeBroadcastId_key" ON "Episode"("youtubeBroadcastId");

-- CreateIndex
CREATE INDEX "Episode_showId_scheduledStartAt_idx" ON "Episode"("showId", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "Episode_state_scheduledStartAt_idx" ON "Episode"("state", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "ShowProducer_userId_idx" ON "ShowProducer"("userId");

-- CreateIndex
CREATE INDEX "EpisodeProducer_userId_idx" ON "EpisodeProducer"("userId");

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowProducer" ADD CONSTRAINT "ShowProducer_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowProducer" ADD CONSTRAINT "ShowProducer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeProducer" ADD CONSTRAINT "EpisodeProducer_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeProducer" ADD CONSTRAINT "EpisodeProducer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

