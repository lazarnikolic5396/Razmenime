DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
      AND e.enumlabel = 'family'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'family';
  END IF;
END $$;

