-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "username" TEXT;

-- Backfill existing rows so the new column can become required.
WITH ranked_profiles AS (
    SELECT
        "id",
        CASE
            WHEN "email" IS NOT NULL AND split_part("email", '@', 1) <> '' THEN split_part("email", '@', 1)
            ELSE 'user'
        END AS base_username,
        ROW_NUMBER() OVER (
            PARTITION BY CASE
                WHEN "email" IS NOT NULL AND split_part("email", '@', 1) <> '' THEN split_part("email", '@', 1)
                ELSE 'user'
            END
            ORDER BY "created_at", "id"
        ) AS duplicate_rank
    FROM "profiles"
)
UPDATE "profiles" AS p
SET "username" = CASE
    WHEN ranked_profiles.duplicate_rank = 1 THEN ranked_profiles.base_username
    ELSE ranked_profiles.base_username || '_' || ranked_profiles.duplicate_rank
END
FROM ranked_profiles
WHERE p."id" = ranked_profiles."id";

UPDATE "profiles"
SET "username" = 'user_' || replace("id"::text, '-', '')
WHERE "username" IS NULL OR "username" = '';

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");
