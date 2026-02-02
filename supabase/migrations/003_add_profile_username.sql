-- Add username to profiles and backfill from auth metadata
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

UPDATE profiles
SET username = COALESCE(auth.users.raw_user_meta_data->>'username', NULL)
FROM auth.users
WHERE profiles.id = auth.users.id
  AND profiles.username IS NULL;

-- Enforce unique usernames (case-insensitive) when present
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON profiles (LOWER(username))
  WHERE username IS NOT NULL;

