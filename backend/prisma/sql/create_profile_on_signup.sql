-- Run this in the Supabase SQL editor so new auth users automatically
-- get a matching public.profiles row.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles ("id", "email", "username", "full_name")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
      'user_' || replace(NEW.id::text, '-', '')
    ),
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), '')
  )
  ON CONFLICT ("id") DO UPDATE
  SET
    "email" = EXCLUDED."email",
    "username" = EXCLUDED."username",
    "full_name" = EXCLUDED."full_name",
    "updated_at" = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
