-- Add YouTube as an optional per-lesson provider while preserving existing VCDN IDs.
CREATE TYPE "VideoProvider" AS ENUM ('VCDN', 'YOUTUBE');
ALTER TABLE "Lesson"
  ADD COLUMN "videoProvider" "VideoProvider" NOT NULL DEFAULT 'VCDN',
  ADD COLUMN "youtubeVideoId" TEXT;
